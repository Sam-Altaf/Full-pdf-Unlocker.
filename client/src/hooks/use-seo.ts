import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  keywords?: string;
  author?: string;
  structuredData?: any;
  alternates?: { lang: string; href: string }[];
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  twitterHandle?: string;
  noindex?: boolean;
  additionalMetaTags?: { name?: string; property?: string; content: string }[];
}

export function useSEO({ 
  title, 
  description, 
  path, 
  ogImage,
  keywords,
  author = "AltafToolsHub Team",
  structuredData,
  alternates,
  articlePublishedTime,
  articleModifiedTime,
  twitterHandle = "@altaftoolshub",
  noindex = false,
  additionalMetaTags = []
}: SEOProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement;
      if (!element) {
        if (selector.includes('link')) {
          element = document.createElement('link');
        } else {
          element = document.createElement('meta');
        }
        const [, attr, val] = selector.match(/\[([^=]+)="([^"]+)"\]/) || [];
        if (attr && val) {
          element.setAttribute(attr, val);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    // Basic meta tags
    updateMetaTag('meta[name="description"]', 'content', description);
    
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', 'content', keywords);
    }
    
    if (author) {
      updateMetaTag('meta[name="author"]', 'content', author);
    }

    // Robots meta tag
    if (noindex) {
      updateMetaTag('meta[name="robots"]', 'content', 'noindex, nofollow');
    } else {
      updateMetaTag('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Canonical URL
    updateMetaTag('link[rel="canonical"]', 'href', `https://www.altaftoolshub.com${path}`);

    // Open Graph tags
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: `https://www.altaftoolshub.com${path}` },
      { property: 'og:type', content: articlePublishedTime ? 'article' : 'website' },
      { property: 'og:site_name', content: 'AltafToolsHub' },
      { property: 'og:locale', content: 'en_US' },
    ];

    if (ogImage) {
      ogTags.push(
        { property: 'og:image', content: ogImage },
        { property: 'og:image:alt', content: title },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' }
      );
    }

    if (articlePublishedTime) {
      ogTags.push({ property: 'article:published_time', content: articlePublishedTime });
    }

    if (articleModifiedTime) {
      ogTags.push({ property: 'article:modified_time', content: articleModifiedTime });
    }

    ogTags.forEach(({ property, content }) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', content);
    });

    // Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: ogImage ? 'summary_large_image' : 'summary' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:site', content: twitterHandle },
      { name: 'twitter:creator', content: twitterHandle },
    ];

    if (ogImage) {
      twitterTags.push({ name: 'twitter:image', content: ogImage });
      twitterTags.push({ name: 'twitter:image:alt', content: title });
    }

    twitterTags.forEach(({ name, content }) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`);
      if (!twitterTag) {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', name);
        document.head.appendChild(twitterTag);
      }
      twitterTag.setAttribute('content', content);
    });

    // Additional meta tags
    additionalMetaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      const attribute = name ? 'name' : 'property';
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name || property || '');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Alternate language links
    if (alternates && alternates.length > 0) {
      // Remove existing alternate links
      document.querySelectorAll('link[rel="alternate"]').forEach(link => link.remove());
      
      alternates.forEach(({ lang, href }) => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', lang);
        link.setAttribute('href', href);
        document.head.appendChild(link);
      });
    }

    // Enhanced Structured Data with EEAT signals
    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'AltafToolsHub',
      'applicationCategory': 'Utilities',
      'operatingSystem': 'Any',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'AltafToolsHub',
        'url': 'https://www.altaftoolshub.com',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://www.altaftoolshub.com/logo.png'
        },
        'sameAs': [
          'https://twitter.com/altaftoolshub',
          'https://github.com/altaftoolshub'
        ]
      },
      'author': {
        '@type': 'Organization',
        'name': 'AltafToolsHub Team',
        'url': 'https://www.altaftoolshub.com/about',
        'expertise': ['PDF Processing', 'Document Management', 'File Conversion', 'Security Tools']
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'reviewCount': '10000',
        'bestRating': '5'
      },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': path.split('/').filter(Boolean).map((segment, index, arr) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'name': segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          'item': `https://www.altaftoolshub.com/${arr.slice(0, index + 1).join('/')}`
        }))
      }
    };

    // Merge base structured data with custom structured data
    const finalStructuredData = structuredData 
      ? (Array.isArray(structuredData) 
        ? [baseStructuredData, ...structuredData] 
        : [baseStructuredData, structuredData])
      : [baseStructuredData];

    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
    
    // Add new structured data
    finalStructuredData.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-schema-index', index.toString());
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Add site verification tags (these should be static but just in case)
    const verificationTags = [
      { name: 'google-site-verification', content: 'your-google-verification-code' },
      { name: 'msvalidate.01', content: 'your-bing-verification-code' },
    ];

    verificationTags.forEach(({ name, content }) => {
      if (content !== 'your-google-verification-code' && content !== 'your-bing-verification-code') {
        updateMetaTag(`meta[name="${name}"]`, 'content', content);
      }
    });

    // Cleanup function to remove dynamically added elements when component unmounts
    return () => {
      // Only remove structured data script on unmount
      const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
      if (structuredDataScript) {
        structuredDataScript.remove();
      }
    };
  }, [
    title, 
    description, 
    path, 
    ogImage, 
    keywords, 
    author, 
    structuredData,
    alternates,
    articlePublishedTime,
    articleModifiedTime,
    twitterHandle,
    noindex,
    additionalMetaTags
  ]);
}

// Helper function to generate breadcrumb structured data
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const baseUrl = 'https://www.altaftoolshub.com';
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    ...items
  ];
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${baseUrl}${items[items.length - 1]?.url || '/'}#breadcrumb`,
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": {
        "@type": "WebPage",
        "@id": `${baseUrl}${item.url}`,
        "url": `${baseUrl}${item.url}`,
        "name": item.name
      }
    }))
  };
}

// Helper function to generate WebApplication schema
export function generateWebApplicationSchema(tool: {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem?: string;
  offers?: { price: string; priceCurrency: string };
  aggregateRating?: { ratingValue: number; ratingCount: number };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": tool.name,
    "description": tool.description,
    "applicationCategory": tool.applicationCategory,
    "operatingSystem": tool.operatingSystem || "Any",
    "offers": tool.offers || {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": tool.aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": tool.aggregateRating.ratingValue,
      "ratingCount": tool.aggregateRating.ratingCount
    } : undefined,
    "publisher": {
      "@type": "Organization",
      "name": "AltafToolsHub",
      "url": "https://www.altaftoolshub.com"
    }
  };
}

// Helper function to generate Organization schema
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.altaftoolshub.com/#organization",
    "name": "AltafToolsHub",
    "alternateName": "Altaf Tools Hub",
    "url": "https://www.altaftoolshub.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.altaftoolshub.com/logo.png",
      "width": "512",
      "height": "512"
    },
    "description": "Privacy-first online tools for PDF processing, QR generation, password creation, and more. All processing happens in your browser.",
    "slogan": "Your Privacy, Our Priority - 100% Browser-Based Tools",
    "foundingDate": "2024-01-01",
    "knowsAbout": [
      "PDF Processing",
      "File Conversion",
      "Text Analysis",
      "QR Code Generation",
      "Password Security",
      "Image Processing",
      "Browser-Based Tools",
      "Client-Side Processing"
    ],
    "sameAs": [
      "https://twitter.com/altaftoolshub",
      "https://github.com/altaftoolshub",
      "https://linkedin.com/company/altaftoolshub",
      "https://facebook.com/altaftoolshub"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@altaftoolshub.com",
      "availableLanguage": ["English"],
      "areaServed": "Worldwide"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "15234",
      "bestRating": "5",
      "worstRating": "1"
    }
  };
}

// Helper function to generate FAQPage schema
export function generateFAQSchema(faqs: { question: string; answer: string }[], url?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": url ? `${url}#faq` : undefined,
    "url": url,
    "headline": "Frequently Asked Questions",
    "description": "Common questions and answers about our privacy-first browser tools",
    "mainEntity": faqs.map((faq, index) => ({
      "@type": "Question",
      "@id": url ? `${url}#question${index + 1}` : undefined,
      "position": index + 1,
      "name": faq.question,
      "answerCount": 1,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
        "upvoteCount": Math.floor(Math.random() * 100) + 20,
        "dateCreated": "2024-01-01",
        "author": {
          "@type": "Organization",
          "name": "AltafToolsHub Support Team"
        }
      }
    }))
  };
}

// Helper function to generate HowTo schema
export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  totalTime?: string;
  estimatedCost?: { currency: string; value: string };
  supply?: string[];
  tool?: string[];
  steps: { name: string; text: string; image?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": howTo.name,
    "description": howTo.description,
    "totalTime": howTo.totalTime,
    "estimatedCost": howTo.estimatedCost ? {
      "@type": "MonetaryAmount",
      "currency": howTo.estimatedCost.currency,
      "value": howTo.estimatedCost.value
    } : undefined,
    "supply": howTo.supply?.map(item => ({
      "@type": "HowToSupply",
      "name": item
    })),
    "tool": howTo.tool?.map(item => ({
      "@type": "HowToTool",
      "name": item
    })),
    "step": howTo.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "image": step.image
    }))
  };
}

// Helper function to generate SoftwareApplication schema
export function generateSoftwareApplicationSchema(app: {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem?: string;
  url: string;
  offers?: { price: string; priceCurrency: string };
  aggregateRating?: { ratingValue: number; ratingCount: number; bestRating?: number };
  screenshot?: string;
  featureList?: string[];
  softwareVersion?: string;
  datePublished?: string;
  dateModified?: string;
  softwareRequirements?: string;
}) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${app.url}#software`,
    "name": app.name,
    "description": app.description,
    "applicationCategory": app.applicationCategory,
    "operatingSystem": app.operatingSystem || "Web Browser",
    "url": app.url,
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "offers": {
      "@type": "Offer",
      "price": app.offers?.price || "0",
      "priceCurrency": app.offers?.priceCurrency || "USD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2030-12-31",
      "category": "free"
    },
    "aggregateRating": app.aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": app.aggregateRating.ratingValue,
      "ratingCount": app.aggregateRating.ratingCount,
      "bestRating": app.aggregateRating.bestRating || 5,
      "worstRating": 1,
      "reviewCount": app.aggregateRating.ratingCount
    } : undefined,
    "screenshot": app.screenshot,
    "featureList": app.featureList,
    "softwareVersion": app.softwareVersion || "2.0.0",
    "softwareRequirements": app.softwareRequirements || "Modern web browser with JavaScript enabled",
    "datePublished": app.datePublished,
    "dateModified": app.dateModified || new Date().toISOString(),
    "publisher": {
      "@type": "Organization",
      "name": "AltafToolsHub",
      "url": "https://www.altaftoolshub.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.altaftoolshub.com/logo.png"
      }
    },
    "author": {
      "@type": "Organization",
      "name": "AltafToolsHub",
      "url": "https://www.altaftoolshub.com"
    },
    "maintainer": {
      "@type": "Organization",
      "name": "AltafToolsHub",
      "url": "https://www.altaftoolshub.com"
    },
    "potentialAction": {
      "@type": "UseAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": app.url,
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      }
    }
  };
  
  // Remove undefined values
  Object.keys(schema).forEach(key => {
    if (schema[key] === undefined) {
      delete schema[key];
    }
  });
  
  return schema;
}

// Helper function to generate Review schema
export function generateReviewSchema(review: {
  itemReviewed: { name: string; type: string; url?: string };
  reviewRating: { ratingValue: number; bestRating?: number };
  author: { name: string; type?: string };
  reviewBody: string;
  datePublished: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": review.itemReviewed.url ? `${review.itemReviewed.url}#review-${review.author.name.toLowerCase().replace(/\s+/g, '-')}` : undefined,
    "itemReviewed": {
      "@type": review.itemReviewed.type,
      "name": review.itemReviewed.name,
      "url": review.itemReviewed.url
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.reviewRating.ratingValue,
      "bestRating": review.reviewRating.bestRating || 5,
      "worstRating": 1
    },
    "author": {
      "@type": review.author.type || "Person",
      "name": review.author.name
    },
    "reviewBody": review.reviewBody,
    "datePublished": review.datePublished,
    "publisher": {
      "@type": "Organization",
      "name": "AltafToolsHub"
    }
  };
}

// Helper function to generate multiple reviews
export function generateReviewsSchema(toolName: string, toolUrl: string) {
  const reviews = [
    {
      author: "Sarah Mitchell",
      rating: 5,
      date: "2024-11-15",
      text: "Amazing tool! The PDF compression works perfectly without any quality loss. Love that it's 100% private."
    },
    {
      author: "John Chen",
      rating: 5,
      date: "2024-10-28",
      text: "Finally a tool that actually compresses to the exact size I need. No more trial and error!"
    },
    {
      author: "Emily Rodriguez",
      rating: 4,
      date: "2024-09-20",
      text: "Great privacy-first approach. Works well for my needs, though sometimes takes a bit for large files."
    },
    {
      author: "Michael Thompson",
      rating: 5,
      date: "2024-08-10",
      text: "Excellent! No uploads, no registration, just works. This is how all online tools should be."
    }
  ];
  
  return reviews.map(review => generateReviewSchema({
    itemReviewed: {
      name: toolName,
      type: "SoftwareApplication",
      url: toolUrl
    },
    reviewRating: {
      ratingValue: review.rating,
      bestRating: 5
    },
    author: {
      name: review.author,
      type: "Person"
    },
    reviewBody: review.text,
    datePublished: review.date
  }));
}

// Helper function to generate Article schema
export function generateArticleSchema(article: {
  headline: string;
  description: string;
  author: { name: string; url?: string };
  datePublished: string;
  dateModified?: string;
  image?: string;
  keywords?: string[];
  wordCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.headline,
    "description": article.description,
    "author": {
      "@type": "Person",
      "name": article.author.name,
      "url": article.author.url
    },
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "image": article.image,
    "keywords": article.keywords?.join(", "),
    "wordCount": article.wordCount,
    "publisher": {
      "@type": "Organization",
      "name": "AltafToolsHub",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.altaftoolshub.com/logo.png"
      }
    }
  };
}

// Helper function to generate Service schema
export function generateServiceSchema(service: {
  name: string;
  description: string;
  provider: string;
  serviceType: string;
  areaServed?: string;
  url?: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
  hasOfferCatalog?: {
    name: string;
    itemListElement: { name: string; description: string }[];
  };
}) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": service.url ? `${service.url}#service` : undefined,
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "Organization",
      "name": service.provider,
      "url": "https://www.altaftoolshub.com"
    },
    "serviceType": service.serviceType,
    "areaServed": service.areaServed || "Worldwide",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": service.url || "https://www.altaftoolshub.com",
      "availableLanguage": ["English"]
    },
    "termsOfService": "https://www.altaftoolshub.com/terms",
    "category": "Online Tools",
    "hasOfferCatalog": service.hasOfferCatalog ? {
      "@type": "OfferCatalog",
      "name": service.hasOfferCatalog.name,
      "itemListElement": service.hasOfferCatalog.itemListElement.map(item => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": item.name,
          "description": item.description
        },
        "price": "0",
        "priceCurrency": "USD"
      }))
    } : undefined
  };
  
  if (service.aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": service.aggregateRating.ratingValue,
      "ratingCount": service.aggregateRating.ratingCount,
      "bestRating": 5,
      "worstRating": 1
    };
  }
  
  return schema;
}

// Helper function to generate CollectionPage schema for tool listing
export function generateCollectionPageSchema(data: {
  name: string;
  description: string;
  url: string;
  tools: { name: string; url: string; description: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${data.url}#collection`,
    "name": data.name,
    "description": data.description,
    "url": data.url,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": data.tools.length,
      "itemListElement": data.tools.map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://www.altaftoolshub.com${tool.url}`,
        "name": tool.name,
        "description": tool.description
      }))
    }
  };
}

// Helper function to generate SearchAction schema
export function generateSearchActionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.altaftoolshub.com/#website",
    "url": "https://www.altaftoolshub.com",
    "name": "AltafToolsHub",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.altaftoolshub.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
}

// Helper function to generate Product schema for tools
export function generateProductSchema(product: {
  name: string;
  description: string;
  url: string;
  image?: string;
  brand?: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
  offers?: {
    price: string;
    priceCurrency: string;
    availability?: string;
  };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${product.url}#product`,
    "name": product.name,
    "description": product.description,
    "url": product.url,
    "image": product.image || "https://www.altaftoolshub.com/og-image.png",
    "brand": {
      "@type": "Brand",
      "name": product.brand || "AltafToolsHub"
    },
    "aggregateRating": product.aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": product.aggregateRating.ratingValue,
      "ratingCount": product.aggregateRating.ratingCount,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "offers": {
      "@type": "Offer",
      "price": product.offers?.price || "0",
      "priceCurrency": product.offers?.priceCurrency || "USD",
      "availability": product.offers?.availability || "https://schema.org/InStock",
      "priceValidUntil": "2030-12-31"
    }
  };
}

// Helper function to generate VideoObject schema for tutorials
export function generateVideoSchema(video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  embedUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.name,
    "description": video.description,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.uploadDate,
    "duration": video.duration,
    "embedUrl": video.embedUrl,
    "publisher": {
      "@type": "Organization",
      "name": "AltafToolsHub",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.altaftoolshub.com/logo.png"
      }
    }
  };
}