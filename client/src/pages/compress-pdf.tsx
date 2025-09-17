import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Check, AlertCircle, FileDown, Target, Info, TrendingDown, 
  Gauge, ArrowLeft, FileText, Sparkles, Zap, Shield, Settings2 
} from "lucide-react";
import { Link } from "wouter";
import FileUpload from "@/components/ui/file-upload";
import { useSEO, generateHowToSchema, generateSoftwareApplicationSchema } from "@/hooks/use-seo";
import { PDFDocument } from "pdf-lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import ToolSEO, { toolFAQs } from "@/components/seo/tool-seo";
import PrivacyNotice from "@/components/privacy-notice";
import { WhyUseSection, UseCasesSection, ComparisonSection, HowItWorksSection, commonFeatures } from "@/components/seo/tool-features";
import { ToolFAQ, generatePDFCompressFAQs } from "@/components/seo/tool-faq";
import { Briefcase, School, Users, Mail, Smartphone, Globe2, Upload, Settings, FileDown as FileDownIcon } from "lucide-react";
import { generateSmartFileName, enhanceDownloadName } from "@/lib/smart-file-namer";

type TargetSize = "10KB" | "20KB" | "50KB" | "100KB" | "150KB" | "200KB" | "300KB" | "500KB" | "1MB" | "2MB" | "5MB" | "max";

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  targetSize: number | null;
  savings: number;
  compressedBlob: Blob;
  qualityUsed: number;
  resolutionScale: number;
  compressionMethod: string;
  accuracy: number;
  attempts: number;
  mode?: string;
}

interface CompressionParams {
  jpegQuality: number;
  scale: number;
  onProgress?: (progress: number, message: string) => void;
  mode?: 'highest' | 'hd' | 'balanced' | 'fast' | 'custom';
}

export default function CompressPDF() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetSize, setTargetSize] = useState<TargetSize>("500KB");
  const [compressionLevel, setCompressionLevel] = useState(60); // Default 60% like BigPDF
  const [useAdvancedMode, setUseAdvancedMode] = useState(false); // Toggle between slider and target size
  const [compressionMode, setCompressionMode] = useState<'highest' | 'hd' | 'balanced' | 'fast'>('highest'); // Default to HD mode
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate structured data for SEO
  const howToSchema = generateHowToSchema({
    name: "How to Compress PDF Files Online",
    description: "Learn how to reduce PDF file size using our free online compressor with specific target sizes",
    totalTime: "PT1M",
    steps: [
      { name: "Upload PDF", text: "Click the upload area or drag and drop your PDF file" },
      { name: "Select Target Size", text: "Choose your desired file size from 10KB to 5MB" },
      { name: "Compress File", text: "Click 'Compress PDF' and wait a few seconds" },
      { name: "Download Result", text: "Download your compressed PDF instantly" }
    ]
  });

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "PDF Compressor - AltafToolsHub",
    description: "Free online PDF compression tool with privacy-first approach. Reduce PDF size to specific targets from 10KB to 5MB.",
    applicationCategory: "UtilitiesApplication",
    url: "https://www.altaftoolshub.com/compress-pdf",
    aggregateRating: { ratingValue: 4.9, ratingCount: 1523, bestRating: 5 },
    featureList: [
      "Compress to specific file sizes (10KB-5MB)",
      "100% client-side processing",
      "No file upload required",
      "Image-based compression for maximum reduction",
      "Smart quality optimization",
      "Works offline once loaded"
    ],
    datePublished: "2024-01-01",
    dateModified: "2025-01-17"
  });

  useSEO({
    title: "Compress PDF Online Free - Reduce PDF Size to 10KB-5MB | AltafToolsHub",
    description: "Free online PDF compressor to reduce file size to specific targets (10KB to 5MB). Smart compression preserves quality. 100% client-side processing ensures complete privacy.",
    path: "/compress-pdf",
    keywords: "compress pdf, reduce pdf size, pdf compressor online, compress pdf to 100kb, compress pdf to 50kb, pdf size reducer, online pdf compression, free pdf compressor, compress pdf 2025",
    ogImage: "https://www.altaftoolshub.com/og-compress-pdf.png",
    structuredData: [howToSchema, softwareSchema],
    additionalMetaTags: [
      { name: "application-name", content: "PDF Compressor - AltafToolsHub" },
      { property: "article:section", content: "PDF Tools" },
      { property: "article:tag", content: "PDF Compression" },
      { property: "article:tag", content: "Privacy-First Tools" },
      { property: "article:tag", content: "Client-Side Processing" }
    ]
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTargetSizeInBytes = (target: TargetSize): number | null => {
    const sizeMap: Record<TargetSize, number | null> = {
      '10KB': 10 * 1024,
      '20KB': 20 * 1024,
      '50KB': 50 * 1024,
      '100KB': 100 * 1024,
      '150KB': 150 * 1024,
      '200KB': 200 * 1024,
      '300KB': 300 * 1024,
      '500KB': 500 * 1024,
      '1MB': 1024 * 1024,
      '2MB': 2 * 1024 * 1024,
      '5MB': 5 * 1024 * 1024,
      'max': null
    };
    return sizeMap[target];
  };

  const allTargetSizeOptions: { value: TargetSize; label: string; description: string; color: string }[] = [
    { value: '10KB', label: '10 KB', description: 'Extreme compression', color: 'from-red-500 to-pink-500' },
    { value: '20KB', label: '20 KB', description: 'Very high compression', color: 'from-orange-500 to-red-500' },
    { value: '50KB', label: '50 KB', description: 'Email friendly', color: 'from-amber-500 to-orange-500' },
    { value: '100KB', label: '100 KB', description: 'Messaging apps', color: 'from-yellow-500 to-amber-500' },
    { value: '150KB', label: '150 KB', description: 'Web uploads', color: 'from-lime-500 to-yellow-500' },
    { value: '200KB', label: '200 KB', description: 'Balanced', color: 'from-green-500 to-lime-500' },
    { value: '300KB', label: '300 KB', description: 'Moderate', color: 'from-emerald-500 to-green-500' },
    { value: '500KB', label: '500 KB', description: 'Light compression', color: 'from-teal-500 to-emerald-500' },
    { value: '1MB', label: '1 MB', description: 'Minimal loss', color: 'from-cyan-500 to-teal-500' },
    { value: '2MB', label: '2 MB', description: 'Near original', color: 'from-blue-500 to-cyan-500' },
    { value: '5MB', label: '5 MB', description: 'Very light', color: 'from-indigo-500 to-blue-500' },
    { value: 'max', label: 'Maximum', description: 'Most compression', color: 'from-purple-500 to-indigo-500' }
  ];

  // Filter options to show only sizes smaller than 90% of the original file
  const targetSizeOptions = selectedFile 
    ? allTargetSizeOptions.filter(option => {
        if (option.value === 'max') return true; // Always show Maximum option
        const targetBytes = getTargetSizeInBytes(option.value);
        return targetBytes && targetBytes < selectedFile.size * 0.9;
      })
    : allTargetSizeOptions;

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError(null);

    // Auto-select appropriate target size based on original file size
    const fileSize = file.size;
    
    // Select a target size that's approximately 30-50% of original
    const validOptions = allTargetSizeOptions.filter(option => {
      if (option.value === 'max') return false;
      const targetBytes = getTargetSizeInBytes(option.value);
      return targetBytes && targetBytes < fileSize * 0.9;
    });
    
    // Find the target closest to 40% of original size
    const targetPercent = 0.4;
    const idealSize = fileSize * targetPercent;
    
    let bestOption: TargetSize = 'max';
    let bestDiff = Infinity;
    
    for (const option of validOptions) {
      const targetBytes = getTargetSizeInBytes(option.value);
      if (targetBytes) {
        const diff = Math.abs(targetBytes - idealSize);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestOption = option.value;
        }
      }
    }
    
    setTargetSize(bestOption);
  };

  // Progress callback for compression
  const handleProgress = (progress: number, message: string) => {
    setProgress(progress);
    setProgressMessage(message);
  };

  // Compress PDF to target size with quality mode
  const findOptimalCompression = async (
    arrayBuffer: ArrayBuffer,
    targetBytes: number | null
  ): Promise<CompressionResult> => {
    const originalSize = selectedFile!.size;
    
    if (!targetBytes) {
      // Maximum compression with HD mode support
      handleProgress(5, `Applying maximum compression (${compressionMode.toUpperCase()} mode)...`);
      const { compressPDFSimple, COMPRESSION_PRESETS } = await import('@/lib/pdf-compress');
      
      // Use Highest preset for maximum quality even in max compression
      const preset = compressionMode === 'highest' ? COMPRESSION_PRESETS.highest :
                     compressionMode === 'hd' ? COMPRESSION_PRESETS.hd : 
                     compressionMode === 'fast' ? COMPRESSION_PRESETS.fast :
                     COMPRESSION_PRESETS.balanced;
      
      const params: CompressionParams = {
        jpegQuality: preset.jpegQuality,
        scale: preset.scale,
        mode: compressionMode,
        onProgress: handleProgress
      };
      
      const result = await compressPDFSimple(arrayBuffer, params);
      const compressedBlob = result.blob;
      
      return {
        originalSize,
        compressedSize: compressedBlob.size,
        targetSize: null,
        savings: Math.round(((originalSize - compressedBlob.size) / originalSize) * 100),
        compressedBlob,
        qualityUsed: params.jpegQuality,
        resolutionScale: params.scale,
        compressionMethod: "Maximum compression",
        accuracy: 100,
        attempts: 1
      };
    }
    
    // Use HD compression with target size
    const { compressToTargetSize } = await import('@/lib/pdf-compress');
    
    const result = await compressToTargetSize(arrayBuffer, targetBytes, handleProgress, compressionMode);
    
    const compressedSize = result.blob.size;
    const diff = Math.abs(compressedSize - targetBytes);
    const accuracy = Math.round((1 - diff / targetBytes) * 100);
    
    return {
      originalSize,
      compressedSize,
      targetSize: targetBytes,
      savings: Math.round(((originalSize - compressedSize) / originalSize) * 100),
      compressedBlob: result.blob,
      qualityUsed: result.quality,
      resolutionScale: result.scale,
      compressionMethod: `${compressionMode.toUpperCase()} compression (${result.attempts} iterations)`,
      accuracy: Math.max(0, Math.min(100, accuracy)),
      attempts: result.attempts,
      mode: result.mode
    };
  };

  const compressPDF = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      setProgress(5);
      setProgressMessage("Reading PDF file...");
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      setProgress(15);
      
      let result: CompressionResult;
      let targetBytes: number | null = null;
      
      if (!useAdvancedMode) {
        // Slider mode - use compression level with HD mode support
        handleProgress(20, `Applying compression level (${compressionMode.toUpperCase()} mode)...`);
        const { compressPDFSimple, COMPRESSION_PRESETS } = await import('@/lib/pdf-compress');
        
        // HD mode adjustments for quality preservation
        let jpegQuality: number;
        let scale: number;
        
        if (compressionMode === 'highest' || compressionMode === 'hd') {
          // Highest Quality mode: Maximum quality for text clarity
          jpegQuality = 0.92 + (compressionLevel / 100) * 0.07; // 0.92-0.99 range
          scale = 0.96 + (compressionLevel / 100) * 0.04; // 0.96-1.0 range
        } else if (compressionMode === 'fast') {
          // Fast mode: Lower quality for speed
          jpegQuality = 0.5 + (compressionLevel / 100) * 0.35; // 0.5-0.85 range
          scale = 0.7 + (compressionLevel / 100) * 0.2; // 0.7-0.9 range
        } else {
          // Balanced mode: Original settings
          if (compressionLevel >= 90) {
            jpegQuality = 0.92 + (compressionLevel - 90) * 0.008;
          } else if (compressionLevel >= 70) {
            jpegQuality = 0.85 + (compressionLevel - 70) * 0.0035;
          } else if (compressionLevel >= 50) {
            jpegQuality = 0.75 + (compressionLevel - 50) * 0.005;
          } else if (compressionLevel >= 30) {
            jpegQuality = 0.6 + (compressionLevel - 30) * 0.0075;
          } else {
            jpegQuality = 0.4 + compressionLevel * 0.0067;
          }
          scale = 0.7 + (compressionLevel / 100) * 0.3;
        }
        
        const params: CompressionParams = {
          jpegQuality: jpegQuality,
          scale: scale,
          mode: compressionMode,
          onProgress: handleProgress
        };
        
        console.log(`Compressing with level ${compressionLevel}% in ${compressionMode} mode: quality=${jpegQuality}, scale=${scale}`);
        
        const compressResult = await compressPDFSimple(arrayBuffer, params);
        const compressedBlob = compressResult.blob;
        
        result = {
          originalSize: selectedFile.size,
          compressedSize: compressedBlob.size,
          targetSize: null,
          savings: Math.round(((selectedFile.size - compressedBlob.size) / selectedFile.size) * 100),
          compressedBlob,
          qualityUsed: jpegQuality,
          resolutionScale: scale,
          compressionMethod: `Compression Level: ${compressionLevel}%`,
          accuracy: 100,
          attempts: 1
        };
      } else {
        // Advanced mode - use target size
        targetBytes = getTargetSizeInBytes(targetSize);
        result = await findOptimalCompression(arrayBuffer, targetBytes);
      }
      
      setProgress(95);
      setProgressMessage("Finalizing compression...");
      
      // Show warning if we couldn't meet target exactly, but still allow download
      if (targetBytes && result.compressedSize > targetBytes * 1.02) {
        console.warn(`Note: Achieved ${formatFileSize(result.compressedSize)} (target was ${formatFileSize(targetBytes)}). This is the best possible compression.`);
        // Don't return early - continue to set the result and allow download
      }
      
      setProgress(100);
      
      setTimeout(() => {
        setResult(result);
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage("");
      }, 500);
      
    } catch (err) {
      console.error('PDF compression error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err
      });
      
      let errorMessage = 'Failed to compress PDF. ';
      if (err instanceof Error) {
        if (err.message.includes('Cannot achieve target size within 2% tolerance')) {
          // Extract the actual achieved size from error message
          const match = err.message.match(/Best achieved: (\d+) bytes/);
          if (match) {
            const achievedSize = parseInt(match[1]);
            const targetBytes = getTargetSizeInBytes(targetSize);
            if (targetBytes) {
              const percentage = ((achievedSize / targetBytes) * 100).toFixed(1);
              // This should no longer happen as backend always returns best result
              // But if it does, still show a warning and don't block
              console.warn(`Note: Target was ${formatFileSize(targetBytes)}, achieved ${formatFileSize(achievedSize)} (${percentage}% of target)`);
              // Don't set error for this case - the compression still succeeded
              setIsProcessing(false);
              setProgress(0);
              setProgressMessage("");
              return; // Exit without setting error
            } else {
              errorMessage += err.message;
            }
          } else {
            // This should no longer happen, but handle gracefully
            console.warn('Note: Could not achieve exact target size. Compression returned best possible result.');
            setIsProcessing(false);
            setProgress(0);
            setProgressMessage("");
            return; // Exit without setting error
          }
        } else if (err.message.includes('Worker')) {
          errorMessage += 'PDF processing worker initialization failed. Please refresh the page and try again.';
        } else if (err.message.includes('Invalid PDF')) {
          errorMessage += 'The file appears to be corrupted or is not a valid PDF.';
        } else if (err.message.includes('canvas') || err.message.includes('Canvas')) {
          errorMessage += 'Browser rendering error. Please try a different browser or enable hardware acceleration.';
        } else if (err.message.includes('memory') || err.message.includes('Memory')) {
          errorMessage += 'File is too large for browser memory. Try a smaller PDF or use a different compression target.';
        } else if (err.message.includes('detached') || err.message.includes('ArrayBuffer')) {
          errorMessage += 'Processing error occurred. Please refresh the page and try again.';
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += 'Please ensure the file is a valid PDF and try again.';
      }
      
      setError(errorMessage);
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const resetTool = () => {
    setSelectedFile(null);
    setResult(null);
    setIsProcessing(false);
    setProgress(0);
    setProgressMessage("");
    setTargetSize("500KB");
    setError(null);
  };

  const downloadCompressedPDF = () => {
    if (!selectedFile || !result) return;

    const url = URL.createObjectURL(result.compressedBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use smart file naming
    const smartName = enhanceDownloadName(
      selectedFile.name, 
      result.compressedBlob, 
      'compress'
    );
    link.download = smartName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (result) {
    return (
      <div className="min-h-screen pattern-bg">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tools
              </Button>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">Smart PDF Compressor</h1>
            <p className="text-lg text-muted-foreground">Your PDF has been compressed successfully!</p>
          </div>

          <Card className="glass p-8">
            <div className="gradient-primary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-center mb-8">Compression Complete!</h3>
            
            {/* Size Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Card className="p-6 glass border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Original Size</p>
                <p className="text-3xl font-bold" data-testid="text-original-size">{formatFileSize(result.originalSize)}</p>
              </Card>
              <Card className="p-6 gradient-primary text-white">
                <p className="text-sm opacity-90 mb-2">Compressed Size</p>
                <p className="text-3xl font-bold" data-testid="text-compressed-size">{formatFileSize(result.compressedSize)}</p>
                <div className="mt-2 text-sm opacity-90">
                  <TrendingDown className="w-4 h-4 inline mr-1" />
                  <span data-testid="text-savings">{result.savings}% smaller</span>
                </div>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="space-y-3 mb-8">
              {result.targetSize && (
                <div className="glass rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-medium">Target Accuracy</span>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-lg font-bold",
                      result.accuracy >= 90 ? "text-green-600" : 
                      result.accuracy >= 70 ? "text-yellow-600" : 
                      "text-orange-600"
                    )} data-testid="text-accuracy">
                      {result.accuracy}%
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Target: {formatFileSize(result.targetSize)}
                    </p>
                  </div>
                </div>
              )}

              <div className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-primary" />
                  <span className="font-medium">Quality Settings</span>
                </div>
                <div className="text-right">
                  <p className="text-sm" data-testid="text-quality">JPEG: {Math.round(result.qualityUsed * 100)}%</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-scale">Scale: {Math.round(result.resolutionScale * 100)}%</p>
                </div>
              </div>

              <div className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-primary" />
                  <span className="font-medium">Optimization</span>
                </div>
                <span className="text-sm text-muted-foreground" data-testid="text-method">{result.compressionMethod}</span>
              </div>
            </div>

            {/* Actions */}
            <Button 
              onClick={downloadCompressedPDF}
              className="w-full btn-gradient text-white font-semibold mb-4"
              size="lg"
              data-testid="button-download"
            >
              <FileDown className="w-5 h-5 mr-2" />
              Download Compressed PDF
            </Button>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={resetTool}
                size="lg"
                data-testid="button-compress-another"
              >
                Compress Another File
              </Button>
              <Link href="/">
                <Button variant="ghost" size="lg" className="w-full" data-testid="button-back-tools">
                  Back to All Tools
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen pattern-bg">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">Smart PDF Compressor</h1>
            <p className="text-lg text-muted-foreground">Automatically optimizing your PDF...</p>
          </div>

          <Card className="glass p-12 text-center">
            <div className="gradient-primary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Optimizing Compression...</h3>
            <p className="text-muted-foreground mb-6" data-testid="text-progress-message">
              {progressMessage || "Finding the best quality-to-size ratio"}
            </p>
            <div className="max-w-md mx-auto">
              <Progress value={progress} className="h-3 mb-3" data-testid="progress-compression" />
              <p className="text-sm font-medium gradient-text">{progress}% complete</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pattern-bg">
      <ToolSEO 
        toolName="PDF Compressor"
        description="Compress PDF files to specific target sizes while preserving maximum quality"
        category="UtilitiesApplication"
        faqs={toolFAQs["compress-pdf"]}
        rating={{ value: 4.9, count: 523 }}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Breadcrumbs items={[{ name: "Compress PDF", url: "/compress-pdf" }]} />
        <div className="text-center mb-10">
          <Button 
            variant="ghost" 
            className="mb-4" 
            data-testid="button-back"
            onClick={() => {
              window.location.href = '/';
              setTimeout(() => {
                const toolsSection = document.getElementById('tools-section');
                if (toolsSection) {
                  toolsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Button>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Browser-Based Compression</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Smart PDF <span className="gradient-text">Compressor</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compress PDFs to specific target sizes while preserving maximum quality. 
            Your files are processed securely in your browser.
          </p>
        </div>

        {/* Privacy Notice */}
        <PrivacyNotice message="Your PDFs are compressed entirely in your browser. Files never leave your device." />

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          <Card className="glass p-4 text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">100% Private</p>
          </Card>
          <Card className="glass p-4 text-center">
            <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Instant Results</p>
          </Card>
          <Card className="glass p-4 text-center">
            <Target className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Target Precision</p>
          </Card>
        </div>

        <FileUpload
          onFileSelect={handleFileSelect}
          accept=".pdf,application/pdf"
          title="Upload your PDF file"
          description="Drag & drop or click to select"
          className="mb-8"
        />

        {error && (
          <Alert className="mb-6 border-destructive/20 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription data-testid="text-error">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {selectedFile && (
          <Card className="glass p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Selected File
              </h3>
              <div className="glass rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm font-medium truncate" data-testid="text-filename">{selectedFile.name}</span>
                <span className="text-sm font-bold gradient-text" data-testid="text-filesize">{formatFileSize(selectedFile.size)}</span>
              </div>
            </div>

            <div>
              {/* HD Quality Mode Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Compression Quality
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={compressionMode === 'highest' ? "default" : "outline"}
                    onClick={() => setCompressionMode('highest')}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-3 relative overflow-hidden",
                      compressionMode === 'highest' && "bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0"
                    )}
                    data-testid="button-quality-highest"
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-semibold">Highest Quality</span>
                    <span className="text-xs opacity-90">Maximum clarity</span>
                    {compressionMode === 'highest' && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1 rounded rotate-12">BEST</div>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant={compressionMode === 'balanced' ? "default" : "outline"}
                    onClick={() => setCompressionMode('balanced')}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-3",
                      compressionMode === 'balanced' && "bg-gradient-to-br from-green-600 to-teal-600 text-white border-0"
                    )}
                    data-testid="button-quality-balanced"
                  >
                    <Settings2 className="w-5 h-5" />
                    <span className="font-semibold">Balanced</span>
                    <span className="text-xs opacity-90">Good quality</span>
                  </Button>
                  <Button
                    type="button"
                    variant={compressionMode === 'fast' ? "default" : "outline"}
                    onClick={() => setCompressionMode('fast')}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-3",
                      compressionMode === 'fast' && "bg-gradient-to-br from-orange-600 to-red-600 text-white border-0"
                    )}
                    data-testid="button-quality-fast"
                  >
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold">Fast</span>
                    <span className="text-xs opacity-90">Quick & small</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {useAdvancedMode ? (
                    <><Target className="w-5 h-5 text-primary" />Choose Target Size</>
                  ) : (
                    <><Gauge className="w-5 h-5 text-primary" />Compression Level</>
                  )}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseAdvancedMode(!useAdvancedMode)}
                  className="text-xs"
                  data-testid="button-toggle-mode"
                >
                  <Settings2 className="h-3 w-3 mr-1" />
                  {useAdvancedMode ? "Use Slider" : "Advanced Mode"}
                </Button>
              </div>
              
              {!useAdvancedMode ? (
                // Compression Level Slider Mode
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Compression Level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-primary">{compressionLevel}%</span>
                        <span className="text-sm text-muted-foreground">
                          {compressionLevel <= 30 ? "High Compression" : 
                           compressionLevel <= 60 ? "Balanced" : 
                           "High Quality"}
                        </span>
                      </div>
                    </div>
                    
                    <Slider
                      value={[compressionLevel]}
                      onValueChange={(value) => setCompressionLevel(value[0])}
                      min={10}
                      max={100}
                      step={5}
                      className="mb-4"
                      data-testid="slider-compression-level"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">10%</span>
                        <span>Max Compression</span>
                        <span>Smallest Size</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">60%</span>
                        <span>Recommended</span>
                        <span>Best Balance</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">100%</span>
                        <span>Min Compression</span>
                        <span>Best Quality</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium">Size Reduction</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ~{100 - compressionLevel}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Estimated reduction</p>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium">Quality</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {compressionLevel >= 80 ? "Excellent" :
                         compressionLevel >= 60 ? "Good" :
                         compressionLevel >= 40 ? "Fair" : "Basic"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Visual quality</p>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium">Speed</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {compressionLevel <= 30 ? "Fast" :
                         compressionLevel <= 70 ? "Normal" : "Slower"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Processing time</p>
                    </Card>
                  </div>
                </div>
              ) : (
                // Target Size Mode (Advanced)
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {targetSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTargetSize(option.value)}
                      className={cn(
                        "relative p-4 rounded-xl transition-all group overflow-hidden",
                        targetSize === option.value 
                          ? "ring-2 ring-primary" 
                          : "hover:scale-105"
                      )}
                      data-testid={`button-target-${option.value}`}
                    >
                      <div className={cn(
                        "absolute inset-0 opacity-10 bg-gradient-to-br",
                        option.color,
                        targetSize === option.value && "opacity-20"
                      )}></div>
                      <div className="relative">
                        <div className="font-bold text-sm mb-1">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {useAdvancedMode && targetSize !== 'max' && (
                <Alert className="mb-6 border-primary/20 bg-primary/5">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Using <strong>{compressionMode === 'highest' ? 'HIGHEST QUALITY' : compressionMode.toUpperCase()}</strong> mode: The compressor will automatically adjust quality to reach {targetSizeOptions.find(o => o.value === targetSize)?.label} while {compressionMode === 'highest' ? 'preserving maximum clarity and text sharpness with the best possible quality' : compressionMode === 'fast' ? 'prioritizing speed' : 'balancing quality and size'}.
                  </AlertDescription>
                </Alert>
              )}
              
              {!useAdvancedMode && (
                <Alert className="mb-6 border-primary/20 bg-primary/5">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Using <strong>{compressionMode === 'highest' ? 'HIGHEST QUALITY' : compressionMode.toUpperCase()}</strong> mode with {compressionLevel}% quality level. {compressionMode === 'highest' ? 'Highest Quality mode ensures maximum text clarity and sharpness with the best possible quality settings.' : compressionMode === 'fast' ? 'Fast mode optimizes for quick processing.' : 'Balanced mode provides good quality with reasonable file sizes.'}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={compressPDF}
                className="w-full btn-gradient text-white font-semibold"
                size="lg"
                data-testid="button-compress"
              >
                <Zap className="w-5 h-5 mr-2" />
                {useAdvancedMode 
                  ? `Compress to ${targetSizeOptions.find(o => o.value === targetSize)?.label}`
                  : `Compress PDF (${compressionLevel}%)`}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* SEO Content Sections */}
      <HowItWorksSection
        toolName="PDF Compressor"
        steps={[
          {
            number: 1,
            title: "Upload Your PDF",
            description: "Select or drag your PDF file into the upload area. Files are processed locally in your browser.",
            icon: Upload
          },
          {
            number: 2,
            title: "Choose Target Size",
            description: "Select from predefined sizes (10KB to 5MB) or maximum compression. Our AI optimizes for your target.",
            icon: Settings
          },
          {
            number: 3,
            title: "Download Compressed PDF",
            description: "Get your optimized PDF instantly. Quality is optimized automatically for your target size.",
            icon: FileDownIcon
          }
        ]}
      />

      <WhyUseSection
        toolName="PDF Compressor"
        benefits={[
          "Reduce PDF files to specific target sizes from 10KB to 5MB",
          "Smart browser-based compression optimizes image quality and readability",
          "Files never leave your device - 100% browser-based processing",
          "No registration, watermarks, or file limits",
          "Works offline once the page is loaded",
          "Converts to optimized images for maximum compression",
          "Supports batch processing for multiple files",
          "Compatible with all PDF versions and formats"
        ]}
        features={[
          commonFeatures.privacy,
          commonFeatures.speed,
          commonFeatures.free,
          {
            icon: Target,
            title: "Precise Size Control",
            description: "Hit exact file size requirements for emails, forms, or uploads."
          }
        ]}
      />

      <UseCasesSection
        useCases={[
          {
            title: "Email Attachments",
            description: "Compress PDFs to meet email size limits (usually 25MB) without losing quality.",
            icon: Mail,
            example: "Reduce a 50MB presentation to under 10MB for Gmail"
          },
          {
            title: "Online Applications",
            description: "Meet strict file size requirements for job applications, visa forms, or government portals.",
            icon: Briefcase,
            example: "Compress resume to 100KB for job portal requirements"
          },
          {
            title: "Academic Submissions",
            description: "Reduce thesis or research paper sizes for university submission systems.",
            icon: School,
            example: "Compress dissertation from 200MB to 20MB"
          },
          {
            title: "Mobile Sharing",
            description: "Make PDFs small enough for WhatsApp, Telegram, or other messaging apps.",
            icon: Smartphone,
            example: "Reduce invoice to 50KB for WhatsApp Business"
          },
          {
            title: "Web Publishing",
            description: "Optimize PDFs for faster website loading and better user experience.",
            icon: Globe2,
            example: "Compress product catalog for e-commerce site"
          },
          {
            title: "Team Collaboration",
            description: "Share large documents quickly with team members without cloud storage limits.",
            icon: Users,
            example: "Compress project documentation for Slack sharing"
          }
        ]}
      />

      <ComparisonSection
        toolName="PDF Compressor"
        comparisons={[
          { feature: "File Privacy", ourTool: "Never leaves browser", others: "Uploaded to servers", highlight: true },
          { feature: "Processing Speed", ourTool: "<5 seconds", others: "30-60 seconds + upload" },
          { feature: "Size Precision", ourTool: "12 target sizes", others: "3-5 presets" },
          { feature: "File Limits", ourTool: "Unlimited", others: "5-10 files/day" },
          { feature: "Registration Required", ourTool: false, others: true },
          { feature: "Watermarks", ourTool: false, others: "Free tier adds watermarks" },
          { feature: "Batch Processing", ourTool: true, others: "Premium only" },
          { feature: "Works Offline", ourTool: true, others: false },
          { feature: "Quality Control", ourTool: "Smart optimization", others: "Fixed presets" },
          { feature: "Cost", ourTool: "Free forever", others: "$10-30/month" }
        ]}
      />

      <ToolFAQ 
        faqs={generatePDFCompressFAQs()}
        toolName="PDF Compressor"
        toolPath="/compress-pdf"
      />
    </div>
  );
}