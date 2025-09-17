import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSEO, generateHowToSchema, generateSoftwareApplicationSchema } from "@/hooks/use-seo";
import { 
  FileText, Copy, Download, ArrowLeft, Upload, Sparkles, 
  Eye, Languages, AlertCircle, Check, Loader2, ScanLine,
  Image as ImageIcon, Globe, Type, FileOutput
} from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import ToolSEO from "@/components/seo/tool-seo";
import PrivacyNotice from "@/components/privacy-notice";
import Tesseract from 'tesseract.js';

interface ExtractedText {
  text: string;
  confidence: number;
  language: string;
  wordCount: number;
}

const SUPPORTED_LANGUAGES = [
  { value: 'eng', label: 'English', native: 'English' },
  { value: 'spa', label: 'Spanish', native: 'Español' },
  { value: 'fra', label: 'French', native: 'Français' },
  { value: 'deu', label: 'German', native: 'Deutsch' },
  { value: 'ita', label: 'Italian', native: 'Italiano' },
  { value: 'por', label: 'Portuguese', native: 'Português' },
  { value: 'rus', label: 'Russian', native: 'Русский' },
  { value: 'jpn', label: 'Japanese', native: '日本語' },
  { value: 'chi_sim', label: 'Chinese (Simplified)', native: '简体中文' },
  { value: 'chi_tra', label: 'Chinese (Traditional)', native: '繁體中文' },
  { value: 'kor', label: 'Korean', native: '한국어' },
  { value: 'ara', label: 'Arabic', native: 'العربية' },
  { value: 'hin', label: 'Hindi', native: 'हिन्दी' },
  { value: 'nld', label: 'Dutch', native: 'Nederlands' },
  { value: 'pol', label: 'Polish', native: 'Polski' }
];

export default function ExtractText() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [language, setLanguage] = useState("eng");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [extractedResult, setExtractedResult] = useState<ExtractedText | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // SEO structured data
  const howToSchema = generateHowToSchema({
    name: "How to Extract Text from Images",
    description: "Extract text from images using OCR technology directly in your browser",
    totalTime: "PT30S",
    steps: [
      { name: "Upload Image", text: "Select an image containing text (JPG, PNG, etc.)" },
      { name: "Choose Language", text: "Select the language of the text in the image" },
      { name: "Extract Text", text: "Click 'Extract Text' and wait for processing" },
      { name: "Copy or Download", text: "Copy the extracted text or download as a file" }
    ]
  });

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Image Text Extractor - AltafToolsHub",
    description: "Free OCR tool to extract text from images. Supports 15+ languages. 100% browser-based processing for complete privacy.",
    applicationCategory: "UtilitiesApplication",
    url: "https://www.altaftoolshub.com/extract-text",
    aggregateRating: { ratingValue: 4.8, ratingCount: 892, bestRating: 5 },
    featureList: [
      "Extract text from JPG, PNG, WebP, BMP images",
      "Support for 15+ languages",
      "100% client-side OCR processing",
      "Export as TXT file or copy to clipboard",
      "Confidence score for accuracy",
      "No server uploads required"
    ]
  });

  useSEO({
    title: "Extract Text from Images - Free OCR Tool | AltafToolsHub",
    description: "Free online OCR tool to extract text from images. Supports multiple languages. All processing happens in your browser for complete privacy. No uploads required.",
    path: "/extract-text",
    keywords: "ocr, extract text from image, image to text, optical character recognition, text extraction, ocr online, free ocr tool, tesseract ocr, image text reader",
    structuredData: [howToSchema, softwareSchema],
    ogImage: "https://www.altaftoolshub.com/og-extract-text.png"
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setExtractedResult(null);

    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const extractText = async () => {
    if (!selectedFile || !imagePreview) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStatus("Initializing OCR engine...");
    setError(null);

    try {
      // Modern Tesseract.js API with enhanced accuracy settings
      setProgressStatus(`Initializing OCR for ${language}...`);
      setProgress(20);
      
      const worker = await Tesseract.createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setProgress(20 + Math.floor(m.progress * 70));
          }
        }
      });
      
      // Configure for better accuracy and text extraction
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD, // Automatic page segmentation with OSD
        preserve_interword_spaces: '1', // Preserve spaces between words
        tessedit_create_hocr: '0', // Don't create HOCR output (faster)
        tessedit_create_tsv: '0', // Don't create TSV output (faster)
        tessedit_char_whitelist: '', // Allow all characters
        user_defined_dpi: '300', // Higher DPI for better recognition
      });
      
      setProgressStatus('Extracting text from image...');
      setProgress(50);
      
      // Process image with enhanced settings
      const { data } = await worker.recognize(imagePreview, {
        rotateAuto: true,
        rotateRadians: 0,
      });
      
      setProgress(90);
      setProgressStatus('Finalizing...');
      
      await worker.terminate();

      // Process results
      const extractedText = data.text.trim();
      const confidence = Math.round(data.confidence);
      const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

      if (extractedText.length === 0) {
        setError('No text could be extracted from this image. Please ensure the image contains readable text.');
        setIsProcessing(false);
        return;
      }

      setExtractedResult({
        text: extractedText,
        confidence,
        language,
        wordCount
      });

      toast({
        title: "Text Extracted Successfully",
        description: `Extracted ${wordCount} words with ${confidence}% confidence`,
      });

    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to extract text from image. Please try again with a clearer image.');
      toast({
        title: "Extraction Failed",
        description: "Could not extract text from the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressStatus("");
    }
  };

  const copyToClipboard = async () => {
    if (!extractedResult) return;

    try {
      await navigator.clipboard.writeText(extractedResult.text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text. Please try selecting and copying manually.",
        variant: "destructive"
      });
    }
  };

  const downloadText = () => {
    if (!extractedResult) return;

    const blob = new Blob([extractedResult.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Text file downloaded successfully.",
    });
  };

  const reset = () => {
    setSelectedFile(null);
    setImagePreview("");
    setExtractedResult(null);
    setError(null);
    setProgress(0);
    setProgressStatus("");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-500";
    if (confidence >= 70) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div className="min-h-screen pattern-bg">
      <ToolSEO 
        toolName="Image Text Extractor"
        description="Extract text from images using OCR technology"
        category="UtilitiesApplication"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Breadcrumbs items={[{ name: "Extract Text", url: "/extract-text" }]} />
        
        {/* Header */}
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => {
              const toolsSection = document.getElementById('tools-section');
              if (toolsSection) {
                window.history.pushState({}, '', '/');
                setTimeout(() => {
                  toolsSection.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500">
              <ScanLine className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Image Text Extractor</h1>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Extract text from images using advanced OCR technology. 
            All processing happens in your browser for complete privacy.
          </p>
        </div>

        <PrivacyNotice 
          message="All image processing happens locally in your browser. Your images never leave your device."
        />

        {/* Main Content with equal heights */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8 items-start">
          {/* Input Section */}
          <div className="space-y-6">
            {/* File Upload Card */}
            {!selectedFile ? (
              <FileUpload
                onFileSelect={handleFileSelect}
                accept="image/*"
                title="Upload your image"
                description="Drag & drop or click to select an image with text"
                className="min-h-[400px] lg:h-[450px]"
              />
            ) : (
              <Card className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold">Selected Image</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reset}
                    data-testid="button-change-image"
                  >
                    Change Image
                  </Button>
                </div>
                
                {imagePreview && (
                  <div className="relative rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={imagePreview} 
                      alt="Selected image"
                      className="w-full h-[350px] lg:h-[400px] object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <p data-testid="text-filename">{selectedFile.name}</p>
                </div>
              </Card>
            )}

            {/* Settings */}
            {selectedFile && (
              <Card className="p-6">
                <Label className="text-lg font-semibold mb-4 block">OCR Settings</Label>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language" className="mb-2 block">
                      Text Language
                    </Label>
                    <Select
                      value={language}
                      onValueChange={setLanguage}
                      disabled={isProcessing}
                    >
                      <SelectTrigger id="language" data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            <span className="flex items-center gap-2 overflow-hidden">
                              <Globe className="w-4 h-4 flex-shrink-0" />
                              <span>{lang.label} • {lang.native}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select the primary language of the text in your image
                    </p>
                  </div>

                  {error && (
                    <Alert className="border-destructive/20 bg-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription data-testid="text-error">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={extractText}
                    disabled={!selectedFile || isProcessing}
                    className="w-full btn-gradient text-white"
                    size="lg"
                    data-testid="button-extract"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Extracting Text...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 mr-2" />
                        Extract Text
                      </>
                    )}
                  </Button>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-center text-muted-foreground">
                        {progressStatus}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Output Section */}
          <div className="lg:sticky lg:top-4">
            {extractedResult ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold">Extracted Text</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      data-testid="button-copy"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadText}
                      data-testid="button-download"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-xl sm:text-2xl font-bold truncate" data-testid="stat-words">
                      {extractedResult.wordCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Words</div>
                  </div>
                  
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className={cn("text-xl sm:text-2xl font-bold", getConfidenceColor(extractedResult.confidence))}
                         data-testid="stat-confidence">
                      {extractedResult.confidence}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                  
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-xl sm:text-2xl font-bold truncate" data-testid="stat-chars">
                      {extractedResult.text.length.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Characters</div>
                  </div>
                </div>

                {/* Extracted Text */}
                <div className="relative">
                  <Textarea
                    value={extractedResult.text}
                    readOnly
                    className="min-h-[400px] max-h-[500px] resize-y font-mono text-sm overflow-auto"
                    data-testid="textarea-extracted"
                  />
                  <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs text-muted-foreground">
                    {extractedResult.text.split('\n').length} lines
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Text extracted successfully from image</span>
                </div>
              </Card>
            ) : selectedFile ? (
              <Card className="p-6 h-full min-h-[400px] lg:min-h-[500px] flex items-center justify-center border-dashed">
                <div className="text-center text-muted-foreground">
                  <div className="relative">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <ScanLine className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary opacity-60 animate-pulse" />
                  </div>
                  <p className="text-lg font-medium mb-2">Ready to Extract</p>
                  <p className="text-sm mb-4">
                    Click the "Extract Text" button to process your image
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center text-xs">
                    <Badge variant="secondary">Image loaded</Badge>
                    <Badge variant="secondary">{language.toUpperCase()}</Badge>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 h-full min-h-[400px] lg:min-h-[450px] flex items-center justify-center border-dashed">
                <div className="text-center text-muted-foreground">
                  <div className="relative">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <ScanLine className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary opacity-60 animate-pulse" />
                  </div>
                  <p className="text-lg font-medium mb-2">No text extracted yet</p>
                  <p className="text-sm mb-4">
                    Upload an image to begin text extraction
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center text-xs">
                    <Badge variant="secondary">JPG</Badge>
                    <Badge variant="secondary">PNG</Badge>
                    <Badge variant="secondary">WebP</Badge>
                    <Badge variant="secondary">BMP</Badge>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Languages className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Multi-Language Support</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Extract text in 15+ languages including English, Spanish, Chinese, Arabic, and more.
            </p>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <ScanLine className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Advanced OCR</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by Tesseract.js for accurate text recognition from images of any quality.
            </p>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <FileOutput className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Export Options</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy extracted text to clipboard or download as a TXT file for easy sharing.
            </p>
          </Card>
        </div>

        {/* Use Cases */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Common Use Cases</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-primary/10">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Digitize Printed Documents</p>
                <p className="text-sm text-muted-foreground">Convert scanned documents and photos to editable text</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-primary/10">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Extract Text from Screenshots</p>
                <p className="text-sm text-muted-foreground">Copy text from images, screenshots, and screen captures</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-primary/10">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Translate Image Text</p>
                <p className="text-sm text-muted-foreground">Extract foreign language text for translation</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-primary/10">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Archive Old Photos</p>
                <p className="text-sm text-muted-foreground">Extract and preserve text from historical documents</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Alert className="border-primary/20 bg-primary/5">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro Tips:</strong> For best results, use high-resolution images with clear text. 
            Ensure good contrast between text and background. Straight, well-lit images work best.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}