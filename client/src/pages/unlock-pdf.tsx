import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Lock, Shield, Check, AlertCircle, Download, Eye, EyeOff,
  KeyRound, Sparkles, Zap, FileText, Unlock, CheckCircle2, Loader2
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import { useSEO } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";
import ToolPageLayout from "@/components/layout/tool-page-layout";
import { toolContentData } from "@/lib/tool-content-data";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface UnlockResult {
  originalSize: number;
  unlockedBlob: Blob;
}

// Tool Component - Core functionality only
function UnlockPDFTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UnlockResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (file?.type === 'application/pdf') {
      setSelectedFile(file);
      setResult(null);
      setError(null);
      setPassword("");
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const unlockPDF = async () => {
    if (!selectedFile || !password.trim()) {
      setError('Please provide both a PDF file and password');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Progress updates
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 200));

      const arrayBuffer = await selectedFile.arrayBuffer();
      
      setProgress(25);
      
      // Use PDF.js to load the password-protected PDF
      const pdfBytesCopy = arrayBuffer.slice(0);
      const loadingTask = pdfjsLib.getDocument({
        data: pdfBytesCopy,
        password: password
      });
      
      setProgress(40);
      
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      
      setProgress(50);
      
      // Create a new unlocked PDF using pdf-lib
      const newPdfDoc = await PDFDocument.create();
      
      // Render each page to canvas and add to new PDF
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const progressPercent = 50 + Math.round(((pageNum - 1) / numPages) * 40);
        setProgress(progressPercent);
        
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Create canvas to render page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to image and add to new PDF
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const imageBytes = dataURLtoUint8Array(imageDataUrl);
        const embeddedImage = await newPdfDoc.embedJpg(imageBytes);
        
        // Add page with image
        const pdfPage = newPdfDoc.addPage([viewport.width, viewport.height]);
        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }
      
      setProgress(90);
      
      // Save the unlocked PDF
      const unlockedBytes = await newPdfDoc.save();
      const unlockedBlob = new Blob([unlockedBytes], { type: 'application/pdf' });

      setProgress(100);
      
      const unlockResult: UnlockResult = {
        originalSize: selectedFile.size,
        unlockedBlob
      };

      setResult(unlockResult);
    } catch (error) {
      console.error('Unlock error:', error);
      if (error instanceof Error) {
        if (error.message.includes('password') || error.message.includes('Incorrect') || error.message.includes('PasswordException')) {
          setError('Incorrect password. Please check your password and try again.');
        } else if (error.message.includes('encrypted') || error.message.includes('InvalidPDFException')) {
          setError('Unable to read PDF. Please ensure the file is password-protected and not corrupted.');
        } else {
          setError(`Unable to unlock PDF: ${error.message}`);
        }
      } else {
        setError('An error occurred while unlocking the PDF');
      }
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Utility function to convert data URL to Uint8Array
  const dataURLtoUint8Array = (dataURL: string): Uint8Array => {
    const base64String = dataURL.split(',')[1];
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleDownload = () => {
    if (!result || !selectedFile) return;
    
    const fileName = selectedFile.name.replace('.pdf', '-unlocked.pdf');
    const url = URL.createObjectURL(result.unlockedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setPassword("");
    setProgress(0);
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
            title="Drop your password-protected PDF here or click to browse"
            description="Upload the PDF you want to unlock. All processing happens securely in your browser."
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
              <Lock className="w-10 h-10 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold mb-2">Password Protection</h3>
              <p className="text-sm text-muted-foreground">Remove passwords from protected PDFs</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
              <Shield className="w-10 h-10 mx-auto mb-3 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold mb-2">100% Secure</h3>
              <p className="text-sm text-muted-foreground">Files never leave your browser</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
              <Zap className="w-10 h-10 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold mb-2">Instant Processing</h3>
              <p className="text-sm text-muted-foreground">Unlock PDFs in seconds</p>
            </div>
          </div>
        </div>
      ) : result ? (
        <div className="space-y-8">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3">PDF Unlocked Successfully!</h2>
            <p className="text-lg text-muted-foreground">
              Your PDF is now password-free and ready to download
            </p>
          </div>

          {/* File Info */}
          <div className="p-6 rounded-xl border bg-gradient-to-r from-card to-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Unlock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedFile.name.replace('.pdf', '-unlocked.pdf')}</h3>
                  <p className="text-muted-foreground">
                    {formatFileSize(result.originalSize)} • Password Removed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <Button 
            onClick={handleDownload} 
            size="lg"
            className="w-full h-14 text-lg font-semibold"
          >
            <Download className="w-6 h-6 mr-3" />
            Download Unlocked PDF
          </Button>

          {/* Reset Button */}
          <Button 
            onClick={reset} 
            variant="outline"
            className="w-full h-12 text-lg"
          >
            Unlock Another PDF
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
                    {formatFileSize(selectedFile.size)} • Password Protected
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

          {/* Password Input */}
          <div className="space-y-4">
            <div>
              <label className="text-lg font-semibold mb-4 block">Enter PDF Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the PDF password..."
                  className="pr-12 h-14 text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && !isProcessing && unlockPDF()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-10 w-10 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This must be the password that was used to protect the PDF
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-4">
              <Progress value={progress} className="h-4" />
              <p className="text-center font-medium text-lg">
                Unlocking PDF... {progress}%
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Security Notice</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your PDF and password are processed entirely in your browser. Nothing is uploaded to our servers, 
                  ensuring complete privacy and security of your sensitive documents.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={unlockPDF}
            disabled={isProcessing || !password.trim()}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Unlocking PDF... {progress}%
              </>
            ) : (
              <>
                <KeyRound className="w-6 h-6 mr-3" />
                Unlock PDF
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

// Main Component with Layout
export default function UnlockPDF() {
  const contentData = toolContentData["unlock-pdf"];
  
  useSEO({
    title: "Unlock PDF Files Online - Remove PDF Password Free | AltafToolsHub",
    description: "Free online PDF unlocker to remove password protection from PDFs. 100% secure client-side processing. Your files and passwords never leave your browser.",
    path: "/unlock-pdf",
    keywords: "unlock pdf, remove pdf password, pdf unlocker, pdf password remover, decrypt pdf, unlock protected pdf, free pdf unlocker, online pdf unlock, pdf security remover 2025",
    ogImage: "https://www.altaftoolshub.com/og-unlock-pdf.png",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "PDF Unlocker - AltafToolsHub",
      "description": "Secure PDF password remover. Unlock password-protected PDFs directly in your browser with complete privacy.",
      "url": "https://www.altaftoolshub.com/unlock-pdf",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1234"
      }
    }],
    additionalMetaTags: [
      { name: "application-name", content: "PDF Unlocker - AltafToolsHub" },
      { property: "article:section", content: "PDF Tools" },
      { property: "article:modified_time", content: new Date().toISOString() }
    ]
  });

  return (
    <ToolPageLayout
      toolName="Unlock PDF Files"
      description="Remove password protection from PDFs securely in your browser. Your files and passwords never leave your device, ensuring complete privacy."
      trustBadge={contentData.trustBadge}
      trustIndicators={contentData.trustIndicators}
      toolComponent={<UnlockPDFTool />}
      howItWorksSteps={contentData.howItWorksSteps}
      processingTime={contentData.processingTime}
      whyChooseData={contentData.whyChooseData}
      useCases={contentData.useCases}
      comparisons={contentData.comparisons}
      faqs={contentData.faqs}
      ratings={contentData.ratings}
      breadcrumbPath="/unlock-pdf"
      categoryName="PDF Tools"
      categoryPath="/all-tools?category=pdf-management"
    />
  );
}