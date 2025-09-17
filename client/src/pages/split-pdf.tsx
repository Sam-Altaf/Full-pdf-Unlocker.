import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";
import { Scissors, Upload, Download, FileText, Loader2, CheckCircle2 } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import { PDFDocument } from "pdf-lib";
import { cn } from "@/lib/utils";
import ToolPageLayout from "@/components/layout/tool-page-layout";
import { toolContentData } from "@/lib/tool-content-data";

interface SplitResult {
  name: string;
  data: Uint8Array;
  pages: string;
}

// Tool Component - Core functionality only
function SplitPDFTool() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<"range" | "single" | "fixed">("range");
  const [pageRanges, setPageRanges] = useState("");
  const [fixedSize, setFixedSize] = useState("5");
  const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
  const { toast } = useToast();

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
      const arrayBuffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const pageCount = doc.getPageCount();
      
      setPdfFile(file);
      setPdfDoc(doc);
      setTotalPages(pageCount);
      setSplitResults([]);
      
      if (splitMode === "range") {
        setPageRanges(`1-${pageCount}`);
      }
      
      toast({
        title: "File Loaded",
        description: `PDF loaded successfully (${pageCount} pages)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load PDF file",
        variant: "destructive"
      });
    }
  }, [splitMode, toast]);

  useEffect(() => {
    if (totalPages > 0 && splitMode === "range") {
      setPageRanges(`1-${totalPages}`);
    }
  }, [splitMode, totalPages]);

  const parsePageRanges = (input: string): Array<[number, number]> => {
    const ranges: Array<[number, number]> = [];
    const parts = input.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end) && start > 0 && end <= totalPages && start <= end) {
          ranges.push([start, end]);
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page) && page > 0 && page <= totalPages) {
          ranges.push([page, page]);
        }
      }
    }
    
    return ranges;
  };

  const splitPDF = async () => {
    if (!pdfDoc) {
      toast({
        title: "No File",
        description: "Please upload a PDF file first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setSplitResults([]);

    try {
      const results: SplitResult[] = [];
      
      if (splitMode === "range") {
        const ranges = parsePageRanges(pageRanges);
        if (ranges.length === 0) {
          throw new Error("Invalid page ranges");
        }
        
        for (let i = 0; i < ranges.length; i++) {
          const [start, end] = ranges[i];
          setProgress(Math.round(((i + 0.5) / ranges.length) * 100));
          
          const newPdf = await PDFDocument.create();
          const pages = await newPdf.copyPages(pdfDoc, Array.from(
            { length: end - start + 1 }, 
            (_, idx) => start - 1 + idx
          ));
          
          pages.forEach(page => newPdf.addPage(page));
          
          const pdfBytes = await newPdf.save();
          const pageLabel = start === end ? `page-${start}` : `pages-${start}-${end}`;
          
          results.push({
            name: `${pdfFile!.name.replace('.pdf', '')}-${pageLabel}.pdf`,
            data: pdfBytes,
            pages: start === end ? `Page ${start}` : `Pages ${start}-${end}`
          });
          
          setProgress(Math.round(((i + 1) / ranges.length) * 100));
        }
      } else if (splitMode === "single") {
        for (let i = 0; i < totalPages; i++) {
          setProgress(Math.round(((i + 0.5) / totalPages) * 100));
          
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(page);
          
          const pdfBytes = await newPdf.save();
          
          results.push({
            name: `${pdfFile!.name.replace('.pdf', '')}-page-${i + 1}.pdf`,
            data: pdfBytes,
            pages: `Page ${i + 1}`
          });
          
          setProgress(Math.round(((i + 1) / totalPages) * 100));
        }
      } else if (splitMode === "fixed") {
        const size = parseInt(fixedSize);
        if (isNaN(size) || size < 1) {
          throw new Error("Please enter a valid number of pages per split (1 or more)");
        }
        const totalBatches = Math.ceil(totalPages / size);
        
        for (let i = 0; i < totalBatches; i++) {
          setProgress(Math.round(((i + 0.5) / totalBatches) * 100));
          
          const startPage = i * size;
          const endPage = Math.min((i + 1) * size - 1, totalPages - 1);
          
          const newPdf = await PDFDocument.create();
          const pages = await newPdf.copyPages(pdfDoc, Array.from(
            { length: endPage - startPage + 1 }, 
            (_, idx) => startPage + idx
          ));
          
          pages.forEach(page => newPdf.addPage(page));
          
          const pdfBytes = await newPdf.save();
          
          results.push({
            name: `${pdfFile!.name.replace('.pdf', '')}-part-${i + 1}.pdf`,
            data: pdfBytes,
            pages: `Pages ${startPage + 1}-${endPage + 1}`
          });
          
          setProgress(Math.round(((i + 1) / totalBatches) * 100));
        }
      }
      
      setSplitResults(results);
      toast({
        title: "Success!",
        description: `PDF split into ${results.length} file(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to split PDF",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadResult = (result: SplitResult) => {
    const blob = new Blob([result.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllResults = () => {
    splitResults.forEach((result, index) => {
      setTimeout(() => downloadResult(result), index * 100); // Stagger downloads
    });
  };

  const reset = () => {
    setPdfFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setSplitResults([]);
    setPageRanges("");
    setProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="p-8 shadow-xl">
      {splitResults.length === 0 ? (
        <>
          {!pdfFile ? (
            <div className="space-y-8">
              <FileUpload
                accept="application/pdf"
                multiple={false}
                onFilesSelect={(files) => handleFileUpload(files[0])}
                className="min-h-[300px]"
                title="Drop your PDF file here or click to browse"
                description="Upload the PDF you want to split. All processing happens securely in your browser."
                maxSize={200 * 1024 * 1024} // 200MB
              />
              
              {/* Quick Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <Scissors className="w-10 h-10 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold mb-2">Multiple Split Methods</h3>
                  <p className="text-sm text-muted-foreground">By range, single pages, or fixed size</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold mb-2">Page Preview</h3>
                  <p className="text-sm text-muted-foreground">See exactly what you're extracting</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <Download className="w-10 h-10 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold mb-2">Batch Download</h3>
                  <p className="text-sm text-muted-foreground">Download all splits at once</p>
                </div>
              </div>
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
                      <h3 className="font-semibold text-lg">{pdfFile.name}</h3>
                      <p className="text-muted-foreground">
                        {totalPages} pages • {formatFileSize(pdfFile.size)}
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

              {/* Split Options */}
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold mb-4 block">Select Split Method</Label>
                  <RadioGroup 
                    value={splitMode} 
                    onValueChange={(value: "range" | "single" | "fixed") => setSplitMode(value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className={cn(
                      "relative rounded-xl border-2 p-6 cursor-pointer transition-all",
                      splitMode === "range" ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/50 hover:shadow-md"
                    )}>
                      <RadioGroupItem value="range" id="range" className="absolute top-4 right-4" />
                      <Label htmlFor="range" className="cursor-pointer">
                        <div className="font-semibold mb-2 text-lg">Custom Range</div>
                        <div className="text-sm text-muted-foreground">Extract specific page ranges (e.g., 1-3, 5, 7-10)</div>
                      </Label>
                    </div>
                    
                    <div className={cn(
                      "relative rounded-xl border-2 p-6 cursor-pointer transition-all",
                      splitMode === "single" ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/50 hover:shadow-md"
                    )}>
                      <RadioGroupItem value="single" id="single" className="absolute top-4 right-4" />
                      <Label htmlFor="single" className="cursor-pointer">
                        <div className="font-semibold mb-2 text-lg">Single Pages</div>
                        <div className="text-sm text-muted-foreground">Split into individual pages (creates {totalPages} files)</div>
                      </Label>
                    </div>
                    
                    <div className={cn(
                      "relative rounded-xl border-2 p-6 cursor-pointer transition-all",
                      splitMode === "fixed" ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/50 hover:shadow-md"
                    )}>
                      <RadioGroupItem value="fixed" id="fixed" className="absolute top-4 right-4" />
                      <Label htmlFor="fixed" className="cursor-pointer">
                        <div className="font-semibold mb-2 text-lg">Fixed Size</div>
                        <div className="text-sm text-muted-foreground">Split into equal parts with specified pages each</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Mode-specific options */}
                {splitMode === "range" && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800">
                    <Label htmlFor="ranges" className="text-lg font-semibold mb-3 block">
                      Enter Page Ranges
                    </Label>
                    <Input
                      id="ranges"
                      value={pageRanges}
                      onChange={(e) => setPageRanges(e.target.value)}
                      placeholder="e.g., 1-3, 5, 7-10"
                      className="mb-3 text-lg p-4 h-12"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use commas to separate ranges. Example: <strong>1-3, 5, 7-10</strong> creates 3 files
                    </p>
                  </div>
                )}

                {splitMode === "fixed" && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 border border-green-200 dark:border-green-800">
                    <Label htmlFor="fixed-size" className="text-lg font-semibold mb-3 block">
                      Pages per Split
                    </Label>
                    <Input
                      id="fixed-size"
                      type="number"
                      min="1"
                      max={totalPages}
                      value={fixedSize}
                      onChange={(e) => setFixedSize(e.target.value)}
                      className="max-w-[200px] mb-3 text-lg p-4 h-12"
                    />
                    <p className="text-sm text-muted-foreground">
                      Creates <strong>{Math.ceil(totalPages / parseInt(fixedSize || "1"))}</strong> files, each with {fixedSize} pages (except possibly the last one)
                    </p>
                  </div>
                )}

                {splitMode === "single" && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800">
                    <p className="text-muted-foreground">
                      Your <strong>{totalPages}-page PDF</strong> will be split into <strong>{totalPages} individual files</strong>, one for each page.
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-4">
                  <Progress value={progress} className="h-4" />
                  <p className="text-center font-medium text-lg">
                    {progress}%
                  </p>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={splitPDF}
                disabled={isProcessing}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    {progress}%
                  </>
                ) : (
                  <>
                    <Scissors className="w-6 h-6 mr-3" />
                    Split PDF Now
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div>
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3">PDF Split Successfully!</h2>
            <p className="text-lg text-muted-foreground">
              Your PDF has been divided into <strong>{splitResults.length}</strong> file{splitResults.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Download All Button */}
          <div className="mb-8 flex justify-center">
            <Button 
              onClick={downloadAllResults} 
              size="lg"
              className="px-8 h-12 text-lg font-semibold"
            >
              <Download className="w-5 h-5 mr-2" />
              Download All Files
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
            {splitResults.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-card to-muted/20 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.pages}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => downloadResult(result)} 
                  variant="outline"
                  size="sm"
                  className="px-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>

          {/* Reset Button */}
          <Button 
            onClick={reset} 
            variant="outline"
            className="w-full h-12 text-lg"
          >
            Split Another PDF
          </Button>
        </div>
      )}
    </Card>
  );
}

// Main Component with Layout
export default function SplitPDF() {
  const contentData = toolContentData["split-pdf"];
  
  useSEO({
    title: "Split PDF Online Free - Divide PDF by Pages | AltafToolsHub",
    description: "Free online PDF splitter to divide PDF files by page ranges, extract single pages, or split into fixed sizes. 100% client-side processing for complete privacy. No file size limits.",
    path: "/split-pdf",
    keywords: "split pdf, divide pdf, pdf splitter, extract pdf pages, split pdf online, pdf page separator, pdf divider, extract pages from pdf",
    ogImage: "https://www.altaftoolshub.com/og-split-pdf.png",
    structuredData: [{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "PDF Splitter - AltafToolsHub",
      "description": "Free online PDF splitter to divide PDF files into separate documents with precision",
      "url": "https://www.altaftoolshub.com/split-pdf",
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
        "ratingCount": "2847"
      }
    }],
    additionalMetaTags: [
      { name: "application-name", content: "PDF Splitter - AltafToolsHub" },
      { property: "article:section", content: "PDF Tools" },
      { property: "article:modified_time", content: new Date().toISOString() }
    ]
  });

  return (
    <ToolPageLayout
      toolName="Split PDF Files"
      description="Extract specific pages, divide by ranges, or split into equal parts. Professional PDF splitting tool with 100% privacy and instant processing."
      trustBadge={contentData.trustBadge}
      trustIndicators={contentData.trustIndicators}
      toolComponent={<SplitPDFTool />}
      howItWorksSteps={contentData.howItWorksSteps}
      processingTime={contentData.processingTime}
      whyChooseData={contentData.whyChooseData}
      useCases={contentData.useCases}
      comparisons={contentData.comparisons}
      faqs={contentData.faqs}
      ratings={contentData.ratings}
      breadcrumbPath="/split-pdf"
      categoryName="PDF Tools"
      categoryPath="/all-tools?category=pdf-management"
    />
  );
}