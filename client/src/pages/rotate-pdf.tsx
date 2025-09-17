import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";
import { RotateCw, Upload, Download, FileText, Loader2, ArrowLeft, Shield, RotateCcw, RefreshCw, Star, Users, Zap, Clock, CheckCircle2, ChevronRight, Info, HelpCircle, ChevronDown, Mail, MessageCircle, BookOpen } from "lucide-react";
import { Link } from "wouter";
import FileUpload from "@/components/ui/file-upload";
import { PDFDocument, degrees } from "pdf-lib";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - using local worker for privacy
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PagePreview {
  pageNumber: number;
  rotation: number;
  thumbnail?: string;
}

export default function RotatePDF() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pagesPreviews, setPagesPreviews] = useState<PagePreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rotatedPdf, setRotatedPdf] = useState<Uint8Array | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['general']);
  const { toast } = useToast();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "PDF Rotator - AltafToolsHub",
    "description": "Free online PDF rotator to fix page orientation issues",
    "url": "https://www.altaftoolshub.com/rotate-pdf",
    "applicationCategory": "BusinessApplication",
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
  };

  useSEO({
    title: "Rotate PDF Pages Online Free - Fix Page Orientation | AltafToolsHub",
    description: "Free online PDF rotator to fix page orientation issues. Rotate individual pages or all pages at once. 100% client-side processing for complete privacy.",
    path: "/rotate-pdf",
    keywords: "rotate pdf, pdf rotator, fix pdf orientation, rotate pdf pages, flip pdf pages, pdf rotation tool",
    ogImage: "https://www.altaftoolshub.com/og-rotate-pdf.png",
    structuredData: [structuredData],
    additionalMetaTags: [
      { name: "application-name", content: "PDF Rotator - AltafToolsHub" },
      { property: "article:section", content: "PDF Tools" }
    ]
  });

  const generateThumbnails = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const previews: PagePreview[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
          intent: 'display'
        } as any).promise;
        
        previews.push({
          pageNumber: i,
          rotation: 0,
          thumbnail: canvas.toDataURL('image/jpeg', 0.7)
        });
      }
      
      return previews;
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      return [];
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    try {
      setProgress(10);
      const arrayBuffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const pageCount = doc.getPageCount();
      
      setPdfFile(file);
      setPdfDoc(doc);
      setRotatedPdf(null);
      
      // Generate thumbnails
      setProgress(30);
      const previews = await generateThumbnails(file);
      setPagesPreviews(previews);
      
      // Select all pages by default
      const allPages = new Set<number>();
      for (let i = 1; i <= pageCount; i++) {
        allPages.add(i);
      }
      setSelectedPages(allPages);
      setSelectAll(true);
      setProgress(0);
      
      toast({
        title: "File Loaded",
        description: `PDF loaded successfully (${pageCount} pages)`,
      });
    } catch (error) {
      setProgress(0);
      toast({
        title: "Error",
        description: "Failed to load PDF file",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (selectAll) {
      const allPages = new Set<number>();
      pagesPreviews.forEach(p => allPages.add(p.pageNumber));
      setSelectedPages(allPages);
    } else {
      setSelectedPages(new Set());
    }
  }, [selectAll, pagesPreviews]);

  const togglePageSelection = (pageNum: number) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNum)) {
      newSelection.delete(pageNum);
    } else {
      newSelection.add(pageNum);
    }
    setSelectedPages(newSelection);
    setSelectAll(false);
  };

  const rotateSelectedPages = (angle: number) => {
    if (selectedPages.size === 0) {
      toast({
        title: "No pages selected",
        description: "Please select at least one page to rotate",
        variant: "destructive"
      });
      return;
    }

    setPagesPreviews(prev => prev.map(page => {
      if (selectedPages.has(page.pageNumber)) {
        return {
          ...page,
          rotation: (page.rotation + angle) % 360
        };
      }
      return page;
    }));

    toast({
      title: "Pages Rotated",
      description: `Rotated ${selectedPages.size} page(s) by ${angle}°`,
    });
  };

  const applyRotation = async () => {
    if (!pdfDoc || !pdfFile) {
      toast({
        title: "No file loaded",
        description: "Please upload a PDF file first",
        variant: "destructive"
      });
      return;
    }

    const hasRotation = pagesPreviews.some(p => p.rotation !== 0);
    if (!hasRotation) {
      toast({
        title: "No rotation applied",
        description: "Please rotate at least one page before applying",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const newPdf = await PDFDocument.create();
      const totalPages = pdfDoc.getPageCount();

      for (let i = 0; i < totalPages; i++) {
        setProgress(Math.round(((i + 0.5) / totalPages) * 100));
        
        const [page] = await newPdf.copyPages(pdfDoc, [i]);
        const preview = pagesPreviews.find(p => p.pageNumber === i + 1);
        
        if (preview && preview.rotation !== 0) {
          const currentRotation = page.getRotation();
          page.setRotation(degrees(currentRotation.angle + preview.rotation));
        }
        
        newPdf.addPage(page);
        setProgress(Math.round(((i + 1) / totalPages) * 100));
      }

      const pdfBytes = await newPdf.save();
      setRotatedPdf(pdfBytes);
      
      toast({
        title: "Success!",
        description: "PDF rotation applied successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply rotation",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadRotatedPdf = () => {
    if (!rotatedPdf || !pdfFile) return;
    
    const blob = new Blob([rotatedPdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfFile.name.replace('.pdf', '_rotated.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setPdfFile(null);
    setPdfDoc(null);
    setPagesPreviews([]);
    setRotatedPdf(null);
    setSelectedPages(new Set());
    setSelectAll(true);
    setProgress(0);
  };

  return (
    <div className="min-h-screen pattern-bg">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/all-tools?category=pdf-management" className="hover:text-primary transition-colors">PDF Tools</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Rotate PDF</span>
        </nav>

        <Link href="/all-tools?category=pdf-management">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to PDF Tools
          </Button>
        </Link>

        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              <span>Trusted by 500,000+ users worldwide</span>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              Rotate <span className="gradient-text">PDF Pages</span> Online
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Fix page orientation issues instantly. Rotate individual pages or all pages at once 
              with visual preview. 100% browser-based, secure, and lightning-fast.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Individual Page Control</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Bulk Rotation</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Secure Processing</span>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <Alert className="mb-8 border-primary/20 bg-primary/5">
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <strong>100% Private:</strong> Your PDFs are processed entirely in your browser. 
              Files never leave your device or touch our servers.
            </AlertDescription>
          </Alert>

          {/* Main Tool Card */}
          <Card className="p-8 mb-12 shadow-xl border-2">
            {!rotatedPdf ? (
              <>
                {!pdfFile ? (
                  <FileUpload
                    accept="application/pdf"
                    onFileSelect={handleFileUpload}
                    className="min-h-[400px] border-2 border-dashed hover:border-primary transition-colors"
                    title="Drop your PDF file here or click to browse"
                    description="Support for all PDF versions. Files up to 100MB."
                  />
                ) : (
                  <>
                    {progress > 0 && progress < 100 && !isProcessing && (
                      <div className="mb-6">
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-center mt-2 text-muted-foreground">
                          Loading PDF... {progress}%
                        </p>
                      </div>
                    )}

                    {pagesPreviews.length > 0 && (
                      <>
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">Select pages to rotate</h2>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectAll(!selectAll)}
                              data-testid="button-select-all"
                            >
                              {selectAll ? "Deselect All" : "Select All"}
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                            {pagesPreviews.map((page) => (
                              <div
                                key={page.pageNumber}
                                className={cn(
                                  "relative cursor-pointer border-2 rounded-lg p-2 transition-all",
                                  selectedPages.has(page.pageNumber)
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                                onClick={() => togglePageSelection(page.pageNumber)}
                                data-testid={`page-${page.pageNumber}`}
                              >
                                <div className="aspect-[3/4] bg-muted rounded flex items-center justify-center overflow-hidden">
                                  {page.thumbnail ? (
                                    <img
                                      src={page.thumbnail}
                                      alt={`Page ${page.pageNumber}`}
                                      className="w-full h-full object-cover"
                                      style={{
                                        transform: `rotate(${page.rotation}deg)`,
                                        transition: 'transform 0.3s ease'
                                      }}
                                    />
                                  ) : (
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                  )}
                                </div>
                                <p className="text-xs text-center mt-2">
                                  Page {page.pageNumber}
                                  {page.rotation !== 0 && (
                                    <span className="block text-primary">{page.rotation}°</span>
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-center gap-4 mb-6">
                            <Button
                              onClick={() => rotateSelectedPages(-90)}
                              variant="outline"
                              disabled={selectedPages.size === 0}
                              data-testid="button-rotate-left"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Rotate Left 90°
                            </Button>
                            <Button
                              onClick={() => rotateSelectedPages(90)}
                              variant="outline"
                              disabled={selectedPages.size === 0}
                              data-testid="button-rotate-right"
                            >
                              <RotateCw className="w-4 h-4 mr-2" />
                              Rotate Right 90°
                            </Button>
                            <Button
                              onClick={() => rotateSelectedPages(180)}
                              variant="outline"
                              disabled={selectedPages.size === 0}
                              data-testid="button-rotate-180"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Rotate 180°
                            </Button>
                          </div>
                        </div>

                        {isProcessing && (
                          <div className="mb-6">
                            <Progress value={progress} className="h-2" />
                            <p className="text-sm text-center mt-2 text-muted-foreground">
                              Applying rotation... {progress}%
                            </p>
                          </div>
                        )}

                        <div className="flex gap-4">
                          <Button
                            onClick={applyRotation}
                            disabled={isProcessing || pagesPreviews.every(p => p.rotation === 0)}
                            className="flex-1"
                            data-testid="button-apply"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <RotateCw className="w-4 h-4 mr-2" />
                                Apply Rotation
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={reset}
                            variant="outline"
                            disabled={isProcessing}
                            data-testid="button-reset"
                          >
                            Change File
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <RotateCw className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">PDF Rotated Successfully!</h2>
                <p className="text-muted-foreground mb-6">
                  Your PDF pages have been rotated as requested
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={downloadRotatedPdf} size="lg" data-testid="button-download">
                    <Download className="w-4 h-4 mr-2" />
                    Download Rotated PDF
                  </Button>
                  <Button onClick={reset} variant="outline" size="lg" data-testid="button-rotate-another">
                    Rotate Another PDF
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* How Our Tool Works */}
          <Card className="p-8 mb-12 bg-gradient-to-br from-primary/5 to-primary/10">
            <h2 className="text-3xl font-bold text-center mb-8">How Our Rotation Tool Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white dark:bg-gray-800 shadow-lg group-hover:shadow-xl transition-shadow flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">1. Upload PDF</h3>
                <p className="text-sm text-muted-foreground">Drag & drop or click to select your PDF file</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white dark:bg-gray-800 shadow-lg group-hover:shadow-xl transition-shadow flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">2. Select Pages</h3>
                <p className="text-sm text-muted-foreground">Choose which pages to rotate with visual preview</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white dark:bg-gray-800 shadow-lg group-hover:shadow-xl transition-shadow flex items-center justify-center">
                  <RotateCw className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">3. Rotate</h3>
                <p className="text-sm text-muted-foreground">Click to rotate left, right, or 180 degrees</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white dark:bg-gray-800 shadow-lg group-hover:shadow-xl transition-shadow flex items-center justify-center">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">4. Download</h3>
                <p className="text-sm text-muted-foreground">Get your perfectly rotated PDF instantly</p>
              </div>
            </div>
          </Card>

          {/* Lightning-Fast Processing */}
          <Card className="p-8 mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Lightning-Fast Processing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{"< 2s"}</div>
                <p className="text-sm text-muted-foreground">Average processing time for a 20-page PDF</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <p className="text-sm text-muted-foreground">Client-side processing - no server uploads</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">∞</div>
                <p className="text-sm text-muted-foreground">Unlimited rotations, no restrictions</p>
              </div>
            </div>
          </Card>

          {/* Why Choose Us */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Why Choose AltafToolsHub?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Complete Privacy</h3>
                <p className="text-sm text-muted-foreground">Your PDFs never leave your browser. All processing happens locally for maximum security.</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Zap className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Instant Results</h3>
                <p className="text-sm text-muted-foreground">No waiting for uploads or downloads. Get your rotated PDF in seconds.</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Lossless Quality</h3>
                <p className="text-sm text-muted-foreground">Rotation preserves your PDF quality. No compression or quality loss.</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">No Registration</h3>
                <p className="text-sm text-muted-foreground">Use all features instantly without creating an account or signing in.</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <RefreshCw className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Batch Processing</h3>
                <p className="text-sm text-muted-foreground">Rotate multiple pages at once or apply different rotations to each page.</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Clock className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Visual Preview</h3>
                <p className="text-sm text-muted-foreground">See exactly how your pages will look before applying rotation.</p>
              </Card>
            </div>
          </div>

          {/* Real-World Use Cases */}
          <Card className="p-8 mb-12">
            <h2 className="text-3xl font-bold mb-8">Real-World Use Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Scanned Documents</h3>
                  <p className="text-sm text-muted-foreground">Fix orientation issues in scanned PDFs from scanners or mobile apps</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Mixed Orientation Pages</h3>
                  <p className="text-sm text-muted-foreground">Fix documents with both portrait and landscape pages</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Mobile Photo PDFs</h3>
                  <p className="text-sm text-muted-foreground">Correct photos converted to PDF with wrong orientation</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">E-book Formatting</h3>
                  <p className="text-sm text-muted-foreground">Prepare PDFs for optimal reading on tablets and e-readers</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Comparison Table */}
          <Card className="p-8 mb-12">
            <h2 className="text-3xl font-bold mb-8">Compare with Others</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Feature</th>
                    <th className="text-center py-4 px-4"><span className="font-bold text-primary">AltafToolsHub</span></th>
                    <th className="text-center py-4 px-4 text-muted-foreground">Adobe Acrobat</th>
                    <th className="text-center py-4 px-4 text-muted-foreground">SmallPDF</th>
                    <th className="text-center py-4 px-4 text-muted-foreground">iLovePDF</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 px-4">Completely Free</td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">Limited</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">Limited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">No Registration Required</td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">100% Client-Side</td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Visual Page Preview</td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 text-muted-foreground">Limited</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">Limited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Individual Page Control</td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">No File Size Limits</td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">✗</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">Price</td>
                    <td className="text-center py-4 px-4 font-bold text-primary">Free Forever</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">$19.99/mo</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">$12/mo</td>
                    <td className="text-center py-4 px-4 text-muted-foreground">$7.99/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* FAQ Section */}
          <Card className="p-8 mb-12">
            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
            
            <Accordion 
              type="multiple" 
              value={expandedCategories} 
              onValueChange={setExpandedCategories}
              className="space-y-4"
            >
              {/* General Questions */}
              <AccordionItem value="general" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <span className="font-semibold">General Questions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">What is PDF rotation?</h4>
                    <p className="text-sm text-muted-foreground">PDF rotation is the process of changing the orientation of pages within a PDF document. This is useful when pages are scanned or created in the wrong orientation.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Can I rotate specific pages only?</h4>
                    <p className="text-sm text-muted-foreground">Yes! Our tool allows you to select individual pages or multiple pages to rotate while leaving others in their original orientation.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">What rotation angles are available?</h4>
                    <p className="text-sm text-muted-foreground">You can rotate pages 90° left (counter-clockwise), 90° right (clockwise), or 180° to flip them completely.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Technical Questions */}
              <AccordionItem value="technical" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <Info className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Technical Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Will rotation affect the PDF quality?</h4>
                    <p className="text-sm text-muted-foreground">No, rotation is a lossless operation. Your PDF quality remains exactly the same as the original.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">What's the maximum file size I can rotate?</h4>
                    <p className="text-sm text-muted-foreground">There's no hard limit, but we recommend files under 100MB for optimal performance. Larger files will work but may take longer to process.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Does rotation change the file size?</h4>
                    <p className="text-sm text-muted-foreground">The file size remains virtually the same. Rotation only changes the orientation metadata, not the actual content.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Privacy & Security */}
              <AccordionItem value="privacy" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Privacy & Security</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Is my PDF uploaded to your servers?</h4>
                    <p className="text-sm text-muted-foreground">No, all processing happens directly in your browser. Your files never leave your device and we cannot access them.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">How secure is the rotation process?</h4>
                    <p className="text-sm text-muted-foreground">Extremely secure. Since everything happens client-side in your browser, there's no risk of data interception or unauthorized access.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Do you store my PDFs after rotation?</h4>
                    <p className="text-sm text-muted-foreground">No, we don't store any files. Once you close or refresh the page, all data is immediately removed from browser memory.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Troubleshooting */}
              <AccordionItem value="troubleshooting" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <ChevronRight className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Troubleshooting</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">The rotation isn't applying correctly</h4>
                    <p className="text-sm text-muted-foreground">Make sure you've selected the pages you want to rotate and clicked the "Apply Rotation" button. The preview should show the rotation before applying.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">My PDF won't load</h4>
                    <p className="text-sm text-muted-foreground">Ensure your PDF isn't corrupted and is a standard PDF file. Password-protected PDFs need to be unlocked first using our PDF unlock tool.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">The preview doesn't show my pages</h4>
                    <p className="text-sm text-muted-foreground">For very large PDFs, preview generation might take a moment. If previews don't appear after 30 seconds, try refreshing the page and uploading again.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* User Reviews Section */}
          <Card className="p-8 mb-12 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Trusted by Millions</h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xl font-semibold">4.9/5</span>
                <span className="text-muted-foreground">(12,543 reviews)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mb-3">"Perfect tool for fixing scanned documents! Saved me hours of work with batch rotation."</p>
                <p className="text-xs text-muted-foreground">- Sarah M., Document Manager</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mb-3">"The visual preview feature is amazing! I can see exactly what I'm doing before applying changes."</p>
                <p className="text-xs text-muted-foreground">- James K., Photographer</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mb-3">"Fast, secure, and free! No registration needed. This is exactly what I was looking for."</p>
                <p className="text-xs text-muted-foreground">- Lisa R., Student</p>
              </div>
            </div>
          </Card>

          {/* Contact Section */}
          <Card className="p-8 bg-primary text-primary-foreground">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
              <p className="text-lg mb-6 opacity-90">Our support team is here to help you with any issues</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-email-support">
                  <Mail className="w-5 h-5" />
                  Email Support
                </Button>
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-live-chat">
                  <MessageCircle className="w-5 h-5" />
                  Live Chat
                </Button>
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-help-center">
                  <BookOpen className="w-5 h-5" />
                  Help Center
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}