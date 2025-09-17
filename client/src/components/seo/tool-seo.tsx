import { useEffect } from "react";
import { generateWebApplicationSchema, generateFAQSchema } from "@/hooks/use-seo";

interface ToolSEOProps {
  toolName: string;
  description: string;
  category: string;
  faqs?: { question: string; answer: string }[];
  rating?: { value: number; count: number };
}

export default function ToolSEO({ 
  toolName, 
  description, 
  category,
  faqs,
  rating
}: ToolSEOProps) {
  useEffect(() => {
    const schemas = [];
    
    // Add WebApplication schema
    schemas.push(generateWebApplicationSchema({
      name: toolName,
      description: description,
      applicationCategory: category,
      aggregateRating: rating ? {
        ratingValue: rating.value,
        ratingCount: rating.count
      } : undefined
    }));
    
    // Add FAQ schema if FAQs are provided
    if (faqs && faqs.length > 0) {
      schemas.push(generateFAQSchema(faqs));
    }
    
    // Create script element for structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemas);
    script.id = 'tool-schema';
    
    // Remove existing schema if exists
    const existing = document.getElementById('tool-schema');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);
    
    return () => {
      const element = document.getElementById('tool-schema');
      if (element) {
        element.remove();
      }
    };
  }, [toolName, description, category, faqs, rating]);
  
  return null;
}

// Predefined FAQs for each tool
export const toolFAQs = {
  "compress-pdf": [
    {
      question: "How does the PDF compression work?",
      answer: "Our PDF compressor uses advanced algorithms to reduce file size while maintaining quality. It optimizes images, removes redundant data, and applies smart compression techniques. All processing happens in your browser for complete privacy."
    },
    {
      question: "Can I compress PDF to a specific size?",
      answer: "Yes! You can choose target sizes from 10KB to 5MB. Our advanced algorithm adjusts compression parameters to achieve your desired file size while preserving maximum quality."
    },
    {
      question: "Is my PDF file secure during compression?",
      answer: "Absolutely! All compression happens directly in your browser. Your files never leave your device or get uploaded to any server, ensuring 100% privacy and security."
    },
    {
      question: "What's the maximum file size I can compress?",
      answer: "You can compress PDF files up to 100MB in size. Larger files may take longer to process depending on your device's performance."
    }
  ],
  "unlock-pdf": [
    {
      question: "How do I unlock a password-protected PDF?",
      answer: "Simply upload your password-protected PDF file and enter the password. Our tool will remove the password protection and create an unlocked version you can download."
    },
    {
      question: "Is it safe to unlock PDFs with this tool?",
      answer: "Yes, it's completely safe. All processing happens in your browser locally. Neither your file nor your password is sent to any server, ensuring complete privacy."
    },
    {
      question: "Will unlocking affect the PDF quality?",
      answer: "No, unlocking a PDF maintains the original quality. The tool simply removes the password protection without altering the content or quality of your document."
    },
    {
      question: "What types of PDF passwords can be removed?",
      answer: "Our tool can remove user passwords (open passwords) that prevent opening the PDF. You need to know the password to unlock the file."
    }
  ],
  "jpg-to-pdf": [
    {
      question: "How many images can I convert to PDF at once?",
      answer: "You can convert multiple JPG, PNG, and other image formats to a single PDF. The only limit is your browser's memory capacity."
    },
    {
      question: "Can I adjust the page layout and orientation?",
      answer: "Yes! You can choose from various page sizes (A4, Letter, Legal), orientations (Portrait, Landscape), and layout options (one per page, multiple per page)."
    },
    {
      question: "Will my images be compressed during conversion?",
      answer: "You control the quality! Choose from low, medium, high, or maximum quality settings to balance file size and image quality according to your needs."
    },
    {
      question: "Is the conversion process secure?",
      answer: "100% secure! All conversion happens in your browser. Your images are never uploaded to any server, ensuring complete privacy."
    }
  ],
  "qr-generator": [
    {
      question: "What can I encode in a QR code?",
      answer: "You can encode any text, URLs, email addresses, phone numbers, WiFi credentials, or plain text messages up to 2,953 characters."
    },
    {
      question: "Can I customize the QR code appearance?",
      answer: "Yes! You can customize the foreground and background colors, and choose from three different sizes (small, medium, large) for your QR codes."
    },
    {
      question: "Are the generated QR codes permanent?",
      answer: "Yes, once generated and downloaded, your QR codes are permanent and will work forever. They don't expire or require any online service to function."
    },
    {
      question: "What format are the QR codes saved in?",
      answer: "QR codes are generated as high-quality PNG images that can be used for both digital and print purposes."
    }
  ],
  "password-generator": [
    {
      question: "How secure are the generated passwords?",
      answer: "Our passwords use cryptographically secure random generation. They're created using your browser's secure random number generator, ensuring maximum unpredictability."
    },
    {
      question: "What makes a strong password?",
      answer: "A strong password is at least 12 characters long and includes a mix of uppercase letters, lowercase letters, numbers, and symbols. Our generator helps you create passwords meeting these criteria."
    },
    {
      question: "Are generated passwords stored anywhere?",
      answer: "No, passwords are generated locally in your browser and are never stored or transmitted. The history feature only stores passwords temporarily in your browser session."
    },
    {
      question: "Can I customize password requirements?",
      answer: "Yes! You can adjust length (4-128 characters) and choose which character types to include: uppercase, lowercase, numbers, and symbols."
    }
  ],
  "word-counter": [
    {
      question: "What does the word counter tool count?",
      answer: "Our tool counts words, characters (with and without spaces), sentences, paragraphs, and provides estimated reading and speaking times."
    },
    {
      question: "How accurate is the reading time estimate?",
      answer: "Reading time is calculated at 200 words per minute (average adult reading speed). Speaking time uses 150 words per minute (average presentation speed)."
    },
    {
      question: "Can I count words in different languages?",
      answer: "Yes! The word counter works with any language that uses space-separated words, including English, Spanish, French, German, and many others."
    },
    {
      question: "Is there a limit to how much text I can analyze?",
      answer: "There's no hard limit, but very large texts (over 100,000 words) may slow down your browser. The tool handles typical documents and articles with ease."
    }
  ]
};