import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local worker for privacy and offline capability
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Cache for rendered pages at different scales to avoid re-rendering
const scaleCache = new Map<string, RenderedPage[]>();

// Generate a unique identifier for a PDF
function generatePDFIdentifier(pdfBytes: ArrayBuffer): string {
  // Create a simple hash based on size and first few bytes
  const view = new Uint8Array(pdfBytes);
  const sampleSize = Math.min(1000, view.length);
  let hash = pdfBytes.byteLength;
  for (let i = 0; i < sampleSize; i += 100) {
    hash = ((hash << 5) - hash) + view[i];
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${pdfBytes.byteLength}_${Math.abs(hash)}`;
}

interface CompressionParams {
  jpegQuality: number;
  scale: number;
  onProgress?: (progress: number, message: string) => void;
  mode?: 'highest' | 'balanced' | 'fast' | 'custom' | 'hd'; // 'hd' for compatibility
  preserveText?: boolean;
}

interface PageImage {
  dataUrl: string;
  width: number;
  height: number;
}

interface RenderedPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

// Utility function to convert data URL to Uint8Array
function dataURLtoUint8Array(dataURL: string): Uint8Array {
  const base64String = dataURL.split(',')[1];
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert canvas to image with HD quality settings
function canvasToImage(canvas: HTMLCanvasElement, quality: number, format: 'jpeg' | 'png' = 'jpeg'): Promise<string> {
  return new Promise((resolve, reject) => {
    // For HD quality, use PNG for text-heavy content to preserve clarity
    const imageFormat = format === 'png' ? 'image/png' : 'image/jpeg';
    const imageQuality = format === 'png' ? undefined : quality;
    
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          // Fallback to toDataURL if blob fails
          if (format === 'png') {
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(canvas.toDataURL('image/jpeg', quality));
          }
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      imageFormat,
      imageQuality
    );
  });
}

// Get or render PDF pages at specified scale (with caching)
async function getOrRenderPages(
  pdfBytes: ArrayBuffer,
  scale: number,
  onProgress?: (progress: number, message: string) => void
): Promise<RenderedPage[]> {
  // Create unique cache key including PDF identifier and scale
  const pdfId = generatePDFIdentifier(pdfBytes);
  const cacheKey = `${pdfId}_${scale.toFixed(3)}`;
  
  // Check cache first
  if (scaleCache.has(cacheKey)) {
    if (onProgress) {
      onProgress(20, `Using cached render at scale ${scale.toFixed(2)}`);
    }
    return scaleCache.get(cacheKey)!;
  }
  
  // Clean up old cache entries if cache gets too large (keep last 10 entries)
  if (scaleCache.size > 10) {
    const firstKey = scaleCache.keys().next().value;
    if (firstKey) scaleCache.delete(firstKey);
  }
  
  // Render pages if not cached
  const renderedPages = await renderPDFPages(pdfBytes, scale, onProgress);
  
  // Store in cache with unique key
  scaleCache.set(cacheKey, renderedPages);
  
  return renderedPages;
}

// Render PDF pages to canvases at specified scale
async function renderPDFPages(
  pdfBytes: ArrayBuffer,
  scale: number,
  onProgress?: (progress: number, message: string) => void
): Promise<RenderedPage[]> {
  // Create a copy of the ArrayBuffer to avoid detachment issues
  const pdfBytesCopy = pdfBytes.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytesCopy });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const renderedPages: RenderedPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      const progress = Math.round((pageNum / numPages) * 20);
      onProgress(progress, `Rendering page ${pageNum} of ${numPages}`);
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Configure HD quality rendering with maximum quality settings
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    // Set high-quality rendering hints for better text clarity
    context.textRendering = 'optimizeLegibility';
    context.filter = 'none'; // No filtering for crisp text

    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    };
    await page.render(renderContext).promise;

    renderedPages.push({
      canvas,
      width: viewport.width,
      height: viewport.height
    });
  }

  return renderedPages;
}

// Convert rendered pages to images with HD quality preservation
async function convertPagesToImages(
  pages: RenderedPage[],
  quality: number,
  onProgress?: (progress: number, message: string) => void,
  mode: 'highest' | 'balanced' | 'fast' | 'custom' | 'hd' = 'balanced'
): Promise<PageImage[]> {
  const pageImages: PageImage[] = [];
  
  for (let i = 0; i < pages.length; i++) {
    if (onProgress) {
      const progress = 20 + Math.round((i / pages.length) * 30);
      onProgress(progress, `Compressing page ${i + 1} of ${pages.length} (${mode.toUpperCase()} mode)`);
    }
    
    // Always use JPEG for consistent compression behavior
    // Highest quality mode uses maximum quality for text clarity
    let adjustedQuality = quality;
    if (mode === 'highest' || mode === 'hd') {
      // Highest Quality: Maximum quality for best text preservation
      adjustedQuality = Math.min(0.99, quality + 0.08); // Significant boost for text clarity
    }
    
    const dataUrl = await canvasToImage(pages[i].canvas, adjustedQuality, 'jpeg');
    
    pageImages.push({
      dataUrl,
      width: pages[i].width,
      height: pages[i].height,
    });
  }
  
  return pageImages;
}

// Create PDF from images
async function createPDFFromImages(
  images: PageImage[],
  onProgress?: (progress: number, message: string) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  for (let i = 0; i < images.length; i++) {
    if (onProgress) {
      const progress = 50 + Math.round((i / images.length) * 40);
      onProgress(progress, `Building PDF page ${i + 1} of ${images.length}`);
    }

    const imageData = images[i].dataUrl;
    const imageBytes = dataURLtoUint8Array(imageData);
    
    // Embed image
    let embeddedImage;
    if (imageData.startsWith('data:image/jpeg')) {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else if (imageData.startsWith('data:image/png')) {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error('Unsupported image format');
    }

    // Create page with image dimensions
    const page = pdfDoc.addPage([images[i].width, images[i].height]);
    
    // Draw image on page
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: images[i].width,
      height: images[i].height,
    });
  }

  // Save with optimization
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
    updateFieldAppearances: false,
  });

  if (onProgress) {
    onProgress(95, 'Finalizing compression...');
  }

  return pdfBytes;
}

// HD Quality compression with advanced parameters
export async function compressPDFSimple(
  pdfBytes: ArrayBuffer,
  params: CompressionParams
): Promise<{ blob: Blob }> {
  const mode = params.mode || 'balanced';
  
  // Clear cache for each compression to avoid mixing PDFs
  clearRenderCache();
  
  // Highest quality mode adjustments for maximum text clarity
  let adjustedParams = { ...params };
  if (mode === 'highest' || mode === 'hd') {
    // Highest Quality: Maximum quality for text readability
    adjustedParams.jpegQuality = Math.max(params.jpegQuality, 0.92); // Very high floor for text
    adjustedParams.scale = Math.max(params.scale, 0.96); // Preserve text resolution
    console.log('Highest Quality Mode: Maximum quality settings for text clarity');
  } else if (mode === 'fast') {
    // Fast mode: Prioritize speed with reasonable quality
    adjustedParams.jpegQuality = Math.min(params.jpegQuality, 0.75);
    adjustedParams.scale = Math.min(params.scale, 0.85);
  }
  
  console.log(`Starting PDF compression in ${mode.toUpperCase()} mode:`, adjustedParams);
  
  try {
    // Get or render pages at specified scale (uses cache if available)
    const renderedPages = await getOrRenderPages(
      pdfBytes,
      adjustedParams.scale,
      adjustedParams.onProgress
    );
    
    // Convert to images with mode-specific quality settings
    const images = await convertPagesToImages(
      renderedPages,
      adjustedParams.jpegQuality,
      adjustedParams.onProgress,
      mode
    );
    
    // Create new PDF from images
    const compressedBytes = await createPDFFromImages(images, adjustedParams.onProgress);
    
    console.log(`Compression complete (${mode} mode). Original: ${pdfBytes.byteLength}, Compressed: ${compressedBytes.length}`);
    
    return { 
      blob: new Blob([compressedBytes], { type: 'application/pdf' })
    };
  } catch (error) {
    console.error('Error in PDF compression:', error);
    
    // Fallback to basic pdf-lib compression
    try {
      // Create a copy to avoid detachment issues
      const pdfBytesCopy = pdfBytes.slice(0);
      const pdfDoc = await PDFDocument.load(pdfBytesCopy);
      
      // Remove metadata
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('Compressed');
      pdfDoc.setCreator('PDF Compressor');
      
      // Get pages for potential scaling
      const pages = pdfDoc.getPages();
      if (params.scale !== 1) {
        pages.forEach(page => {
          const { width, height } = page.getSize();
          page.setSize(width * params.scale, height * params.scale);
          page.scale(params.scale, params.scale);
        });
      }
      
      const fallbackBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 10,
        updateFieldAppearances: false,
      });
      
      return { blob: new Blob([fallbackBytes], { type: 'application/pdf' }) };
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw error;
    }
  }
}

// Advanced Highest Quality compression using optimal parameters
export async function compressPDFAdvanced(
  pdfBytes: ArrayBuffer,
  params: CompressionParams
): Promise<Blob> {
  // Default to Highest mode for advanced compression
  const highestParams = { ...params, mode: params.mode || 'highest' as const };
  const result = await compressPDFSimple(pdfBytes, highestParams);
  return result.blob;
}

// Quality presets for easy use
export const COMPRESSION_PRESETS = {
  highest: {
    jpegQuality: 0.95, // Maximum quality for best text clarity
    scale: 0.98,       // Near-original resolution for sharp text
    mode: 'highest' as const,
    description: 'Highest Quality - Maximum text clarity and sharpness'
  },
  hd: {
    jpegQuality: 0.95, // Alias for highest quality for compatibility
    scale: 0.98,
    mode: 'highest' as const,
    description: 'Highest Quality - Maximum text clarity and sharpness'
  },
  balanced: {
    jpegQuality: 0.80,
    scale: 0.90,
    mode: 'balanced' as const,
    description: 'Balanced - Good quality with compression'
  },
  fast: {
    jpegQuality: 0.70,
    scale: 0.85,
    mode: 'fast' as const,
    description: 'Fast - Quick compression with acceptable quality'
  },
  extreme: {
    jpegQuality: 0.50,
    scale: 0.70,
    mode: 'fast' as const,
    description: 'Extreme - Maximum compression'
  }
};

// Clear cache before starting new compression
function clearRenderCache() {
  scaleCache.clear();
}

// HD Quality compression to achieve target size with optimal quality
export async function compressToTargetSize(
  pdfBytes: ArrayBuffer,
  targetSize: number,
  onProgress?: (progress: number, message: string) => void,
  mode: 'highest' | 'balanced' | 'fast' | 'hd' = 'balanced'
): Promise<{ blob: Blob; quality: number; scale: number; attempts: number; mode: string }> {
  // Create a copy to avoid ArrayBuffer detachment issues
  const pdfBytesCopy = pdfBytes.slice(0);
  // Clear previous render cache
  clearRenderCache();
  
  const originalSize = pdfBytes.byteLength;
  const compressionRatio = targetSize / originalSize;
  
  console.log(`Starting ${mode.toUpperCase()} compression: Original ${originalSize} bytes, Target ${targetSize} bytes, Ratio ${(compressionRatio * 100).toFixed(1)}%`);
  
  // HD Quality ranges with mode-specific adjustments
  let minQuality: number;
  let maxQuality: number;
  let minScale: number;
  let maxScale: number;
  
  if (mode === 'highest' || mode === 'hd') {
    // Highest Quality Mode: Maximum quality for text readability
    if (compressionRatio >= 0.7) {
      minQuality = 0.94; // Very high quality floor
      maxQuality = 0.99;
      minScale = 0.97;   // Near-original resolution
      maxScale = 1.0;
    } else if (compressionRatio >= 0.4) {
      minQuality = 0.90; // High quality even for medium compression
      maxQuality = 0.98;
      minScale = 0.94;   // Preserve text details
      maxScale = 1.0;
    } else if (compressionRatio >= 0.2) {
      minQuality = 0.85; // Still high quality for stronger compression
      maxQuality = 0.97;
      minScale = 0.90;   // Good text preservation
      maxScale = 1.0;
    } else if (compressionRatio >= 0.1) {
      minQuality = 0.78; // Decent quality for tight targets
      maxQuality = 0.95;
      minScale = 0.85;   // Acceptable text clarity
      maxScale = 0.97;
    } else {
      minQuality = 0.70; // Minimum acceptable for text
      maxQuality = 0.93;
      minScale = 0.78;   // Still readable text
      maxScale = 0.92;
    }
  } else if (mode === 'fast') {
    // Fast Mode: Prioritize speed with reasonable quality
    if (compressionRatio >= 0.5) {
      minQuality = 0.70;
      maxQuality = 0.85;
      minScale = 0.85;
      maxScale = 0.95;
    } else {
      minQuality = 0.50;
      maxQuality = 0.75;
      minScale = 0.70;
      maxScale = 0.90;
    }
  } else {
    // Balanced Mode: Original settings
    if (compressionRatio >= 0.7) {
      minQuality = 0.85;
      maxQuality = 0.99;
      minScale = 0.95;
      maxScale = 1.0;
    } else if (compressionRatio >= 0.4) {
      minQuality = 0.75;
      maxQuality = 0.98;
      minScale = 0.90;
      maxScale = 1.0;
    } else if (compressionRatio >= 0.2) {
      minQuality = 0.65;
      maxQuality = 0.95;
      minScale = 0.85;
      maxScale = 1.0;
    } else if (compressionRatio >= 0.1) {
      minQuality = 0.55;
      maxQuality = 0.90;
      minScale = 0.75;
      maxScale = 0.95;
    } else {
      minQuality = 0.40;
      maxQuality = 0.80;
      minScale = 0.60;
      maxScale = 0.90;
    }
  }
  
  let attempts = 0;
  const maxAttempts = 25; // Reduced since we're using cached renders
  const tolerance = 0.02; // 2% tolerance
  
  let bestUnderTarget: { blob: Blob; quality: number; scale: number; size: number } | null = null;
  let bestOverTarget: { blob: Blob; quality: number; scale: number; size: number } | null = null;
  
  // Test different scale values to find optimal combination
  const scalesToTest = [maxScale, (minScale + maxScale) / 2, minScale];
  let bestScale = maxScale;
  
  for (const testScale of scalesToTest) {
    if (attempts >= maxAttempts) break;
    
    // Binary search for optimal quality at this scale
    let searchMinQ = minQuality;
    let searchMaxQ = maxQuality;
    let lastSize = 0;
    let stableCount = 0;
    
    while (attempts < maxAttempts && searchMaxQ - searchMinQ > 0.005) {
      attempts++;
      const testQuality = (searchMinQ + searchMaxQ) / 2;
      
      if (onProgress) {
        const progress = Math.round((attempts / maxAttempts) * 80);
        onProgress(progress, `Optimizing compression... Attempt ${attempts}/${maxAttempts}`);
      }
      
      const params: CompressionParams = {
        jpegQuality: testQuality,
        scale: testScale,
        mode: mode,
        onProgress: (progress, message) => {
          if (onProgress && progress < 80) {
            const attemptProgress = Math.round((attempts - 1) / maxAttempts * 80);
            onProgress(attemptProgress, message);
          }
        }
      };
      
      const result = await compressPDFSimple(pdfBytesCopy, params);
      const currentSize = result.blob.size;
      
      console.log(`Attempt ${attempts}: Scale ${testScale.toFixed(2)}, Quality ${testQuality.toFixed(3)}, Size ${currentSize} (target ${targetSize})`);
      
      // Check if size hasn't changed (reached limit)
      if (currentSize === lastSize) {
        stableCount++;
        if (stableCount >= 2) {
          console.log('Size stabilized, trying different parameters');
          break;
        }
      } else {
        stableCount = 0;
      }
      lastSize = currentSize;
      
      // Update best results
      if (currentSize <= targetSize) {
        if (!bestUnderTarget || currentSize > bestUnderTarget.size) {
          bestUnderTarget = { 
            blob: result.blob, 
            quality: testQuality, 
            scale: testScale, 
            size: currentSize 
          };
          bestScale = testScale;
        }
        searchMinQ = testQuality; // Can increase quality
      } else {
        if (!bestOverTarget || currentSize < bestOverTarget.size) {
          bestOverTarget = { 
            blob: result.blob, 
            quality: testQuality, 
            scale: testScale, 
            size: currentSize 
          };
        }
        searchMaxQ = testQuality; // Must decrease quality
      }
      
      // Check if we've hit the target within tolerance
      const difference = Math.abs(currentSize - targetSize);
      if (difference <= targetSize * tolerance) {
        console.log(`Target achieved! Target: ${targetSize}, Achieved: ${currentSize}, Difference: ${difference} bytes (${(difference/targetSize*100).toFixed(1)}%)`);
        return { 
          blob: result.blob, 
          quality: testQuality, 
          scale: testScale, 
          attempts,
          mode 
        };
      }
    }
  }
  
  // Test adjacent scales for better targeting
  if (bestUnderTarget && bestUnderTarget.size < targetSize * 0.90 && attempts < maxAttempts - 5) {
    console.log('Testing adjacent scales for better targeting...');
    
    const adjacentScales = [
      bestScale + 0.02,
      bestScale + 0.05,
      bestScale - 0.02,
      bestScale - 0.05
    ].filter(s => s >= minScale && s <= maxScale && !scalesToTest.includes(s));
    
    for (const adjacentScale of adjacentScales) {
      if (attempts >= maxAttempts - 3) break;
      
      attempts++;
      const testQuality: number = bestUnderTarget.quality;
      
      const params: CompressionParams = {
        jpegQuality: testQuality,
        scale: adjacentScale,
        onProgress: (progress, message) => {
          if (onProgress) {
            const attemptProgress = Math.round((attempts / maxAttempts) * 80);
            onProgress(attemptProgress, message);
          }
        }
      };
      
      const result = await compressPDFSimple(pdfBytesCopy, params);
      const currentSize = result.blob.size;
      
      console.log(`Adjacent scale test: Scale ${adjacentScale.toFixed(2)}, Size ${currentSize}`);
      
      if (currentSize <= targetSize && currentSize > bestUnderTarget.size) {
        bestUnderTarget = {
          blob: result.blob,
          quality: testQuality,
          scale: adjacentScale,
          size: currentSize
        };
        bestScale = adjacentScale;
        
        // Check if we're close enough
        if (currentSize >= targetSize * 0.98) {
          console.log(`Optimal result achieved with adjacent scale: ${currentSize} bytes`);
          return { 
            blob: result.blob, 
            quality: testQuality, 
            scale: adjacentScale, 
            attempts,
            mode 
          };
        }
      }
    }
  }
  
  // If we have a result under target that's close enough, use it
  if (bestUnderTarget) {
    const fillRatio = bestUnderTarget.size / targetSize;
    console.log(`Best under target: ${bestUnderTarget.size} bytes (${(fillRatio * 100).toFixed(1)}% of target)`);
    
    // Try to get closer to target by fine-tuning quality upward
    if (fillRatio < 0.98 && attempts < maxAttempts) {
      console.log('Fine-tuning quality to get closer to target...');
      
      let fineQuality = bestUnderTarget.quality;
      const maxFineQuality = Math.min(bestUnderTarget.quality + 0.25, 0.99);  // Allow up to 0.99 quality
      
      // Binary search for optimal quality at best scale
      let minQ = fineQuality;
      let maxQ = maxFineQuality;
      
      while (maxQ - minQ > 0.005 && attempts < maxAttempts) {
        attempts++;
        fineQuality = (minQ + maxQ) / 2;
        
        const params: CompressionParams = {
          jpegQuality: fineQuality,
          scale: bestUnderTarget.scale,
          onProgress: (progress, message) => {
            if (onProgress) {
              const attemptProgress = Math.round(80 + (attempts / maxAttempts) * 20);
              onProgress(attemptProgress, message);
            }
          }
        };
        
        const result = await compressPDFSimple(pdfBytesCopy, params);
        const currentSize = result.blob.size;
        
        console.log(`Fine-tune ${attempts}: Quality ${fineQuality.toFixed(3)}, Size ${currentSize}`);
        
        if (currentSize <= targetSize) {
          if (currentSize > bestUnderTarget.size) {
            bestUnderTarget = {
              blob: result.blob,
              quality: fineQuality,
              scale: bestUnderTarget.scale,
              size: currentSize
            };
          }
          minQ = fineQuality; // Can increase quality
          
          // Check if we're close enough
          if (currentSize >= targetSize * 0.98) {
            console.log(`Optimal result achieved: ${currentSize} bytes (${(currentSize/targetSize*100).toFixed(1)}% of target)`);
            return {
              blob: result.blob,
              quality: fineQuality,
              scale: bestUnderTarget.scale,
              attempts,
              mode
            };
          }
        } else {
          maxQ = fineQuality; // Must decrease quality
        }
      }
      
      // Final micro-adjustments with very small steps
      if (bestUnderTarget.size < targetSize * 0.98 && attempts < maxAttempts) {
        console.log('Attempting micro-adjustments...');
        
        const microStep = 0.002;
        let microQuality = bestUnderTarget.quality;
        
        for (let i = 0; i < 10 && attempts < maxAttempts; i++) {
          attempts++;
          microQuality = Math.min(microQuality + microStep, 0.99);  // Allow up to 0.99
          
          const params: CompressionParams = {
            jpegQuality: microQuality,
            scale: bestUnderTarget.scale,
            onProgress: (progress, message) => {
              if (onProgress) {
                const attemptProgress = Math.round(90 + (attempts / maxAttempts) * 10);
                onProgress(attemptProgress, message);
              }
            }
          };
          
          const result = await compressPDFSimple(pdfBytesCopy, params);
          const currentSize = result.blob.size;
          
          console.log(`Micro-adjust ${i + 1}: Quality ${microQuality.toFixed(4)}, Size ${currentSize}`);
          
          if (currentSize <= targetSize) {
            bestUnderTarget = {
              blob: result.blob,
              quality: microQuality,
              scale: bestUnderTarget.scale,
              size: currentSize
            };
            
            if (currentSize >= targetSize * 0.98) {
              console.log(`Target achieved with micro-adjustment: ${currentSize} bytes`);
              return {
                blob: result.blob,
                quality: microQuality,
                scale: bestUnderTarget.scale,
                attempts,
                mode
              };
            }
          } else {
            break; // Stop if we exceed target
          }
        }
      }
    }
    
    // If best result is still way below target, try higher qualities
    if (bestUnderTarget.size < targetSize * 0.5 && attempts < maxAttempts + 10) {
      console.log('Result too small, trying higher qualities to get closer to target...');
      
      // Try qualities up to 0.99
      for (let q = Math.max(bestUnderTarget.quality, 0.9); q <= 0.99; q += 0.01) {
        attempts++;
        const params: CompressionParams = {
          jpegQuality: q,
          scale: bestUnderTarget.scale,
          onProgress: (progress, message) => {
            if (onProgress) {
              onProgress(95, `Fine-tuning to reach target...`);
            }
          }
        };
        
        const result = await compressPDFSimple(pdfBytesCopy, params);
        const currentSize = result.blob.size;
        
        console.log(`High quality attempt: Quality ${q.toFixed(2)}, Size ${currentSize}`);
        
        if (currentSize <= targetSize) {
          bestUnderTarget = {
            blob: result.blob,
            quality: q,
            scale: bestUnderTarget.scale,
            size: currentSize
          };
          
          // If we're getting close, stop
          if (currentSize >= targetSize * 0.95) {
            console.log(`Reached close to target with high quality: ${currentSize} bytes`);
            break;
          }
        } else {
          break; // Exceeded target
        }
      }
    }
    
    // Always return the best result we have, even if not perfect
    console.log(`Final result: ${bestUnderTarget.size} bytes (${(bestUnderTarget.size/targetSize*100).toFixed(1)}% of target), Quality: ${bestUnderTarget.quality.toFixed(3)}, Scale: ${bestUnderTarget.scale.toFixed(2)}`);
    
    // Log a warning if we couldn't get close, but still return the result
    if (bestUnderTarget.size < targetSize * 0.98) {
      console.warn(`Note: Could not achieve exact target. Best achieved: ${bestUnderTarget.size} bytes (${(bestUnderTarget.size/targetSize*100).toFixed(1)}% of target)`);
    }
    
    return { 
      blob: bestUnderTarget.blob, 
      quality: bestUnderTarget.quality, 
      scale: bestUnderTarget.scale, 
      attempts,
      mode 
    };
  }
  
  // If no under-target result, return the best over-target result
  if (bestOverTarget) {
    console.warn(`Target size too ambitious. Returning smallest possible: ${bestOverTarget.size} bytes (${(bestOverTarget.size/targetSize*100).toFixed(1)}% of target)`);
    return { 
      blob: bestOverTarget.blob, 
      quality: bestOverTarget.quality, 
      scale: bestOverTarget.scale, 
      attempts,
      mode 
    };
  }
  
  // Fallback: use middle-range settings
  console.log('No optimal result found, using fallback compression');
  const fallbackParams: CompressionParams = {
    jpegQuality: (minQuality + maxQuality) / 2,
    scale: (minScale + maxScale) / 2,
    onProgress
  };
  
  const fallbackResult = await compressPDFSimple(pdfBytes, fallbackParams);
  return { 
    blob: fallbackResult.blob, 
    quality: fallbackParams.jpegQuality, 
    scale: fallbackParams.scale, 
    attempts: attempts + 1,
    mode 
  };
}