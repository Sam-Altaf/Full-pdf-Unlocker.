import { Card } from "@/components/ui/card";
import { Check, Zap, Shield, Globe, RefreshCw, Clock, Sparkles, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
}

interface WhyUseSectionProps {
  toolName: string;
  benefits: string[];
  features: Feature[];
}

export function WhyUseSection({ toolName, benefits, features }: WhyUseSectionProps) {
  return (
    <section className="py-12 border-t" data-testid="section-why-use">
      <article className="container mx-auto px-4 max-w-6xl">
        <header>
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-why-use">
            Why Choose Our {toolName}?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Experience the perfect combination of security, speed, and simplicity
          </p>
        </header>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Key Benefits</h3>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3" data-testid={`benefit-${index}`}>
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Core Features</h3>
            <div className="grid gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index} 
                    className={cn(
                      "p-4 transition-all hover:shadow-md",
                      feature.highlight && "border-primary"
                    )}
                    data-testid={`feature-card-${index}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

interface UseCase {
  title: string;
  description: string;
  icon: React.ElementType;
  example?: string;
}

interface UseCasesSectionProps {
  useCases: UseCase[];
}

export function UseCasesSection({ useCases }: UseCasesSectionProps) {
  return (
    <section className="py-12 bg-muted/30" data-testid="section-use-cases">
      <article className="container mx-auto px-4 max-w-6xl">
        <header>
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-use-cases">
            Real-World Use Cases
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Discover how professionals use our tools to streamline their workflow
          </p>
        </header>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card key={index} className="p-6" data-testid={`use-case-${index}`}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground mb-3">{useCase.description}</p>
                {useCase.example && (
                  <p className="text-sm text-primary italic">Example: {useCase.example}</p>
                )}
              </Card>
            );
          })}
        </div>
      </article>
    </section>
  );
}

interface ComparisonItem {
  feature: string;
  ourTool: boolean | string;
  others: boolean | string;
  highlight?: boolean;
}

interface ComparisonSectionProps {
  toolName: string;
  comparisons: ComparisonItem[];
}

export function ComparisonSection({ toolName, comparisons }: ComparisonSectionProps) {
  return (
    <section className="py-12" data-testid="section-comparison">
      <article className="container mx-auto px-4 max-w-6xl">
        <header>
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-comparison">
            {toolName} vs. Traditional Tools
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            See why privacy-first, browser-based processing is the future
          </p>
        </header>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b font-semibold">Feature</th>
                <th className="text-center p-4 border-b font-semibold text-primary">
                  Our {toolName}
                </th>
                <th className="text-center p-4 border-b font-semibold text-muted-foreground">
                  Traditional Tools
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((item, index) => (
                <tr 
                  key={index} 
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    item.highlight && "bg-primary/5"
                  )}
                  data-testid={`comparison-row-${index}`}
                >
                  <td className="p-4 border-b">{item.feature}</td>
                  <td className="text-center p-4 border-b">
                    {typeof item.ourTool === 'boolean' ? (
                      item.ourTool ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      <span className="text-primary font-medium">{item.ourTool}</span>
                    )}
                  </td>
                  <td className="text-center p-4 border-b">
                    {typeof item.others === 'boolean' ? (
                      item.others ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-red-500">✕</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">{item.others}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Privacy First, Always</h3>
              <p className="text-muted-foreground">
                Unlike traditional online tools that upload your files to their servers, 
                our {toolName} processes everything locally in your browser. Your sensitive 
                data never leaves your device, ensuring complete privacy and security.
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  icon?: React.ElementType;
}

interface HowItWorksSectionProps {
  steps: HowItWorksStep[];
  toolName: string;
}

export function HowItWorksSection({ steps, toolName }: HowItWorksSectionProps) {
  return (
    <section className="py-12 bg-muted/30" data-testid="section-how-it-works">
      <article className="container mx-auto px-4 max-w-6xl">
        <header>
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-how-it-works">
            How Our {toolName} Works
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Simple, secure, and straightforward - get results in seconds
          </p>
        </header>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="relative"
                data-testid={`step-${step.number}`}
              >
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/20 to-transparent z-0" />
                )}
                
                <Card className="p-6 relative z-10 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {Icon && (
                        <div className="mt-3">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Processing time: Less than 5 seconds</span>
          </div>
        </div>
      </article>
    </section>
  );
}

// Pre-defined common features for reuse across tools
export const commonFeatures = {
  privacy: {
    icon: Shield,
    title: "100% Privacy Guaranteed",
    description: "All processing happens in your browser. Files never uploaded to servers.",
    highlight: true
  },
  speed: {
    icon: Zap,
    title: "Lightning Fast",
    description: "Instant processing with no upload delays or server wait times."
  },
  free: {
    icon: Sparkles,
    title: "Completely Free",
    description: "No limits, no watermarks, no subscriptions. Free forever."
  },
  noInstall: {
    icon: Globe,
    title: "No Installation",
    description: "Works directly in your browser. No software to download or install."
  },
  offline: {
    icon: Server,
    title: "Works Offline",
    description: "Once loaded, works without internet connection."
  },
  instant: {
    icon: Clock,
    title: "Instant Results",
    description: "Get your processed files immediately, no waiting."
  },
  batch: {
    icon: RefreshCw,
    title: "Batch Processing",
    description: "Process multiple files at once for efficiency."
  }
};