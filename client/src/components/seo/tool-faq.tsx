import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { HelpCircle, MessageSquare } from "lucide-react";
import { generateFAQSchema } from "@/hooks/use-seo";
import { useEffect } from "react";

export interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

interface ToolFAQProps {
  faqs: FAQ[];
  toolName: string;
  toolPath: string;
}

export function ToolFAQ({ faqs, toolName, toolPath }: ToolFAQProps) {
  // Add FAQ structured data
  useEffect(() => {
    const faqSchema = generateFAQSchema(faqs);
    
    // Remove existing FAQ schema for this page
    const existingScript = document.querySelector(`script[data-faq-path="${toolPath}"]`);
    if (existingScript) {
      existingScript.remove();
    }
    
    // Add new FAQ schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-faq-path', toolPath);
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.querySelector(`script[data-faq-path="${toolPath}"]`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [faqs, toolPath]);

  // Group FAQs by category if categories exist
  const groupedFAQs = faqs.reduce((acc, faq) => {
    const category = faq.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categories = Object.keys(groupedFAQs);
  const hasCategories = categories.some(cat => cat !== "General");

  return (
    <section className="py-12 border-t" data-testid="section-faq">
      <article className="container mx-auto px-4 max-w-4xl">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold" data-testid="heading-faq">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about our {toolName}
          </p>
        </header>

        {hasCategories ? (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {category}
                </h3>
                <Accordion type="single" collapsible className="space-y-4">
                  {groupedFAQs[category].map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${category}-${index}`}
                      className="border rounded-lg px-4"
                      data-testid={`faq-item-${category}-${index}`}
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border rounded-lg px-4"
                data-testid={`faq-item-${index}`}
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground">
              Feel free to explore our tool or check our{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </a>{" "}
              to learn more about how we protect your data.
            </p>
          </div>
        </Card>
      </article>
    </section>
  );
}

// Common FAQs that can be reused across different tools
export const commonFAQs = {
  privacy: {
    question: "Is my data safe when using this tool?",
    answer: "Absolutely! All processing happens directly in your browser using JavaScript. Your files never leave your device and are never uploaded to any server. This means complete privacy and security for your sensitive documents.",
    category: "Privacy & Security"
  },
  free: {
    question: "Is this tool really free? Are there any hidden costs?",
    answer: "Yes, our tool is 100% free with no hidden costs, subscriptions, or premium tiers. We believe in providing accessible tools for everyone. There are no watermarks, no file limits, and no registration required.",
    category: "Pricing"
  },
  offline: {
    question: "Can I use this tool offline?",
    answer: "Once the page is loaded in your browser, the tool works entirely offline. You don't need an active internet connection to process your files, as all the processing happens locally on your device.",
    category: "Technical"
  },
  fileSize: {
    question: "What's the maximum file size I can process?",
    answer: "The file size limit depends on your device's available memory since processing happens in your browser. Most modern devices can easily handle files up to 100MB. For larger files, the processing might take a bit longer but will still work.",
    category: "Technical"
  },
  browsers: {
    question: "Which browsers are supported?",
    answer: "Our tool works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. For the best experience, we recommend using the latest version of your preferred browser.",
    category: "Technical"
  },
  mobileSupport: {
    question: "Does this work on mobile devices?",
    answer: "Yes! Our tool is fully responsive and works on smartphones and tablets. However, for processing large files or batch operations, we recommend using a desktop computer for better performance.",
    category: "Technical"
  },
  dataStorage: {
    question: "Do you store my files or data?",
    answer: "No, we never store your files or data. Everything is processed in your browser's memory and is automatically cleared when you close the tab or navigate away from the page. Your privacy is our top priority.",
    category: "Privacy & Security"
  },
  quality: {
    question: "Will the quality of my files be affected?",
    answer: "We use advanced algorithms to maintain the highest possible quality while processing your files. For tools that involve compression or conversion, you often have control over quality settings to balance between file size and quality.",
    category: "Quality"
  },
  batch: {
    question: "Can I process multiple files at once?",
    answer: "Yes, many of our tools support batch processing, allowing you to process multiple files simultaneously. This saves time and makes it easy to handle large projects efficiently.",
    category: "Features"
  },
  speed: {
    question: "How fast is the processing?",
    answer: "Processing speed depends on your device's performance and file size. Since everything happens locally in your browser, there's no upload/download time. Most files are processed within seconds.",
    category: "Performance"
  }
};

// Tool-specific FAQ generators
export function generatePDFCompressFAQs(): FAQ[] {
  return [
    {
      question: "How does PDF compression work without losing quality?",
      answer: "Our PDF compressor uses advanced algorithms to reduce file size by optimizing images, removing redundant data, and streamlining the PDF structure. We carefully balance compression to maintain readability while achieving your target file size.",
      category: "How It Works"
    },
    {
      question: "Can I compress PDF to exactly 100KB, 50KB, or any specific size?",
      answer: "Yes! Our unique feature allows you to set specific target sizes from 10KB to 5MB. The algorithm automatically adjusts compression parameters to achieve your exact target size, perfect for meeting upload requirements.",
      category: "Features"
    },
    {
      question: "How much can PDF file size be reduced?",
      answer: "Typical reduction ranges from 50% to 95% depending on the original PDF content. PDFs with high-resolution images see the most reduction, while text-only PDFs have less compression potential.",
      category: "Performance"
    },
    {
      question: "Can I compress a password-protected PDF?",
      answer: "Currently, you'll need to unlock password-protected PDFs first using our PDF Unlock tool, then compress them. This ensures the security of your documents while giving you full control over the process.",
      category: "Features"
    },
    {
      question: "What compression levels are available?",
      answer: "You can choose from multiple target sizes: 10KB, 20KB, 50KB, 100KB, 150KB, 200KB, 300KB, 500KB, 1MB, 2MB, 5MB, or maximum compression. Each level uses different optimization strategies.",
      category: "Features"
    },
    {
      question: "Will compressing my PDF affect text searchability?",
      answer: "No, text remains searchable after compression. We preserve the text layer of your PDF, ensuring that you can still search, select, and copy text from the compressed document.",
      category: "Quality"
    },
    {
      question: "Can I compress scanned PDFs?",
      answer: "Yes, scanned PDFs can be compressed effectively. Since scanned documents are essentially images, our tool optimizes image quality and resolution to achieve significant size reduction while maintaining legibility.",
      category: "Features"
    },
    {
      question: "What's the difference between this and other PDF compressors?",
      answer: "Unlike others, we offer: 1) Specific target size selection, 2) 100% client-side processing for privacy, 3) No file uploads to servers, 4) No watermarks or limits, 5) Works offline once loaded.",
      category: "Comparison"
    },
    {
      question: "Can I compress multiple PDFs at once?",
      answer: "Currently, you can process one PDF at a time for optimal compression quality. However, you can quickly process multiple files sequentially without any daily limits or restrictions.",
      category: "Features"
    },
    {
      question: "Why choose browser-based compression over desktop software?",
      answer: "Browser-based compression offers instant access without installation, works on any device, updates automatically, and most importantly, keeps your files completely private by processing them locally.",
      category: "Comparison"
    },
    {
      question: "How do you compress PDFs for email attachments?",
      answer: "Most email services limit attachments to 25MB. Select a target size like 5MB or 2MB to ensure your PDF fits within email limits while maintaining good quality for viewing.",
      category: "Use Cases"
    },
    {
      question: "What happens to image quality during compression?",
      answer: "Images are automatically compressed using advanced algorithms. Higher compression levels reduce image resolution more aggressively, but we optimize to maintain text clarity and essential visual details.",
      category: "Quality"
    },
    {
      question: "Can I compress PDFs with forms and interactive elements?",
      answer: "Yes, form fields and interactive elements are preserved during compression. The functionality remains intact while the file size is reduced through optimization of other elements.",
      category: "Features"
    },
    {
      question: "Is there an API available for bulk compression?",
      answer: "Since our tool runs entirely in the browser for privacy, there's no server API. However, the compression logic is client-side JavaScript, making it possible to integrate into your own applications.",
      category: "Technical"
    },
    {
      question: "How long does compression take?",
      answer: "Most PDFs compress in 5-30 seconds depending on size and your device's performance. Since there's no upload/download time, it's often faster than server-based alternatives.",
      category: "Performance"
    },
    commonFAQs.privacy,
    commonFAQs.free,
    commonFAQs.fileSize,
    commonFAQs.browsers,
    commonFAQs.speed,
    commonFAQs.offline,
    commonFAQs.dataStorage,
    commonFAQs.mobileSupport
  ];
}

export function generatePDFUnlockFAQs(): FAQ[] {
  return [
    {
      question: "Is it legal to unlock a PDF?",
      answer: "It's legal to unlock PDFs that you own or have permission to modify. This tool is intended for legitimate use cases like recovering access to your own documents or removing passwords from files you have authorization to edit.",
      category: "Legal"
    },
    {
      question: "What types of PDF passwords can be removed?",
      answer: "Our tool can remove user passwords (open passwords) that prevent you from opening the PDF, provided you know the password. We do not support cracking or bypassing passwords - you must know the correct password to unlock the file.",
      category: "Features"
    },
    {
      question: "Can this tool crack or hack PDF passwords?",
      answer: "No, this is not a password cracking tool. You must know the correct password to unlock the PDF. We provide a legitimate service for removing known passwords from your own documents.",
      category: "Security"
    },
    {
      question: "Will unlocking affect the PDF content or quality?",
      answer: "No, unlocking only removes the password protection. The content, formatting, and quality of your PDF remain exactly the same. All text, images, and formatting are preserved.",
      category: "Quality"
    },
    {
      question: "Can I re-protect the PDF after unlocking?",
      answer: "Yes, after unlocking, you can use any PDF editor to add new password protection if needed. This gives you the flexibility to change passwords or adjust security settings.",
      category: "Features"
    },
    {
      question: "What if I forgot my PDF password?",
      answer: "This tool requires you to know the password to unlock the PDF. If you've forgotten the password, you'll need to contact the document owner or use password recovery methods appropriate for your situation.",
      category: "Features"
    },
    {
      question: "Can I unlock PDFs with printing or copying restrictions?",
      answer: "Yes, when you unlock a PDF with the correct password, all restrictions including printing, copying, and editing limitations are removed along with the password protection.",
      category: "Features"
    },
    {
      question: "How secure is the unlocking process?",
      answer: "Extremely secure. Your password and PDF never leave your browser. All processing happens locally on your device, ensuring your sensitive documents and passwords remain completely private.",
      category: "Security"
    },
    {
      question: "What encryption types are supported?",
      answer: "We support standard PDF encryption methods used by Adobe Acrobat and other PDF creators, including 128-bit and 256-bit AES encryption.",
      category: "Technical"
    },
    {
      question: "Can I unlock bank statements or financial documents?",
      answer: "Yes, many banks password-protect statements for security. As long as you know the password (often your account number or date of birth), you can safely unlock them using our tool.",
      category: "Use Cases"
    },
    {
      question: "Why would I need to unlock my own PDF?",
      answer: "Common reasons include: changing forgotten passwords, removing outdated protection from old documents, enabling editing or printing, or simplifying document sharing within your organization.",
      category: "Use Cases"
    },
    {
      question: "Does this work with digitally signed PDFs?",
      answer: "You can unlock digitally signed PDFs, but note that removing password protection may invalidate certain types of digital signatures that depend on document security settings.",
      category: "Features"
    },
    {
      question: "Can I unlock PDFs on my phone or tablet?",
      answer: "Yes, our tool works on all devices with a modern web browser. However, for large PDFs, desktop computers typically provide better performance.",
      category: "Compatibility"
    },
    {
      question: "What's the maximum PDF size I can unlock?",
      answer: "The size limit depends on your device's available memory. Most devices can handle PDFs up to 100MB easily. Larger files may take longer but will still work.",
      category: "Technical"
    },
    {
      question: "How is this different from PDF password removers?",
      answer: "Our tool is unique because: 1) It's 100% browser-based, 2) No file uploads to servers, 3) Requires knowing the password (ethical approach), 4) Instant processing, 5) Completely free with no limits.",
      category: "Comparison"
    },
    commonFAQs.privacy,
    commonFAQs.dataStorage,
    commonFAQs.free,
    commonFAQs.browsers,
    commonFAQs.offline,
    commonFAQs.speed,
    commonFAQs.mobileSupport
  ];
}

export function generateJPGtoPDFFAQs(): FAQ[] {
  return [
    {
      question: "What image formats are supported besides JPG?",
      answer: "Our converter supports all major image formats including JPG, PNG, WebP, GIF, BMP, and TIFF. You can even mix different formats in a single PDF conversion.",
      category: "Features"
    },
    {
      question: "Can I arrange the order of images in the PDF?",
      answer: "Yes, you can arrange images in any order before conversion. Simply drag and drop to reorder, or remove images you don't want to include in the final PDF.",
      category: "Features"
    },
    {
      question: "What page sizes and orientations are available?",
      answer: "We offer standard page sizes (A4, Letter, Legal, A3, A5) in both portrait and landscape orientations. You can also choose different layout options like multiple images per page.",
      category: "Features"
    },
    {
      question: "How is image quality preserved during conversion?",
      answer: "We offer quality settings from low to maximum. Higher quality settings preserve original image detail but result in larger file sizes. You can balance quality and file size based on your needs.",
      category: "Quality"
    },
    {
      question: "Can I add multiple images to a single page?",
      answer: "Yes, you can choose layouts with 1, 2, 4, or 6 images per page. This is perfect for creating photo albums, contact sheets, or saving paper when printing.",
      category: "Features"
    },
    {
      question: "How do I convert photos from my phone to PDF?",
      answer: "Simply open our tool on your phone's browser, tap to select photos from your gallery, arrange them as needed, and convert. The PDF downloads directly to your phone.",
      category: "Mobile"
    },
    {
      question: "What's the maximum number of images I can convert at once?",
      answer: "There's no hard limit on the number of images. You can convert hundreds of images at once, though processing time increases with more images. Your device's memory is the only constraint.",
      category: "Technical"
    },
    {
      question: "Can I create a photo album or portfolio PDF?",
      answer: "Absolutely! Our tool is perfect for creating photo albums and portfolios. Choose high quality settings, arrange photos in order, and select an appropriate layout for professional-looking results.",
      category: "Use Cases"
    },
    {
      question: "Will EXIF data and metadata be preserved?",
      answer: "Image metadata is not transferred to the PDF for privacy reasons. The PDF will contain the visual content only, without camera information, location data, or other metadata.",
      category: "Privacy"
    },
    {
      question: "Can I add margins or borders to images?",
      answer: "Images are automatically centered on pages with appropriate margins. While you can't customize margins directly, different page sizes and layouts provide various spacing options.",
      category: "Features"
    },
    {
      question: "How do I convert scanned documents to PDF?",
      answer: "If you have scanned document images (JPG/PNG), simply upload them in the correct order. Choose 'one per page' layout and high quality for best readability of text in scanned documents.",
      category: "Use Cases"
    },
    {
      question: "What's the best setting for printing photos?",
      answer: "For printing, use maximum quality settings and choose the page size that matches your printer paper (usually A4 or Letter). This ensures photos print at the highest possible resolution.",
      category: "Printing"
    },
    {
      question: "Can I convert screenshots to PDF?",
      answer: "Yes, screenshots in PNG or JPG format convert perfectly to PDF. This is useful for creating documentation, tutorials, or compiling multiple screenshots into a single document.",
      category: "Use Cases"
    },
    {
      question: "How does this compare to phone scanning apps?",
      answer: "Unlike scanning apps, we don't require app installation, don't access your phone's data, process everything locally for privacy, and work on any device with a browser. Plus, it's completely free.",
      category: "Comparison"
    },
    {
      question: "Can I compress the PDF after conversion?",
      answer: "Yes! After creating your PDF, you can use our PDF Compressor tool to reduce file size if needed. This two-step process gives you maximum control over quality and size.",
      category: "Features"
    },
    commonFAQs.privacy,
    commonFAQs.batch,
    commonFAQs.free,
    commonFAQs.mobileSupport,
    commonFAQs.speed,
    commonFAQs.offline,
    commonFAQs.browsers,
    commonFAQs.dataStorage
  ];
}

export function generateQRGeneratorFAQs(): FAQ[] {
  return [
    {
      question: "What types of data can I encode in a QR code?",
      answer: "You can encode any text data including URLs, plain text, email addresses, phone numbers, WiFi credentials, vCards, SMS messages, and more. The QR code will work with any QR scanner app.",
      category: "Features"
    },
    {
      question: "Can I customize the QR code colors?",
      answer: "Yes, you can customize both the foreground (pattern) and background colors. However, ensure good contrast for reliable scanning - dark patterns on light backgrounds work best.",
      category: "Customization"
    },
    {
      question: "What sizes are available for QR codes?",
      answer: "We offer three sizes: Small (200x200px), Medium (300x300px), and Large (400x400px). All sizes maintain the same data capacity and scanning reliability.",
      category: "Features"
    },
    {
      question: "How much data can a QR code hold?",
      answer: "QR codes can hold up to 4,296 alphanumeric characters or 2,953 bytes of binary data. For URLs, we recommend keeping them under 1,000 characters for best scanning performance.",
      category: "Technical"
    },
    {
      question: "Do QR codes expire?",
      answer: "The QR codes themselves never expire. However, if you encode a URL that later becomes invalid, the QR code will still scan but lead to a broken link.",
      category: "Technical"
    },
    {
      question: "How do I create a WiFi QR code?",
      answer: "Enter your WiFi credentials in this format: WIFI:T:WPA;S:NetworkName;P:Password;; Replace NetworkName and Password with your actual credentials. Guests can then scan to connect automatically.",
      category: "How To"
    },
    {
      question: "Can I track QR code scans?",
      answer: "Our tool doesn't track scans directly. For tracking, encode a URL that goes through a URL shortener or analytics service that provides scan statistics.",
      category: "Analytics"
    },
    {
      question: "What's the best format for business cards?",
      answer: "For business cards, use Medium size (300x300px) with high contrast colors. Encode a vCard or link to your digital business card for maximum information in minimal space.",
      category: "Use Cases"
    },
    {
      question: "Can QR codes work when printed small?",
      answer: "Yes, but maintain a minimum size of 2x2 cm (0.8x0.8 inches) for reliable scanning. The more data encoded, the larger the QR code should be for easy scanning.",
      category: "Printing"
    },
    {
      question: "What's error correction in QR codes?",
      answer: "Error correction allows QR codes to be scanned even when partially damaged or obscured. Our generator uses Medium error correction (15% damage tolerance) for optimal balance.",
      category: "Technical"
    },
    {
      question: "Can I create dynamic QR codes?",
      answer: "We generate static QR codes where the data is fixed. For dynamic QR codes (where you can change the destination), encode a redirect URL that you control.",
      category: "Features"
    },
    {
      question: "How do I test if my QR code works?",
      answer: "Test with multiple devices and QR scanner apps. Most phone cameras now have built-in QR scanning. Ensure good lighting and hold the camera steady for best results.",
      category: "Testing"
    },
    {
      question: "Can I add a logo to my QR code?",
      answer: "Currently, we focus on clean, reliable QR codes without logos. Adding logos can reduce scan reliability. For branding, consider placing your logo near the QR code instead.",
      category: "Customization"
    },
    {
      question: "What's the difference between QR codes and barcodes?",
      answer: "QR codes store data in 2D (both horizontally and vertically), holding much more information than 1D barcodes. QR codes can store URLs, text, and other data types, while barcodes typically store product numbers.",
      category: "Comparison"
    },
    {
      question: "Can I use generated QR codes commercially?",
      answer: "Yes, all QR codes generated with our tool are free to use for any purpose, including commercial use, marketing campaigns, and products. There are no licensing restrictions or watermarks.",
      category: "Legal"
    },
    commonFAQs.privacy,
    commonFAQs.free,
    commonFAQs.offline,
    commonFAQs.browsers,
    commonFAQs.speed,
    commonFAQs.dataStorage,
    commonFAQs.mobileSupport
  ];
}

export function generatePasswordGeneratorFAQs(): FAQ[] {
  return [
    {
      question: "How random are the generated passwords?",
      answer: "We use cryptographically secure random number generation (crypto.getRandomValues) to ensure truly random, unpredictable passwords that meet the highest security standards.",
      category: "Security"
    },
    {
      question: "What makes a password strong?",
      answer: "Strong passwords are long (12+ characters), use a mix of uppercase, lowercase, numbers, and symbols, avoid common patterns, and are unique for each account. Our strength meter evaluates these factors.",
      category: "Security"
    },
    {
      question: "What's the ideal password length?",
      answer: "Security experts recommend at least 12-16 characters for important accounts. Longer passwords (20+ characters) provide even better security. Length is more important than complexity for password strength.",
      category: "Security"
    },
    {
      question: "Can I customize password requirements?",
      answer: "Yes, you can adjust length (4-50 characters) and choose which character types to include: uppercase, lowercase, numbers, and symbols. This helps meet specific website or application requirements.",
      category: "Features"
    },
    {
      question: "Is it safe to generate passwords online?",
      answer: "Yes, our generator is completely safe because it runs entirely in your browser. No passwords are sent to any server, stored, or logged. Each password is generated locally on your device.",
      category: "Security"
    },
    {
      question: "Should I use the same password for multiple accounts?",
      answer: "Never use the same password for multiple accounts. If one account is compromised, all accounts with the same password become vulnerable. Generate unique passwords for each account.",
      category: "Security"
    },
    {
      question: "How do I create memorable but secure passwords?",
      answer: "Use passphrases: combine 4-6 random words with numbers and symbols. For example: 'Coffee#Laptop7$Mountain!Beach'. These are easier to remember than random characters but equally secure.",
      category: "Tips"
    },
    {
      question: "What's two-factor authentication and why use it?",
      answer: "Two-factor authentication (2FA) adds an extra security layer beyond passwords. Even if your password is compromised, attackers can't access your account without the second factor (usually a phone app or SMS code).",
      category: "Security"
    },
    {
      question: "Can password generators be hacked?",
      answer: "Our generator cannot be hacked to reveal generated passwords because nothing is stored or transmitted. Each password exists only in your browser's memory and disappears when you navigate away.",
      category: "Security"
    },
    {
      question: "Why avoid dictionary words in passwords?",
      answer: "Hackers use dictionary attacks that try common words and phrases. Random character combinations are exponentially harder to crack than dictionary words, even with substitutions like @ for 'a'.",
      category: "Security"
    },
    {
      question: "How should I store my generated passwords?",
      answer: "We recommend using a reputable password manager like Bitwarden, 1Password, or LastPass. Never write passwords in plain text files or sticky notes. Password managers encrypt your data for security.",
      category: "Security"
    },
    {
      question: "How often should I change my passwords?",
      answer: "Change passwords immediately if there's a security breach. Otherwise, security experts now recommend using strong, unique passwords rather than frequent changes, unless required by your organization.",
      category: "Security"
    },
    {
      question: "What are the most common password mistakes?",
      answer: "Common mistakes include: using personal information (birthdays, names), simple patterns (123456, qwerty), reusing passwords, short passwords (<8 characters), and writing passwords in unsecure places.",
      category: "Tips"
    },
    {
      question: "Can I generate passwords for specific requirements?",
      answer: "Yes! Adjust the settings to meet specific requirements. For example, some sites don't allow symbols - just uncheck that option. Need exactly 8 characters? Set the slider to 8.",
      category: "Features"
    },
    {
      question: "How does the password strength meter work?",
      answer: "Our strength meter analyzes length, character variety, and patterns. It checks for uppercase, lowercase, numbers, symbols, and common patterns to give you real-time feedback on password security.",
      category: "Features"
    },
    commonFAQs.privacy,
    commonFAQs.free,
    commonFAQs.offline,
    commonFAQs.browsers,
    commonFAQs.mobileSupport,
    commonFAQs.speed
  ];
}

export function generateWordCounterFAQs(): FAQ[] {
  return [
    {
      question: "What text statistics are calculated?",
      answer: "We calculate words, characters (with and without spaces), sentences, paragraphs, and estimated reading time. These metrics help you understand and optimize your content for different purposes.",
      category: "Features"
    },
    {
      question: "How is reading time calculated?",
      answer: "Reading time is estimated based on an average reading speed of 200 words per minute. This is a standard rate for general comprehension, though actual speed varies by reader and content complexity.",
      category: "Technical"
    },
    {
      question: "Can I count words in different languages?",
      answer: "Yes, our word counter works with any language that uses space-separated words. For languages like Chinese or Japanese, character count may be more relevant than word count.",
      category: "Features"
    },
    {
      question: "Does it count words in real-time?",
      answer: "Yes, all statistics update instantly as you type or paste text. This gives you immediate feedback without needing to click any buttons or wait for processing.",
      category: "Features"
    },
    {
      question: "What's the maximum text length supported?",
      answer: "There's no hard limit on text length. The tool can handle documents with hundreds of thousands of words, though very large texts might cause slight delays in real-time counting.",
      category: "Technical"
    },
    {
      question: "How accurate is the word count?",
      answer: "Our word counter is highly accurate, using advanced algorithms to properly identify word boundaries, handle hyphenated words, and distinguish between actual words and formatting.",
      category: "Accuracy"
    },
    {
      question: "Can I check character limits for social media?",
      answer: "Yes! We have preset limits for Twitter (280), LinkedIn (2200), SMS (160), and meta descriptions (500). You can also set custom character limits for any platform.",
      category: "Features"
    },
    {
      question: "What's the difference between characters with and without spaces?",
      answer: "'Characters with spaces' includes all characters including spaces and line breaks. 'Without spaces' counts only letters, numbers, and punctuation - useful for platforms that don't count spaces.",
      category: "Technical"
    },
    {
      question: "How does sentence counting work?",
      answer: "Sentences are identified by ending punctuation (periods, exclamation marks, question marks). The algorithm handles abbreviations and decimal numbers intelligently to avoid false sentence breaks.",
      category: "Technical"
    },
    {
      question: "Can I use this for academic papers?",
      answer: "Absolutely! It's perfect for essays, research papers, and assignments with specific word count requirements. The tool helps you meet minimum or maximum word limits accurately.",
      category: "Use Cases"
    },
    {
      question: "Is this tool good for SEO content?",
      answer: "Yes! SEO experts recommend 1,500+ words for comprehensive articles. Our tool helps you reach optimal content length while tracking readability through sentence and paragraph counts.",
      category: "SEO"
    },
    {
      question: "Can I count words in copied text from PDFs or websites?",
      answer: "Yes, simply copy text from any source and paste it into our tool. Formatting is automatically cleaned up, giving you accurate counts regardless of the source.",
      category: "Features"
    },
    {
      question: "How do I write to a specific word count?",
      answer: "Type or paste your content and watch the real-time counter. The tool shows your progress, making it easy to add or trim content to reach your target word count.",
      category: "Tips"
    },
    {
      question: "What's the ideal blog post length?",
      answer: "For SEO, aim for 1,500-2,500 words for comprehensive coverage. However, quality matters more than quantity. Use our tool to ensure you're providing enough detail without unnecessary padding.",
      category: "SEO"
    },
    {
      question: "Can I export word count statistics?",
      answer: "You can export your text with statistics to a text file. This includes all counts and the original text, useful for documentation or record-keeping.",
      category: "Features"
    },
    commonFAQs.privacy,
    commonFAQs.free,
    commonFAQs.offline,
    commonFAQs.mobileSupport,
    commonFAQs.browsers,
    commonFAQs.speed,
    commonFAQs.dataStorage
  ];
}