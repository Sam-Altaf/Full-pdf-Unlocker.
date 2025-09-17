import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Star, Shield, Zap, Users, Mail, MessageCircle, BookOpen } from "lucide-react";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import { WhyUseSection, UseCasesSection, ComparisonSection, HowItWorksSection } from "@/components/seo/tool-features";
import { ToolFAQ } from "@/components/seo/tool-faq";
import PrivacyNotice from "@/components/privacy-notice";
import { cn } from "@/lib/utils";

export interface ToolPageLayoutProps {
  // Hero section
  toolName: string;
  description: string;
  trustBadge?: string;
  trustIndicators: Array<{
    icon: React.ElementType;
    text: string;
    color: string;
  }>;
  
  // Tool component
  toolComponent: ReactNode;
  
  // Content sections
  howItWorksSteps: Array<{
    number: number;
    title: string;
    description: string;
    icon?: React.ElementType;
  }>;
  
  processingTime?: string;
  
  whyChooseData: {
    benefits: string[];
    features: Array<{
      icon: React.ElementType;
      title: string;
      description: string;
      highlight?: boolean;
    }>;
  };
  
  useCases: Array<{
    title: string;
    description: string;
    icon: React.ElementType;
    example?: string;
  }>;
  
  comparisons: Array<{
    feature: string;
    ourTool: boolean | string;
    others: boolean | string;
    highlight?: boolean;
  }>;
  
  faqs: Array<{
    question: string;
    answer: string;
    category?: string;
  }>;
  
  ratings?: {
    value: number;
    count: number;
    reviews?: Array<{
      rating: number;
      review: string;
      author: string;
      date: string;
    }>;
  };
  
  // Navigation
  breadcrumbPath: string;
  categoryName: string;
  categoryPath: string;
}

export default function ToolPageLayout({
  toolName,
  description,
  trustBadge = "Trusted by 100,000+ professionals worldwide",
  trustIndicators,
  toolComponent,
  howItWorksSteps,
  processingTime = "Less than 5 seconds",
  whyChooseData,
  useCases,
  comparisons,
  faqs,
  ratings,
  breadcrumbPath,
  categoryName,
  categoryPath
}: ToolPageLayoutProps) {
  
  // Group FAQs by category
  const groupedFAQs = faqs.reduce((acc, faq) => {
    const category = faq.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, Array<{ question: string; answer: string }>>);

  return (
    <div className="min-h-screen pattern-bg">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href={categoryPath} className="hover:text-primary transition-colors">{categoryName}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{toolName}</span>
        </nav>

        <Link href={categoryPath}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {categoryName}
          </Button>
        </Link>

        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-12 scroll-mt-24" id="hero">
            <div className="flex justify-center mb-4">
              <Badge className="px-4 py-1 text-sm" variant="secondary">
                <Star className="w-4 h-4 mr-1 fill-yellow-500 text-yellow-500" />
                {trustBadge}
              </Badge>
            </div>
            <h1 className="text-5xl font-bold mb-4 scroll-mt-24">
              {toolName.split(' ')[0]} <span className="gradient-text">{toolName.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              {description}
            </p>
            
            {/* Trust Indicators */}
            <div className="flex justify-center gap-8 mb-8 flex-wrap">
              {trustIndicators.map((indicator, index) => {
                const Icon = indicator.icon;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Icon className={cn("w-5 h-5", indicator.color)} />
                    <span className="text-sm font-medium">{indicator.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Ratings if available */}
            {ratings && (
              <div className="flex justify-center items-center gap-4 mb-8">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "w-5 h-5",
                        i < Math.floor(ratings.value) 
                          ? "fill-yellow-500 text-yellow-500" 
                          : "text-gray-300"
                      )} 
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {ratings.value} out of 5 ({ratings.count.toLocaleString()} reviews)
                </span>
              </div>
            )}
          </section>

          {/* Main Tool */}
          <section className="mb-12 scroll-mt-24" id="tool">
            {toolComponent}
          </section>

          {/* How It Works Section */}
          <HowItWorksSection 
            steps={howItWorksSteps} 
            toolName={toolName}
          />

          {/* Processing Time */}
          <section className="py-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Processing time: {processingTime}</span>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <WhyUseSection 
            toolName={toolName}
            benefits={whyChooseData.benefits}
            features={whyChooseData.features}
          />

          {/* Real World Use Cases */}
          <UseCasesSection useCases={useCases} />

          {/* Ratings and Reviews */}
          {ratings?.reviews && ratings.reviews.length > 0 && (
            <section className="py-12 scroll-mt-24" id="reviews">
              <div className="container mx-auto px-4 max-w-6xl">
                <header>
                  <h2 className="text-3xl font-bold mb-4 scroll-mt-24">
                    User Reviews & Ratings
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    See what our users are saying about {toolName}
                  </p>
                </header>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ratings.reviews.map((review, index) => (
                    <Card key={index} className="p-6">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={cn(
                              "w-4 h-4",
                              i < review.rating 
                                ? "fill-yellow-500 text-yellow-500" 
                                : "text-gray-300"
                            )} 
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">"{review.review}"</p>
                      <div className="text-xs text-muted-foreground">
                        <strong>{review.author}</strong> - {review.date}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Comparison Section */}
          <ComparisonSection 
            toolName={toolName}
            comparisons={comparisons}
          />

          {/* FAQ Section */}
          <section className="py-12 bg-muted/30 scroll-mt-24" id="faq">
            <div className="container mx-auto px-4 max-w-6xl">
              <header>
                <h2 className="text-3xl font-bold mb-4 scroll-mt-24">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Find answers to common questions about {toolName}
                </p>
              </header>
              
              <ToolFAQ faqs={faqs} toolName={toolName} toolPath={breadcrumbPath} />
            </div>
          </section>

          {/* Still Have Questions Section */}
          <section className="py-12 scroll-mt-24" id="support">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <h2 className="text-3xl font-bold mb-4 scroll-mt-24">Still Have Questions?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Can't find what you're looking for? We're here to help!
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 text-center">
                  <Mail className="w-8 h-8 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get detailed help via email
                  </p>
                  <Button variant="outline" size="sm">
                    Contact Us
                  </Button>
                </Card>
                
                <Card className="p-6 text-center">
                  <MessageCircle className="w-8 h-8 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Chat with our support team
                  </p>
                  <Button variant="outline" size="sm">
                    Start Chat
                  </Button>
                </Card>
                
                <Card className="p-6 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Documentation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Detailed guides and tutorials
                  </p>
                  <Button variant="outline" size="sm">
                    Read Docs
                  </Button>
                </Card>
              </div>
            </div>
          </section>

          {/* Privacy Notice */}
          <PrivacyNotice message="🔒 Your privacy is our priority. All file processing happens locally in your browser - your files never leave your device or get uploaded to any server." />
        </div>
      </div>
    </div>
  );
}