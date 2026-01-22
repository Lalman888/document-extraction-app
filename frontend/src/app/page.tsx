"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileImage, Upload, Database, Sparkles, ArrowRight, CheckCircle, Zap, Shield, BarChart3 } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

interface Stats {
  orders: number;
  order_details: number;
  products: number;
  customers: number;
}

interface LLMStatus {
  providers: {
    openai: { configured: boolean; is_primary: boolean };
    gemini: { configured: boolean; is_primary: boolean };
  };
  primary: string;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const [statsRes, llmRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/database/stats?extracted_only=true`),
          fetch(`${API_BASE_URL}/api/llm/status`)
        ]);
        
        if (statsRes.ok && llmRes.ok) {
          const statsData = await statsRes.json();
          const llmData = await llmRes.json();
          
          if (statsData.success) setStats(statsData.data);
          if (llmData.success) setLlmStatus(llmData.data);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch {
        setIsConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <FileImage className="h-5 w-5" />
            Invoice Extractor
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/invoices">Invoices</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/adr">ADR</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by GPT-4o Vision + Gemini
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Extract Invoice Data <br />
            <span className="text-muted-foreground">In Seconds</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Upload any invoice image and our AI will automatically extract structured data—
            customer info, line items, totals—and save it to your database.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" asChild>
              <Link href="/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Invoice
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/invoices">
                <Database className="h-4 w-4 mr-2" />
                View Database
              </Link>
            </Button>
          </div>
        </section>

        {/* Connection Status */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
          <Card className={isConnected ? "border-green-500/50" : isConnected === false ? "border-destructive/50" : ""}>
            <CardContent className="py-3 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : isConnected === false ? 'bg-destructive' : 'bg-yellow-500 animate-pulse'}`} />
                <span className={`text-sm ${isConnected ? 'text-green-600 dark:text-green-400' : isConnected === false ? 'text-destructive' : 'text-yellow-600'}`}>
                  {isConnected ? 'Backend Connected' : isConnected === false ? 'Backend Offline' : 'Checking...'}
                </span>
              </div>
              {llmStatus && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    OpenAI {llmStatus.providers.openai.is_primary && '(Primary)'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Gemini {!llmStatus.providers.openai.is_primary && '(Primary)'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Stats Section - Extracted Orders Only */}
        {stats && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{stats.orders.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Extracted Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{stats.order_details.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Line Items</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">1. Upload Invoice</CardTitle>
                <CardDescription>
                  Drag & drop or browse to upload any invoice image (PNG, JPG, PDF)
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">2. AI Extraction</CardTitle>
                <CardDescription>
                  GPT-4o Vision analyzes the invoice and extracts all structured data in seconds
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">3. Save to Database</CardTitle>
                <CardDescription>
                  Review extracted data and save directly to your Excel database with one click
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Features */}
        <section className="container py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">95%+ Accuracy</p>
                <p className="text-sm text-muted-foreground">High confidence extraction</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Real-time Processing</p>
                <p className="text-sm text-muted-foreground">Results in seconds</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Dual LLM Fallback</p>
                <p className="text-sm text-muted-foreground">OpenAI + Gemini backup</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Data Validation</p>
                <p className="text-sm text-muted-foreground">Auto math verification</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          Document Extraction App • Next.js 16 + Flask 3.1.2 • Case Study
        </div>
      </footer>
    </div>
  );
}
