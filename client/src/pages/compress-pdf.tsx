import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Check, AlertCircle, FileDown, Target, Info, TrendingDown, 
  Gauge, FileText, Sparkles, Zap, Shield, Settings2, Upload, CheckCircle2, Loader2
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import { useSEO } from "@/hooks/use-seo";
import { PDFDocument } from "pdf-lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import ToolPageLayout from "@/components/layout/tool-page-layout";
import { toolContentData } from "@/lib/tool-content-data";
import { generateSmartFileName, enhanceDownloadName } from "@/lib/smart-file-namer";
import { compressToTargetSize, COMPRESSION_PRESETS } from "@/lib/pdf-compress";

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

// Tool Component - Core functionality only
function CompressPDFTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetSize, setTargetSize] = useState<TargetSize>("500KB");
  const [compressionLevel, setCompressionLevel] = useState(60);
  const [useAdvancedMode, setUseAdvancedMode] = useState(false);
  const [compressionMode, setCompressionMode] = useState<'highest' | 'hd' | 'balanced' | 'fast'>('highest');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const targetSizeOptions = [
    { value: '10KB', label: '10 KB', bytes: 10 * 1024 },
    { value: '20KB', label: '20 KB', bytes: 20 * 1024 },
    { value: '50KB', label: '50 KB', bytes: 50 * 1024 },
    { value: '100KB', label: '100 KB', bytes: 100 * 1024 },
    { value: '150KB', label: '150 KB', bytes: 150 * 1024 },
    { value: '200KB', label: '200 KB', bytes: 200 * 1024 },
    { value: '300KB', label: '300 KB', bytes: 300 * 1024 },
    { value: '500KB', label: '500 KB', bytes: 500 * 1024 },
    { value: '1MB', label: '1 MB', bytes: 1024 * 1024 },
    { value: '2MB', label: '2 MB', bytes: 2 * 1024 * 1024 },
    { value: '5MB', label: '5 MB', bytes: 5 * 1024 * 1024 },
    { value: 'max', label: 'Maximum Compression', bytes: 0 }
  ] as const;

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (file?.type === 'application/pdf') {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const compressPDF = async (params: CompressionParams): Promise<Uint8Array> => {
    if (!selectedFile) throw new Error('No file selected');
    
    const arrayBuffer = await selectedFile.arrayBuffer();
    const targetSizeBytes = getTargetSizeInBytes(targetSize);
    
    if (targetSizeBytes && targetSizeBytes > 0) {
      // Use target size compression
      const result = await compressToTargetSize(
        arrayBuffer,
        targetSizeBytes,
        params.onProgress,
        params.mode || 'highest'
      );
      return new Uint8Array(await result.blob.arrayBuffer());
    } else {
      // Use preset compression for max compression
      const preset = COMPRESSION_PRESETS[params.mode || 'highest'];
      const compressParams = {
        jpegQuality: preset.jpegQuality,
        scale: preset.scale,
        mode: preset.mode,
        onProgress: params.onProgress
      };
      
      const { compressToTargetSize: compress } = await import('@/lib/pdf-compress');
      // Use a reasonable default target for max compression (10% of original)
      const maxTargetSize = Math.floor(arrayBuffer.byteLength * 0.1);
      const result = await compressToTargetSize(
        arrayBuffer, 
        maxTargetSize, 
        params.onProgress, 
        params.mode || 'highest'
      );
      return new Uint8Array(await result.blob.arrayBuffer());
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Preparing compression...');
    setError(null);

    try {
      const params: CompressionParams = {
        jpegQuality: Math.round((compressionLevel / 100) * 95 + 5), // 5-100 range
        scale: compressionLevel / 100,
        mode: compressionMode,
        onProgress: (progress: number, message: string) => {
          setProgress(progress);
          setProgressMessage(message);
        }
      };

      const compressedBytes = await compressPDF(params);
      const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      
      const originalSize = selectedFile.size;
      const compressedSize = compressedBlob.size;
      const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100);
      const targetSizeBytes = getTargetSizeInBytes(targetSize);
      
      // Calculate accuracy if targeting specific size
      let accuracy = 100;
      if (targetSizeBytes && targetSizeBytes > 0) {
        const sizeDifference = Math.abs(compressedSize - targetSizeBytes);
        accuracy = Math.max(0, 100 - (sizeDifference / targetSizeBytes) * 100);
      }

      const compressionResult: CompressionResult = {
        originalSize,
        compressedSize,
        targetSize: targetSizeBytes,
        savings,
        compressedBlob,
        qualityUsed: params.jpegQuality,
        resolutionScale: params.scale,
        compressionMethod: compressionMode.toUpperCase(),
        accuracy: Math.round(accuracy),
        attempts: 1,
        mode: compressionMode
      };

      setResult(compressionResult);
    } catch (error) {
      console.error('Compression error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during compression');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleDownload = () => {
    if (!result || !selectedFile) return;
    
    const smartName = generateSmartFileName({
      originalName: selectedFile.name,
      operation: 'compress',
      size: result.compressedSize
    });
    
    const enhancedName = enhanceDownloadName(smartName.suggested, {
      compressionRatio: result.savings,
      targetSize: targetSize,
      quality: result.mode || 'compressed'
    });

    const url = URL.createObjectURL(result.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = enhancedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressMessage('');
  };

  return (
    <Card className="p-8 shadow-xl">
      {!selectedFile ? (
        <div className="space-y-8">
          <FileUpload
            accept="application/pdf"
            multiple={false}
            onFilesSelect={handleFileUpload}
            className="min-h-[300px]"
            title="Drop your PDF file here or click to browse"
            description="Upload the PDF you want to compress. All processing happens securely in your browser."
            maxSize={200 * 1024 * 1024} // 200MB
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Quick Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Target className="w-10 h-10 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold mb-2">Target Size Selection</h3>
              <p className="text-sm text-muted-foreground">Choose exact file size from 10KB to 5MB</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
              <Zap className="w-10 h-10 mx-auto mb-3 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold mb-2">Smart Compression</h3>
              <p className="text-sm text-muted-foreground">Advanced algorithms maintain quality</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
              <Shield className="w-10 h-10 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold mb-2">100% Private</h3>
              <p className="text-sm text-muted-foreground">All processing in your browser</p>
            </div>
          </div>
        </div>
      ) : result ? (
        <div className="space-y-8">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Compression Complete!</h2>
            <p className="text-lg text-muted-foreground">
              Your PDF has been compressed successfully
            </p>
          </div>

          {/* Compression Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
              <TrendingDown className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.savings}%</div>
              <div className="text-sm text-muted-foreground">Size Reduction</div>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
              <FileDown className="w-8 h-8 mx-auto mb-3 text-green-600 dark:text-green-400" />
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatFileSize(result.originalSize)}</div>
              <div className="text-sm text-muted-foreground">Original Size</div>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatFileSize(result.compressedSize)}</div>
              <div className="text-sm text-muted-foreground">Final Size</div>
            </div>
          </div>

          {/* Download Button */}
          <Button 
            onClick={handleDownload} 
            size="lg"
            className="w-full h-14 text-lg font-semibold"
          >
            <FileDown className="w-6 h-6 mr-3" />
            Download Compressed PDF
          </Button>

          {/* Reset Button */}
          <Button 
            onClick={reset} 
            variant="outline"
            className="w-full h-12 text-lg"
          >
            Compress Another PDF
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* File Info */}
          <div className="p-6 rounded-xl border-2 bg-gradient-to-r from-card to-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedFile.name}</h3>
                  <p className="text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={reset}
                className="px-6"
              >
                Change File
              </Button>
            </div>
          </div>

          {/* Target Size Selection */}
          <div className="space-y-6">
            <div>
              <label className="text-lg font-semibold mb-4 block">Choose Target Size</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {targetSizeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={targetSize === option.value ? "default" : "outline"}
                    className={cn(
                      "h-14 text-sm font-medium",
                      targetSize === option.value && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => setTargetSize(option.value as TargetSize)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Compression Mode */}
            <div>
              <label className="text-lg font-semibold mb-4 block">Compression Quality</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { value: 'highest' as const, label: 'Highest Quality', desc: 'Best quality, larger size' },
                  { value: 'hd' as const, label: 'High Definition', desc: 'Great quality, good size' },
                  { value: 'balanced' as const, label: 'Balanced', desc: 'Good quality, smaller size' },
                  { value: 'fast' as const, label: 'Maximum Compression', desc: 'Smallest size' }
                ].map((mode) => (
                  <div
                    key={mode.value}
                    className={cn(
                      "relative rounded-xl border-2 p-4 cursor-pointer transition-all",
                      compressionMode === mode.value ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/50 hover:shadow-md"
                    )}
                    onClick={() => setCompressionMode(mode.value)}
                  >
                    <div className="font-semibold text-sm mb-1">{mode.label}</div>
                    <div className="text-xs text-muted-foreground">{mode.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-4">
              <Progress value={progress} className="h-4" />
              <p className="text-center font-medium text-lg">
                {progressMessage}
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleCompress}
            disabled={isProcessing}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                {progressMessage}
              </>
            ) : (
              <>
                <Gauge className="w-6 h-6 mr-3" />
                Compress PDF to {targetSizeOptions.find(o => o.value === targetSize)?.label}
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

// Main Component with Layout
export default function CompressPDF() {
  const contentData = toolContentData["compress-pdf"];
  
  useSEO({
    title: "Compress PDF Online Free - Reduce PDF Size to 10KB-5MB | AltafToolsHub",
    description: "Free online PDF compressor to reduce file size to specific targets (10KB to 5MB). Smart compression preserves quality. 100% client-side processing ensures complete privacy.",
    path: "/compress-pdf",
    keywords: "compress pdf, reduce pdf size, pdf compressor online, compress pdf to 100kb, compress pdf to 50kb, pdf size reducer, online pdf compression, free pdf compressor, compress pdf 2025",
    ogImage: "https://www.altaftoolshub.com/og-compress-pdf.png",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "PDF Compressor - AltafToolsHub",
      "description": "Free online PDF compression tool with privacy-first approach. Reduce PDF size to specific targets from 10KB to 5MB.",
      "url": "https://www.altaftoolshub.com/compress-pdf",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "3456"
      }
    }],
    additionalMetaTags: [
      { name: "application-name", content: "PDF Compressor - AltafToolsHub" },
      { property: "article:section", content: "PDF Tools" },
      { property: "article:modified_time", content: new Date().toISOString() }
    ]
  });

  return (
    <ToolPageLayout
      toolName="Compress PDF Files"
      description="Reduce PDF file size to specific targets from 10KB to 5MB. Smart compression maintains quality while ensuring your files never leave your browser."
      trustBadge={contentData.trustBadge}
      trustIndicators={contentData.trustIndicators}
      toolComponent={<CompressPDFTool />}
      howItWorksSteps={contentData.howItWorksSteps}
      processingTime={contentData.processingTime}
      whyChooseData={contentData.whyChooseData}
      useCases={contentData.useCases}
      comparisons={contentData.comparisons}
      faqs={contentData.faqs}
      ratings={contentData.ratings}
      breadcrumbPath="/compress-pdf"
      categoryName="PDF Tools"
      categoryPath="/all-tools?category=pdf-management"
    />
  );
}