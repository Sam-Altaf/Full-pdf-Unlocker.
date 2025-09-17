// Smart File Namer - Browser-based file naming suggestions
// Generates descriptive file names based on content, operation, and date

interface FileNameOptions {
  originalName: string;
  operation?: 'compress' | 'convert' | 'merge' | 'split' | 'unlock' | 'watermark';
  fileType?: string;
  size?: number;
  pageCount?: number;
  quality?: string;
  date?: Date;
  customPrefix?: string;
}

interface SmartFileName {
  suggested: string;
  variations: string[];
  description: string;
}

// Common descriptive words for different operations
const OPERATION_DESCRIPTORS = {
  compress: ['compressed', 'reduced', 'optimized', 'small', 'compact', 'mini'],
  convert: ['converted', 'transformed', 'changed', 'formatted'],
  merge: ['merged', 'combined', 'joined', 'unified'],
  split: ['split', 'divided', 'separated', 'extracted'],
  unlock: ['unlocked', 'decrypted', 'opened', 'accessible'],
  watermark: ['watermarked', 'branded', 'marked', 'stamped']
};

const SIZE_DESCRIPTORS = {
  tiny: ['tiny', 'mini', 'micro'],
  small: ['small', 'compact', 'light'],
  medium: ['medium', 'standard', 'regular'],
  large: ['large', 'full', 'complete'],
  huge: ['huge', 'maximum', 'ultra']
};

const QUALITY_DESCRIPTORS = {
  low: ['basic', 'draft', 'eco'],
  medium: ['standard', 'normal', 'balanced'],
  high: ['high', 'premium', 'quality'],
  maximum: ['maximum', 'best', 'ultra', 'pro']
};

export function generateSmartFileName(options: FileNameOptions): SmartFileName {
  const {
    originalName,
    operation,
    fileType,
    size,
    pageCount,
    quality,
    date = new Date(),
    customPrefix
  } = options;

  // Extract base name without extension
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const extension = originalName.split('.').pop() || 'pdf';
  
  // Clean the base name (remove special characters, limit length)
  const cleanBaseName = cleanFileName(baseName);
  
  // Generate date strings
  const dateStr = formatDate(date);
  const timeStr = formatTime(date);
  
  // Generate size descriptor
  const sizeDescriptor = getSizeDescriptor(size);
  
  // Generate operation descriptor
  const operationDescriptor = operation ? OPERATION_DESCRIPTORS[operation][0] : '';
  
  // Generate quality descriptor
  const qualityDescriptor = quality ? getQualityDescriptor(quality) : '';
  
  // Build suggested name variations
  const variations: string[] = [];
  
  // Pattern 1: [operation]_[basename]_[date].[ext]
  if (operation) {
    variations.push(`${operationDescriptor}_${cleanBaseName}_${dateStr}.${extension}`);
  }
  
  // Pattern 2: [basename]_[size]_[date].[ext]
  if (sizeDescriptor) {
    variations.push(`${cleanBaseName}_${sizeDescriptor}_${dateStr}.${extension}`);
  }
  
  // Pattern 3: [date]_[basename]_[operation].[ext]
  if (operation) {
    variations.push(`${dateStr}_${cleanBaseName}_${operationDescriptor}.${extension}`);
  }
  
  // Pattern 4: [basename]_[quality]_v[time].[ext]
  if (qualityDescriptor) {
    variations.push(`${cleanBaseName}_${qualityDescriptor}_v${timeStr}.${extension}`);
  }
  
  // Pattern 5: [custom]_[basename]_[date].[ext]
  if (customPrefix) {
    variations.push(`${customPrefix}_${cleanBaseName}_${dateStr}.${extension}`);
  }
  
  // Pattern 6: Simple with operation
  if (operation) {
    variations.push(`${cleanBaseName}_${operationDescriptor}.${extension}`);
  }
  
  // Pattern 7: With page count
  if (pageCount !== undefined) {
    variations.push(`${cleanBaseName}_${pageCount}pages_${dateStr}.${extension}`);
  }
  
  // Pattern 8: Descriptive with all info
  if (operation && sizeDescriptor) {
    variations.push(`${operationDescriptor}_${sizeDescriptor}_${cleanBaseName}.${extension}`);
  }
  
  // Remove duplicates and limit to 5 variations
  const uniqueVariations = [...new Set(variations)].slice(0, 5);
  
  // Select the best suggestion based on available info
  let suggested = uniqueVariations[0] || `${cleanBaseName}_${dateStr}.${extension}`;
  
  // Generate description
  const description = generateDescription(options, suggested);
  
  return {
    suggested,
    variations: uniqueVariations,
    description
  };
}

function cleanFileName(name: string): string {
  // Remove special characters except underscore and hyphen
  let clean = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  // Remove multiple underscores
  clean = clean.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  clean = clean.replace(/^_+|_+$/g, '');
  
  // Limit length to 30 characters
  if (clean.length > 30) {
    clean = clean.substring(0, 30);
  }
  
  // If empty, use default
  if (!clean) {
    clean = 'document';
  }
  
  return clean.toLowerCase();
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}${minutes}`;
}

function getSizeDescriptor(size?: number): string {
  if (!size) return '';
  
  const sizeInMB = size / (1024 * 1024);
  
  if (sizeInMB < 0.5) return SIZE_DESCRIPTORS.tiny[0];
  if (sizeInMB < 2) return SIZE_DESCRIPTORS.small[0];
  if (sizeInMB < 10) return SIZE_DESCRIPTORS.medium[0];
  if (sizeInMB < 50) return SIZE_DESCRIPTORS.large[0];
  return SIZE_DESCRIPTORS.huge[0];
}

function getQualityDescriptor(quality: string): string {
  const lowerQuality = quality.toLowerCase();
  
  if (lowerQuality.includes('low') || lowerQuality.includes('basic')) {
    return QUALITY_DESCRIPTORS.low[0];
  }
  if (lowerQuality.includes('high') || lowerQuality.includes('premium')) {
    return QUALITY_DESCRIPTORS.high[0];
  }
  if (lowerQuality.includes('max') || lowerQuality.includes('best')) {
    return QUALITY_DESCRIPTORS.maximum[0];
  }
  
  return QUALITY_DESCRIPTORS.medium[0];
}

function generateDescription(options: FileNameOptions, fileName: string): string {
  const parts: string[] = [];
  
  if (options.operation) {
    parts.push(`${options.operation} file`);
  }
  
  if (options.size) {
    const sizeInMB = (options.size / (1024 * 1024)).toFixed(2);
    parts.push(`${sizeInMB}MB`);
  }
  
  if (options.pageCount) {
    parts.push(`${options.pageCount} pages`);
  }
  
  if (options.quality) {
    parts.push(`${options.quality} quality`);
  }
  
  const date = options.date || new Date();
  parts.push(`created ${date.toLocaleDateString()}`);
  
  return `${fileName} - ${parts.join(', ')}`;
}

// Function to suggest file names based on content analysis
export function suggestFileNameFromContent(
  content: string,
  fileType: string = 'pdf'
): string[] {
  const suggestions: string[] = [];
  const words = content.toLowerCase().split(/\s+/);
  const date = new Date();
  const dateStr = formatDate(date);
  
  // Find common document types
  const documentTypes = {
    invoice: ['invoice', 'bill', 'payment', 'amount', 'total'],
    report: ['report', 'analysis', 'summary', 'findings', 'conclusion'],
    contract: ['agreement', 'contract', 'terms', 'conditions', 'party'],
    letter: ['dear', 'sincerely', 'regards', 'letter', 'yours'],
    resume: ['resume', 'cv', 'experience', 'education', 'skills'],
    presentation: ['slide', 'presentation', 'agenda', 'overview', 'objectives'],
    manual: ['manual', 'guide', 'instructions', 'steps', 'procedure'],
    receipt: ['receipt', 'purchase', 'transaction', 'paid', 'order']
  };
  
  // Detect document type
  let detectedType = 'document';
  let maxMatches = 0;
  
  for (const [type, keywords] of Object.entries(documentTypes)) {
    const matches = keywords.filter(keyword => words.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedType = type;
    }
  }
  
  // Generate suggestions based on detected type
  suggestions.push(`${detectedType}_${dateStr}.${fileType}`);
  
  // Find potential title (first line or heading)
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const potentialTitle = cleanFileName(lines[0].substring(0, 50));
    if (potentialTitle && potentialTitle !== 'document') {
      suggestions.push(`${potentialTitle}_${dateStr}.${fileType}`);
    }
  }
  
  // Find dates in content
  const datePattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
  const foundDates = content.match(datePattern);
  if (foundDates && foundDates.length > 0) {
    const contentDate = foundDates[0].replace(/[\/\-]/g, '');
    suggestions.push(`${detectedType}_${contentDate}.${fileType}`);
  }
  
  // Find potential ID or reference numbers
  const refPattern = /\b([A-Z]{2,}[\d]{3,})\b/g;
  const refs = content.match(refPattern);
  if (refs && refs.length > 0) {
    suggestions.push(`${detectedType}_${refs[0].toLowerCase()}.${fileType}`);
  }
  
  // Add generic suggestion
  suggestions.push(`${detectedType}_edited_${dateStr}.${fileType}`);
  
  // Return unique suggestions
  return [...new Set(suggestions)].slice(0, 5);
}

// Function to batch rename multiple files
export function batchRenameFiles(
  files: { name: string; size?: number }[],
  operation?: string
): { original: string; suggested: string }[] {
  const date = new Date();
  const results: { original: string; suggested: string }[] = [];
  
  files.forEach((file, index) => {
    const smartName = generateSmartFileName({
      originalName: file.name,
      operation: operation as any,
      size: file.size,
      date
    });
    
    // Add index if multiple files
    let suggested = smartName.suggested;
    if (files.length > 1) {
      const ext = suggested.split('.').pop();
      const base = suggested.replace(/\.[^/.]+$/, '');
      suggested = `${base}_${index + 1}.${ext}`;
    }
    
    results.push({
      original: file.name,
      suggested
    });
  });
  
  return results;
}

// Export function to add smart naming to existing file download
export function enhanceDownloadName(
  originalName: string,
  blob: Blob,
  operation?: string
): string {
  const smartName = generateSmartFileName({
    originalName,
    operation: operation as any,
    size: blob.size,
    date: new Date()
  });
  
  return smartName.suggested;
}