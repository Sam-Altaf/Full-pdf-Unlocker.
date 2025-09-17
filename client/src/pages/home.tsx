import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Lock, Image, Shield, Zap, Check, ArrowRight, 
  Search, Star, Users, Globe, Download, TrendingUp,
  Clock, ChevronRight, Sparkles, QrCode, Calculator,
  BookOpen, FileCode, Type, PenTool, Book, X
} from "lucide-react";
import { useSEO, generateOrganizationSchema, generateWebApplicationSchema, generateFAQSchema, generateServiceSchema } from "@/hooks/use-seo";
import { motion, AnimatePresence } from "framer-motion";
import { LogoIcon } from "@/components/logo";
import { 
  toolCategories, 
  allTools, 
  popularTools, 
  availableTools, 
  comingSoonTools,
  platformStats,
  Tool 
} from "@/lib/tools-data";
import { cn } from "@/lib/utils";
import { platformComparison } from "@/lib/tool-content-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCw } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "100% Privacy",
    description: "All processing happens in your browser. Your files never leave your device.",
    gradient: "from-purple-500 to-blue-500"
  },
  {
    icon: Zap,
    title: "Lightning Fast", 
    description: "Instant processing with no upload delays or server wait times.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Check,
    title: "Always Free",
    description: "Professional-grade tools, completely free. No limits, no subscriptions.",
    gradient: "from-cyan-500 to-teal-500"
  }
];

const stats = [
  { value: "60+", label: "Total Tools", description: "All file types covered", icon: FileText },
  { value: platformStats.availableTools.toString(), label: "Available Now", description: "Ready to use", icon: Check },
  { value: "100%", label: "Privacy", description: "Browser-based", icon: Shield },
  { value: "Free", label: "Forever", description: "No hidden costs", icon: Star }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marketing Manager",
    content: "Finally, PDF tools that respect my privacy! No more worrying about sensitive documents being uploaded to unknown servers.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "David Kumar",
    role: "Software Developer",
    content: "The client-side processing is brilliant. Fast, secure, and works offline once loaded. Exactly what I needed.",
    rating: 5,
    avatar: "DK"
  },
  {
    name: "Emily Rodriguez",
    role: "Academic Researcher",
    content: "I use the PDF compressor daily for research papers. The precision in file size targeting is unmatched.",
    rating: 5,
    avatar: "ER"
  }
];

// Enhanced Tool Card Component with premium animations
const ToolCard = ({ tool }: { tool: Tool }) => {
  const Icon = tool.icon;
  
  return (
    <Link href={tool.available ? tool.href : "#"}>
      <motion.div
        whileHover={tool.available ? { scale: 1.03, y: -5 } : {}}
        whileTap={tool.available ? { scale: 0.98 } : {}}
        className="h-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.4, 0, 0.2, 1],
          hover: { duration: 0.3 }
        }}
      >
        <Card className={cn(
          "tool-card relative h-full p-7 transition-all duration-500 cursor-pointer group min-h-[320px]",
          "hover:shadow-2xl",
          !tool.available && "opacity-70 cursor-not-allowed hover:opacity-70"
        )} data-testid={`tool-card-${tool.id}`}>
          {/* New/Popular/Coming Soon Badge */}
          {(tool.new || tool.popular || !tool.available) && (
            <div className="absolute top-3 right-3">
              {tool.new && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Badge className="bg-gradient-to-r from-green-500/20 to-green-400/10 text-green-600 dark:text-green-400 border-green-500/30 font-semibold shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                    New
                  </Badge>
                </motion.div>
              )}
              {tool.popular && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  <Badge className="bg-gradient-to-r from-primary/20 to-blue-500/10 text-primary border-primary/30 font-semibold shadow-lg">
                    <Star className="w-3 h-3 mr-1 animate-pulse-glow" />
                    Popular
                  </Badge>
                </motion.div>
              )}
              {!tool.available && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Badge variant="secondary" className="bg-gradient-to-r from-gray-500/20 to-gray-400/10 border-gray-500/30 font-medium">
                    <Clock className="w-3 h-3 mr-1 animate-pulse" />
                    Coming Soon
                  </Badge>
                </motion.div>
              )}
            </div>
          )}
          
          {/* Enhanced Icon with glow effect */}
          <motion.div 
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all shadow-lg",
              "bg-gradient-to-br", tool.color,
              tool.available && "group-hover:scale-110 group-hover:shadow-xl group-hover:rotate-3"
            )}
            whileHover={tool.available ? { rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-8 h-8 text-white drop-shadow-lg" />
          </motion.div>
          
          {/* Content */}
          <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
            {tool.title}
            {tool.available && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="inline-block"
              >
                <ChevronRight className="w-5 h-5 text-primary" />
              </motion.div>
            )}
          </h3>
          <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300 mb-3">
            {tool.extendedDescription || tool.description}
          </p>
          {tool.features && (
            <div className="space-y-1 text-sm text-muted-foreground/70">
              {tool.features.slice(0, 2).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </Link>
  );
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [, navigate] = useLocation();
  
  // Show limited tools per category initially
  const INITIAL_TOOLS_COUNT = 3; // Show only 3, then redirect to All Tools page

  // Filter tools based on search and category
  const filteredTools = allTools.filter(tool => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (searchLower === '') {
      return selectedCategory === "all" || tool.category === selectedCategory;
    }
    const matchesSearch = tool.title.toLowerCase().includes(searchLower) ||
                          tool.description.toLowerCase().includes(searchLower) ||
                          tool.category.toLowerCase().includes(searchLower) ||
                          tool.id.toLowerCase().includes(searchLower);
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Comprehensive structured data for homepage
  const structuredData = [
    generateOrganizationSchema(),
    generateWebApplicationSchema({
      name: "AltafToolsHub - Free Privacy-First Online Tools",
      description: "Complete suite of 60+ privacy-first online tools for PDF compression, image conversion, document processing, and more. All processing happens directly in your browser - no uploads, no server storage, 100% private.",
      applicationCategory: "UtilitiesApplication",
      aggregateRating: {
        ratingValue: 4.9,
        ratingCount: 2847
      }
    }),
    generateFAQSchema([
      {
        question: "Are my files safe when using AltafToolsHub?",
        answer: "Yes, absolutely! All file processing happens directly in your browser. Your files never leave your device and are never uploaded to any server. This ensures 100% privacy and security."
      },
      {
        question: "How many tools are available on AltafToolsHub?",
        answer: `We offer ${platformStats.totalTools}+ tools, with ${platformStats.availableTools} currently available and more being added regularly. All tools are free to use with no limits.`
      },
      {
        question: "Do I need to create an account?",
        answer: "No account required! All tools are instantly accessible without registration, login, or any personal information."
      }
    ])
  ];

  useSEO({
    title: "AltafToolsHub - 60+ Free Privacy-First PDF & File Tools | No Upload Required",
    description: "Complete suite of 60+ privacy-first online tools. PDF compression, image conversion, document processing & more. 100% browser-based processing - your files never leave your device. Free forever, no registration.",
    path: "/",
    keywords: "pdf tools, online file converter, privacy first tools, pdf compressor, image to pdf, document converter, browser based tools, no upload file tools, free pdf editor, secure file processing",
    ogImage: "https://www.altaftoolshub.com/og-image.png",
    structuredData,
    additionalMetaTags: [
      { name: "application-name", content: "AltafToolsHub" },
      { property: "og:site_name", content: "AltafToolsHub" },
      { property: "og:type", content: "website" }
    ]
  });

  return (
    <div className="min-h-screen pattern-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient">
        {/* Tech Circuit Animation Layer */}
        <div className="hero-circuit" />
        
        <div className="hero-content container mx-auto px-4 py-6 lg:py-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-white/25 via-white/20 to-white/15 backdrop-blur-md text-white mb-8 shadow-xl border border-white/10"
              initial={{ scale: 0, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
              data-testid="hero-badge"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Shield className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">100% Privacy Guaranteed</span>
            </motion.div>

            {/* Enhanced Heading with better contrast */}
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 text-white leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              style={{
                textShadow: `
                  0 0 30px rgba(0, 168, 255, 0.6),
                  0 0 60px rgba(0, 168, 255, 0.4),
                  0 0 90px rgba(0, 168, 255, 0.2),
                  0 2px 4px rgba(0, 0, 0, 0.8)
                `
              }}
            >
              <motion.span
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Professional File Tools,{" "}
              </motion.span>
              <motion.span 
                className="text-yellow-300 inline-block"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                Zero Cloud Upload
              </motion.span>
            </motion.h1>
            
            {/* Enhanced Subheading with better readability */}
            <motion.p 
              className="text-lg sm:text-xl lg:text-2xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              style={{
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.7), 0 1px 2px rgba(0, 0, 0, 0.9)"
              }}
            >
              Process PDFs, images, and documents instantly in your browser. 
              Your files stay on your device with enterprise-grade privacy. Free forever, no registration.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.div
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Link href="/compress-pdf">
                  <Button size="lg" className="hero-btn-primary text-white px-10 py-6 text-lg font-semibold shadow-2xl" data-testid="button-try-compressor">
                    <motion.div
                      className="mr-2"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                    Try PDF Compressor
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button 
                  size="lg" 
                  className="hero-btn-secondary px-10 py-6 text-lg font-semibold"
                  onClick={() => {
                    document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  data-testid="button-browse-tools"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Browse All Tools
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.8
                  }
                }
              }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.8 },
                    visible: { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 12
                      }
                    }
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Card className="p-4 text-center glass h-full" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: index * 0.2 }}
                    >
                      <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                    </motion.div>
                    <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-sm font-medium">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        
        {/* Enhanced Floating Icons - More Tool-Related Symbols */}
        <motion.div 
          className="absolute top-32 left-20 opacity-20"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          aria-hidden="true"
        >
          <FileText className="w-12 h-12 text-blue-400" />
        </motion.div>
        
        <motion.div 
          className="absolute top-48 right-32 opacity-20"
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -360]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          aria-hidden="true"
        >
          <Image className="w-10 h-10 text-cyan-400" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-32 right-20 opacity-20"
          animate={{ 
            y: [0, -15, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          aria-hidden="true"
        >
          <Shield className="w-14 h-14 text-green-400" />
        </motion.div>
        
        {/* Additional Tool-Related Floating Icons */}
        <motion.div 
          className="absolute top-60 left-1/3 opacity-20"
          animate={{ 
            y: [0, -25, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
          aria-hidden="true"
        >
          <QrCode className="w-8 h-8 text-purple-400" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-48 left-16 opacity-20"
          animate={{ 
            y: [0, 18, 0],
            x: [0, -12, 0],
            rotate: [0, -90, 0]
          }}
          transition={{ 
            duration: 11, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
          aria-hidden="true"
        >
          <Calculator className="w-9 h-9 text-emerald-400" />
        </motion.div>
        
        <motion.div 
          className="absolute top-72 right-16 opacity-20"
          animate={{ 
            y: [0, -22, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 9, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
          aria-hidden="true"
        >
          <Lock className="w-11 h-11 text-red-400" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-60 right-1/3 opacity-20"
          animate={{ 
            y: [0, 16, 0],
            rotate: [0, 45, 0]
          }}
          transition={{ 
            duration: 13, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.5
          }}
          aria-hidden="true"
        >
          <BookOpen className="w-10 h-10 text-amber-400" />
        </motion.div>
        
        <motion.div 
          className="absolute top-80 left-1/4 opacity-20"
          animate={{ 
            y: [0, -14, 0],
            x: [0, 8, 0]
          }}
          transition={{ 
            duration: 14, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3.5
          }}
          aria-hidden="true"
        >
          <FileCode className="w-9 h-9 text-indigo-400" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-80 left-1/2 opacity-20"
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -45, 0]
          }}
          transition={{ 
            duration: 16, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4.5
          }}
          aria-hidden="true"
        >
          <Type className="w-8 h-8 text-pink-400" />
        </motion.div>
        
        <motion.div 
          className="absolute top-96 right-1/4 opacity-20"
          animate={{ 
            y: [0, -18, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          aria-hidden="true"
        >
          <PenTool className="w-9 h-9 text-teal-400" />
        </motion.div>
        
        {/* Enhanced Sparkle Effects */}
        <div className="absolute top-1/4 left-1/4 animate-sparkle">
          <Sparkles className="w-6 h-6 text-yellow-400 opacity-60" />
        </div>
        <div className="absolute top-3/4 right-1/3 animate-sparkle animation-delay-2000">
          <Sparkles className="w-4 h-4 text-purple-400 opacity-60" />
        </div>
        <div className="absolute bottom-1/4 left-1/2 animate-sparkle animation-delay-4000">
          <Sparkles className="w-5 h-5 text-blue-400 opacity-60" />
        </div>
        <div className="absolute top-1/3 right-1/6 animate-sparkle animation-delay-1000">
          <Sparkles className="w-5 h-5 text-green-400 opacity-50" />
        </div>
        <div className="absolute bottom-1/3 left-1/6 animate-sparkle animation-delay-3000">
          <Sparkles className="w-4 h-4 text-cyan-400 opacity-55" />
        </div>
        <div className="absolute top-2/3 left-2/3 animate-sparkle animation-delay-5000">
          <Sparkles className="w-6 h-6 text-pink-400 opacity-45" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose AltafToolsHub?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools with enterprise-level security, completely free
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full glass hover:shadow-lg transition-shadow">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    "bg-gradient-to-br", feature.gradient
                  )}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Tools Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border-green-500/30">
              <Check className="w-3 h-3 mr-1" />
              Ready to Use Now
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="gradient-text">Available Tools</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              These tools are ready to use right now. All processing happens in your browser for complete privacy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
            {allTools.filter(tool => tool.available).slice(0, 6).map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link href={tool.href}>
                    <Card className="p-6 h-full hover:shadow-xl transition-all group cursor-pointer" data-testid={`available-tool-${tool.id}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          "bg-gradient-to-br",
                          tool.color
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {tool.popular && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {tool.description}
                      </p>
                      {tool.features && (
                        <div className="text-xs text-muted-foreground/70">
                          {tool.features.slice(0, 2).map((feature, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 mr-3">
                              <Check className="w-3 h-3 text-green-500" />
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          
          {/* See More Button */}
          <div className="text-center">
            <Link href="/all-tools?category=available">
              <Button size="lg" className="btn-gradient text-white" data-testid="button-see-more-available">
                View All {allTools.filter(tool => tool.available).length} Available Tools
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools-section" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Complete Suite of <span className="gradient-text">60+ Tools</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Professional file processing tools for every need. New tools added regularly.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                  data-testid="input-search-tools"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="flex flex-wrap justify-center mb-8 h-auto p-1 bg-muted/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All Tools ({allTools.length})
              </TabsTrigger>
              {toolCategories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid={`tab-${category.id}`}
                >
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.name} ({category.tools.length})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              {selectedCategory === "all" && searchQuery === '' ? (
                // Show all tools grouped by category with see more/less functionality
                <div className="space-y-12">
                  {toolCategories.map((category) => {
                    const toolsToShow = category.tools.slice(0, INITIAL_TOOLS_COUNT);
                    const hasMoreTools = category.tools.length > INITIAL_TOOLS_COUNT;
                    
                    return (
                      <div key={category.id} id={category.id}>
                        <div className="flex items-center gap-3 mb-6">
                          <category.icon className="w-6 h-6 text-primary" />
                          <h3 className="text-2xl font-bold">{category.name}</h3>
                          <Badge variant="secondary" className="ml-auto">
                            {category.tools.length} tools
                          </Badge>
                        </div>
                        <motion.div 
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                        >
                          {toolsToShow.map((tool) => (
                            <motion.div key={tool.id} variants={itemVariants}>
                              <ToolCard tool={tool} />
                            </motion.div>
                          ))}
                        </motion.div>
                        
                        {/* See All Button - Redirects to All Tools page */}
                        {hasMoreTools && (
                          <motion.div 
                            className="flex justify-center mt-8"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                          >
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                navigate(`/all-tools?category=${category.id}`);
                              }}
                              className="group px-8 py-3 text-base font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                              data-testid={`button-see-all-${category.id}`}
                            >
                              <motion.div
                                whileHover={{ x: 3 }}
                                className="mr-2"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </motion.div>
                              See All {category.name} ({category.tools.length} tools)
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Show filtered tools when searching or filtering
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredTools.map((tool) => (
                    <motion.div key={tool.id} variants={itemVariants}>
                      <ToolCard tool={tool} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>

          {/* No results message */}
          {filteredTools.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No tools found matching your search. Try a different keyword or category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Tools Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Most Popular Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trusted by thousands of users daily for secure file processing
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {popularTools.slice(0, 6).map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={tool.href}>
                    <Card className="p-6 h-full hover:shadow-xl transition-all group cursor-pointer" data-testid={`popular-tool-${tool.id}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center",
                          "bg-gradient-to-br", tool.color
                        )}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {tool.description}
                      </p>
                      <div className="flex items-center text-primary">
                        <span className="text-sm font-medium">Try Now</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Professionals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users who trust AltafToolsHub for secure file processing
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Comparison Section */}
      <section className="py-20 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4" variant="outline">
              <TrendingUp className="mr-1 h-3 w-3" />
              Platform Comparison
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">AltafToolsHub</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how we compare to other popular platforms. More tools, better privacy, zero cost.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-xl border shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px] font-bold">Feature</TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <LogoIcon className="h-6 w-6 text-primary" />
                        <span className="font-bold text-primary">AltafToolsHub</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="text-sm">Adobe Acrobat</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="text-sm">SmallPDF</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="text-sm">iLovePDF</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="text-sm">PDF24</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    platformComparison.reduce((acc, item) => {
                      if (!acc[item.category]) {
                        acc[item.category] = [];
                      }
                      acc[item.category].push(item);
                      return acc;
                    }, {} as Record<string, typeof platformComparison>)
                  ).map(([category, items]) => (
                    <React.Fragment key={category}>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="font-semibold text-sm">
                          {category}
                        </TableCell>
                      </TableRow>
                      {items.map((item, idx) => (
                        <TableRow 
                          key={`${category}-${idx}`}
                          className={cn(
                            item.highlight && "bg-primary/5 font-medium",
                            "hover:bg-muted/50 transition-colors"
                          )}
                        >
                          <TableCell className="font-medium">
                            {item.feature}
                            {item.highlight && (
                              <Badge className="ml-2 text-xs" variant="default">
                                Best
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {typeof item.altafToolsHub === 'boolean' ? (
                              item.altafToolsHub ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                              )
                            ) : (
                              <span className={cn(
                                item.altafToolsHub === "$0" && "text-green-600 font-bold",
                                item.altafToolsHub === "Free" && "text-green-600 font-bold",
                                item.altafToolsHub === "Unlimited" && "text-green-600 font-bold",
                                item.altafToolsHub === "No limit" && "text-green-600 font-bold",
                                item.altafToolsHub === "Never" && "text-green-600 font-bold",
                                item.altafToolsHub === "<1 second" && "text-green-600 font-bold",
                                item.altafToolsHub === "100% Client-Side Processing" && "text-green-600 font-bold"
                              )}>
                                {item.altafToolsHub}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {typeof item.adobeAcrobat === 'boolean' ? (
                              item.adobeAcrobat ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                              )
                            ) : (
                              <span className={cn(
                                item.adobeAcrobat?.includes("$") && "text-orange-600"
                              )}>
                                {item.adobeAcrobat}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {typeof item.smallPDF === 'boolean' ? (
                              item.smallPDF ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                              )
                            ) : (
                              <span className={cn(
                                item.smallPDF?.includes("$") && "text-orange-600",
                                item.smallPDF?.includes("limited") && "text-amber-600"
                              )}>
                                {item.smallPDF}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {typeof item.iLovePDF === 'boolean' ? (
                              item.iLovePDF ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                              )
                            ) : (
                              <span className={cn(
                                item.iLovePDF?.includes("$") && "text-orange-600",
                                item.iLovePDF?.includes("limited") && "text-amber-600"
                              )}>
                                {item.iLovePDF}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {typeof item.pdf24 === 'boolean' ? (
                              item.pdf24 ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                              )
                            ) : (
                              <span className={cn(
                                item.pdf24?.includes("$") && "text-orange-600"
                              )}>
                                {item.pdf24}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Comparison Summary */}
            <div className="p-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-t">
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">100%</div>
                  <div className="text-sm text-muted-foreground">Privacy Guaranteed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-1">$0</div>
                  <div className="text-sm text-muted-foreground">Forever Free</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">60+</div>
                  <div className="text-sm text-muted-foreground">Total Tools</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">No Limits</div>
                  <div className="text-sm text-muted-foreground">Unlimited Usage</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-lg text-muted-foreground mb-6">
              Experience the difference with browser-based processing and complete privacy
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/all-tools">
                <Button size="lg" className="gap-2">
                  <Zap className="h-5 w-5" />
                  Try Any Tool Free
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <Shield className="h-5 w-5" />
                Learn About Privacy
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Start Processing Files Securely
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            No registration, no uploads, no limits. Your privacy is our priority.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/compress-pdf">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100" data-testid="button-cta-pdf">
                <FileText className="w-5 h-5 mr-2" />
                Start with PDF Tools
              </Button>
            </Link>
            <Link href="/#tools-section">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" data-testid="button-cta-explore">
                <Globe className="w-5 h-5 mr-2" />
                Explore All Tools
              </Button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 opacity-90">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>50K+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              <span>1M+ Files Processed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}