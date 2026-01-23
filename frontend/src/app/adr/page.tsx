"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileImage, Upload, FileText, CheckCircle2, Database, Zap, Shield, Layers, ArrowDown, ArrowRight, Globe, Server, HardDrive, Brain, Eye, Edit, HelpCircle } from "lucide-react";

const decisions = [
  {
    id: "ADR-001",
    title: "Use Next.js for Frontend",
    status: "Accepted",
    context: "Need a modern React framework that supports SSR, file-based routing, and has excellent developer experience.",
    decision: "Use Next.js 14+ with App Router for the frontend application.",
    consequences: [
      "Fast page loads with automatic code splitting",
      "Built-in API routes if needed",
      "Excellent TypeScript support",
      "Large ecosystem and community"
    ],
    icon: Layers
  },
  {
    id: "ADR-002",
    title: "Use Flask for Backend API",
    status: "Accepted",
    context: "Need a lightweight Python web framework that's easy to set up and works well with data science libraries.",
    decision: "Use Flask with Blueprint pattern for modular route organization.",
    consequences: [
      "Simple and flexible architecture",
      "Easy integration with pandas for Excel operations",
      "Familiar to Python developers",
      "Lightweight with minimal overhead"
    ],
    icon: Zap
  },
  {
    id: "ADR-003",
    title: "Use Excel as Database",
    status: "Accepted",
    context: "The case study requires using the provided Excel file as the data source. Need to support both read and write operations.",
    decision: "Use pandas to read/write Excel files. Separate files for reference data (read-only) and extracted orders (read/write).",
    consequences: [
      "No database setup required",
      "Easy to inspect and modify data manually",
      "Portable - just copy the Excel file",
      "Separate files prevent accidental modification of reference data"
    ],
    icon: Database
  },
  {
    id: "ADR-004",
    title: "Use GPT-4o Vision for Invoice Extraction",
    status: "Accepted",
    context: "Need a vision-capable LLM that can accurately extract structured data from invoice images with high confidence.",
    decision: "Use OpenAI GPT-4o Vision as primary provider with Google Gemini 2.0 Flash as fallback.",
    consequences: [
      "High accuracy (95%+) on invoice extraction",
      "Automatic fallback if primary fails",
      "Structured JSON output with validation",
      "Requires API keys for both providers"
    ],
    icon: Brain
  },
  {
    id: "ADR-005",
    title: "Use Server-Sent Events for Real-time Progress",
    status: "Accepted",
    context: "Invoice extraction takes several seconds. Users need real-time feedback on processing progress.",
    decision: "Implement SSE streaming endpoint that sends step-by-step progress updates from backend to frontend.",
    consequences: [
      "Users see actual backend processing steps",
      "No WebSocket complexity needed",
      "Simple implementation with Flask's stream_with_context",
      "Works with standard HTTP - no special infrastructure"
    ],
    icon: Zap
  },
  {
    id: "ADR-006",
    title: "Use shadcn/ui Component Library",
    status: "Accepted",
    context: "Need a modern, accessible UI component library that works well with Next.js and Tailwind CSS.",
    decision: "Use shadcn/ui for all UI components (buttons, cards, dialogs, tables, etc.).",
    consequences: [
      "Consistent, professional design out of the box",
      "Fully accessible components",
      "Components are copied into project - full control",
      "Works seamlessly with Tailwind CSS"
    ],
    icon: Shield
  }
];

export default function ADRPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <FileImage className="h-5 w-5" />
            Invoice Extractor
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/">Home</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/upload">Upload</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/invoices">Invoices</Link></Button>
            <Button size="sm"><FileText className="h-4 w-4 mr-2" />ADR</Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Architecture Decision Records</h1>
          <p className="text-muted-foreground">
            System architecture and key technical decisions
          </p>
        </div>

        {/* Architecture Diagram */}
        <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle>System Architecture</CardTitle>
            <CardDescription>End-to-end flow from upload to database</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Main Flow Diagram */}
            <div className="space-y-8">
              
              {/* Row 1: User & Frontend */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-2">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">User</span>
                  <span className="text-xs text-muted-foreground">Browser</span>
                </div>
                
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                
                <div className="flex-1 max-w-md">
                  <Card className="border-2 border-blue-500">
                    <CardHeader className="py-3 bg-blue-50 dark:bg-blue-950/50">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-base">Frontend (Next.js)</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 p-2 rounded bg-muted">
                          <Upload className="h-3 w-3" />
                          <span>/upload</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded bg-muted">
                          <Eye className="h-3 w-3" />
                          <span>/invoices</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded bg-muted">
                          <Edit className="h-3 w-3" />
                          <span>Edit Modal</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded bg-muted">
                          <FileText className="h-3 w-3" />
                          <span>/adr</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">React 18</Badge>
                        <Badge variant="outline" className="text-xs">TypeScript</Badge>
                        <Badge variant="outline" className="text-xs">shadcn/ui</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">HTTP/SSE</span>
                  <span className="text-xs text-muted-foreground">Port 5001</span>
                </div>
              </div>

              {/* Row 2: Backend */}
              <div className="flex justify-center">
                <Card className="border-2 border-green-500 w-full max-w-2xl">
                  <CardHeader className="py-3 bg-green-50 dark:bg-green-950/50">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-base">Backend (Flask)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4">
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-muted space-y-2">
                        <div className="font-medium text-sm">API Routes</div>
                        <div className="space-y-1 text-muted-foreground">
                          <div>/api/health</div>
                          <div>/api/database/orders</div>
                          <div>/api/invoices/upload-stream</div>
                          <div>/api/invoices/save-edited</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted space-y-2">
                        <div className="font-medium text-sm">Services</div>
                        <div className="space-y-1 text-muted-foreground">
                          <div>• Extraction Service</div>
                          <div>• Validation</div>
                          <div>• Transform (JSON→Excel)</div>
                          <div>• Error Handling</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted space-y-2">
                        <div className="font-medium text-sm">Database Layer</div>
                        <div className="space-y-1 text-muted-foreground">
                          <div>• Pandas DataFrame</div>
                          <div>• Excel Read/Write</div>
                          <div>• Caching</div>
                          <div>• JSON Sanitization</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">Python 3.12</Badge>
                      <Badge variant="outline" className="text-xs">Flask 3.x</Badge>
                      <Badge variant="outline" className="text-xs">Pandas</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center gap-16">
                <div className="flex flex-col items-center">
                  <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">API Calls</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Read/Write</span>
                </div>
              </div>

              {/* Row 3: External Services & Storage */}
              <div className="flex justify-center gap-6">
                <Card className="border-2 border-purple-500 flex-1 max-w-xs">
                  <CardHeader className="py-3 bg-purple-50 dark:bg-purple-950/50">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-base">LLM Providers</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded bg-muted">
                        <span className="text-sm">OpenAI GPT-4o</span>
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-muted">
                        <span className="text-sm">Google Gemini</span>
                        <Badge variant="secondary" className="text-xs">Fallback</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-500 flex-1 max-w-xs">
                  <CardHeader className="py-3 bg-orange-50 dark:bg-orange-950/50">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-base">Data Storage</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded bg-muted">
                        <span className="text-sm">Case Study Data.xlsx</span>
                        <Badge variant="outline" className="text-xs">Read Only</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-muted">
                        <span className="text-sm">Extracted_Orders.xlsx</span>
                        <Badge variant="default" className="text-xs">Read/Write</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Upload Flow */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Invoice Upload Flow</h3>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-950 text-sm">Upload Image</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                  <div className="p-2 rounded bg-green-100 dark:bg-green-950 text-sm">SSE Stream</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                  <div className="p-2 rounded bg-purple-100 dark:bg-purple-950 text-sm">GPT-4o Vision</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold">4</div>
                  <div className="p-2 rounded bg-yellow-100 dark:bg-yellow-950 text-sm">JSON Extract</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">5</div>
                  <div className="p-2 rounded bg-red-100 dark:bg-red-950 text-sm">Edit Modal</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">6</div>
                  <div className="p-2 rounded bg-orange-100 dark:bg-orange-950 text-sm">Save Excel</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm py-1 px-3">Next.js 14</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">React 18</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">TypeScript</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">Tailwind CSS</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">shadcn/ui</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">Flask 3.x</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">Python 3.12</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">Pandas</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">OpenAI GPT-4o</Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">Google Gemini</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Decision List */}
        <h2 className="text-2xl font-bold mb-4">Architecture Decisions</h2>
        <div className="space-y-4">
          {decisions.map((decision) => (
            <Card key={decision.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <decision.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="font-mono text-xs">{decision.id}</Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600">{decision.status}</Badge>
                    </div>
                    <CardTitle className="text-lg">{decision.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Context</h4>
                  <p className="text-sm">{decision.context}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Decision</h4>
                  <p className="text-sm font-medium">{decision.decision}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Consequences</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {decision.consequences.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Design Deep Dive Section */}
        <Separator className="my-12" />
        
        <h2 className="text-2xl font-bold mb-4">System Design Deep Dive</h2>
        <p className="text-muted-foreground mb-6">
          Core design patterns, data models, and engineering decisions that power the application.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Data Model Card */}
          <Card className="border-2 border-indigo-200 dark:border-indigo-900">
            <CardHeader className="bg-indigo-50 dark:bg-indigo-950/20 pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg">Data Model</CardTitle>
              </div>
              <CardDescription>Entity relationships and data flow</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-full p-3 rounded border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30">
                      <div className="text-sm font-bold text-center text-indigo-700 dark:text-indigo-300">SalesOrderHeader</div>
                      <div className="text-xs text-muted-foreground text-center mt-1">PK: SalesOrderID</div>
                      <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        <Badge variant="outline" className="text-xs">OrderDate</Badge>
                        <Badge variant="outline" className="text-xs">CustomerID</Badge>
                        <Badge variant="outline" className="text-xs">TotalDue</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-px h-4 bg-muted-foreground"></div>
                      <span className="text-xs text-muted-foreground">1:N</span>
                      <div className="w-px h-4 bg-muted-foreground"></div>
                    </div>
                    <div className="w-full p-3 rounded border-2 border-green-500 bg-green-50 dark:bg-green-950/30">
                      <div className="text-sm font-bold text-center text-green-700 dark:text-green-300">SalesOrderDetail</div>
                      <div className="text-xs text-muted-foreground text-center mt-1">PK: DetailID, FK: SalesOrderID</div>
                      <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        <Badge variant="outline" className="text-xs">ProductID</Badge>
                        <Badge variant="outline" className="text-xs">Qty</Badge>
                        <Badge variant="outline" className="text-xs">UnitPrice</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                    <span className="font-medium">Reference Data</span>
                    <div className="text-muted-foreground">Products, Customers (read-only)</div>
                  </div>
                  <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/30 border border-orange-200">
                    <span className="font-medium">Extracted Data</span>
                    <div className="text-muted-foreground">New orders (read/write)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Design Card */}
          <Card className="border-2 border-cyan-200 dark:border-cyan-900">
            <CardHeader className="bg-cyan-50 dark:bg-cyan-950/20 pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-cyan-600" />
                <CardTitle className="text-lg">API Design</CardTitle>
              </div>
              <CardDescription>RESTful patterns and conventions</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">ENDPOINTS</div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                    <Badge className="bg-green-600 text-xs">GET</Badge>
                    <span>/api/database/orders</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                    <Badge className="bg-blue-600 text-xs">POST</Badge>
                    <span>/api/invoices/upload-stream</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                    <Badge className="bg-blue-600 text-xs">POST</Badge>
                    <span>/api/invoices/save-edited</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">RESPONSE FORMAT</div>
                <div className="p-2 rounded bg-muted/50 font-mono text-xs">
                  <div className="text-green-600">{`{ "success": true,`}</div>
                  <div className="pl-2">{`"data": {...},`}</div>
                  <div className="pl-2">{`"meta": { "response_time_ms" } }`}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">ERROR HANDLING</div>
                <div className="p-2 rounded bg-red-50 dark:bg-red-950/30 font-mono text-xs border border-red-200">
                  <div className="text-red-600">{`{ "success": false,`}</div>
                  <div className="pl-2">{`"error": { "code", "message" } }`}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border-2 border-rose-200 dark:border-rose-900">
            <CardHeader className="bg-rose-50 dark:bg-rose-950/20 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-rose-600" />
                <CardTitle className="text-lg">Security</CardTitle>
              </div>
              <CardDescription>Current measures and future improvements</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-green-600">✓ IMPLEMENTED</div>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>API Keys</strong> via environment variables</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>File validation</strong> (type, size limits)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>CORS</strong> configured origins</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Input sanitization</strong> for DB writes</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">○ FUTURE</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• JWT authentication</div>
                  <div>• Rate limiting per API key</div>
                  <div>• Encryption at rest</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reliability Card */}
          <Card className="border-2 border-emerald-200 dark:border-emerald-900">
            <CardHeader className="bg-emerald-50 dark:bg-emerald-950/20 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg">Reliability</CardTitle>
              </div>
              <CardDescription>Fault tolerance and error recovery</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">LLM FAILOVER</div>
                <div className="flex items-center justify-center gap-2 p-3 rounded bg-muted/50">
                  <div className="p-2 rounded bg-purple-100 dark:bg-purple-900/30 border text-center">
                    <Brain className="h-4 w-4 text-purple-600 mx-auto" />
                    <div className="text-xs mt-1">GPT-4o</div>
                    <Badge variant="secondary" className="text-xs mt-1">Primary</Badge>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-red-500">fail?</span>
                  </div>
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/30 border text-center">
                    <Brain className="h-4 w-4 text-blue-600 mx-auto" />
                    <div className="text-xs mt-1">Gemini</div>
                    <Badge variant="outline" className="text-xs mt-1">Fallback</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">VALIDATION PIPELINE</div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="bg-yellow-50">Confidence</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="bg-green-50">Math Check</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="bg-blue-50">Review</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="bg-purple-50">Save</Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Graceful error messages for all failure modes
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  No data loss on extraction failure
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scaling Strategies Section */}
        <Separator className="my-12" />
        
        <h2 className="text-2xl font-bold mb-4">Scaling Strategies</h2>
        <p className="text-muted-foreground mb-6">
          How we would evolve the solution to handle higher volume, additional document types, and production-scale deployment.
        </p>

        {/* Current Limitations */}
        <Card className="mb-6 border-yellow-500/50">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20">
            <CardTitle className="text-lg">Current Architecture Limitations</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium mb-1">Database</div>
                <div className="text-muted-foreground">Excel files - no concurrent writes</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium mb-1">Processing</div>
                <div className="text-muted-foreground">Synchronous - blocks during extraction</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium mb-1">Backend</div>
                <div className="text-muted-foreground">Single Flask process</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium mb-1">Storage</div>
                <div className="text-muted-foreground">Local filesystem only</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Higher Volume */}
          <Card className="border-blue-500/50">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">1</div>
                <CardTitle className="text-lg">Higher Volume Handling</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Queue-based processing with worker pools for parallel extraction.</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Redis/RabbitMQ</strong> for job queuing</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Celery workers</strong> for parallel processing</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>WebSocket</strong> for real-time status updates</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Rate limiting</strong> per-user/API key</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Document Types */}
          <Card className="border-green-500/50">
            <CardHeader className="bg-green-50 dark:bg-green-950/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">2</div>
                <CardTitle className="text-lg">Additional Document Types</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                <div className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">✓ Currently Supported File Formats</div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">PNG</Badge>
                  <Badge variant="secondary" className="text-xs">JPG</Badge>
                  <Badge variant="secondary" className="text-xs">WEBP</Badge>
                  <Badge variant="secondary" className="text-xs">PDF</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Expand to new business document categories:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Purchase Orders</strong> - PO extraction schema</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Receipts</strong> - Point-of-sale format</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Contracts</strong> - Key clauses extraction</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Custom schemas</strong> - User-defined fields</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Database */}
          <Card className="border-purple-500/50">
            <CardHeader className="bg-purple-50 dark:bg-purple-950/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">3</div>
                <CardTitle className="text-lg">Production Database</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Migration from Excel to PostgreSQL for reliability.</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>PostgreSQL</strong> with SQLAlchemy ORM</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Alembic</strong> for schema migrations</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Connection pooling</strong> for concurrent access</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Full-text search</strong> for invoice lookup</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Deployment */}
          <Card className="border-orange-500/50">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center">4</div>
                <CardTitle className="text-lg">Cloud Deployment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Containerized deployment with Kubernetes orchestration.</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Docker</strong> containerized services</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Kubernetes</strong> for orchestration</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>S3/GCS</strong> for document storage</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Auto-scaling</strong> based on queue depth</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Architecture Diagram */}
        <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10">
            <CardTitle>Production-Scale Architecture</CardTitle>
            <CardDescription>How the system would evolve for enterprise deployment</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Load Balancer + CDN */}
              <div className="flex justify-center">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-950 text-center">
                    <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">CDN</div>
                    <div className="text-xs text-muted-foreground">CloudFront/Fastly</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-950 text-center">
                    <Layers className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Load Balancer</div>
                    <div className="text-xs text-muted-foreground">NGINX / ALB</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Kubernetes Cluster */}
              <div className="border-2 border-dashed border-green-500/50 rounded-lg p-4">
                <div className="text-center mb-4">
                  <Badge className="bg-green-500">Kubernetes Cluster</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950 text-center">
                    <Server className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <div className="text-xs font-medium">API Pods</div>
                    <div className="text-xs text-muted-foreground">x3 replicas</div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-950 text-center">
                    <Zap className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs font-medium">Worker Pods</div>
                    <div className="text-xs text-muted-foreground">x5 auto-scale</div>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-950 text-center">
                    <Database className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                    <div className="text-xs font-medium">Redis</div>
                    <div className="text-xs text-muted-foreground">Queue + Cache</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950 text-center">
                    <Layers className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs font-medium">Frontend</div>
                    <div className="text-xs text-muted-foreground">Next.js SSR</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-8">
                <ArrowDown className="h-6 w-6 text-muted-foreground" />
                <ArrowDown className="h-6 w-6 text-muted-foreground" />
                <ArrowDown className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* External Services */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-950 text-center">
                  <Brain className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">LLM APIs</div>
                  <div className="text-xs text-muted-foreground">GPT-4o / Gemini</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-950 text-center">
                  <Database className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">PostgreSQL</div>
                  <div className="text-xs text-muted-foreground">RDS / Cloud SQL</div>
                </div>
                <div className="p-4 rounded-lg bg-orange-100 dark:bg-orange-950 text-center">
                  <HardDrive className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">Object Storage</div>
                  <div className="text-xs text-muted-foreground">S3 / GCS</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Roadmap */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Implementation Roadmap</CardTitle>
            <CardDescription>Phased approach to production-scale deployment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Phase 1 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">1</div>
                  <div className="flex-1 w-0.5 bg-green-500/30 my-2"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Phase 1: Containerization</span>
                    <Badge variant="outline" className="text-xs">Week 1-2</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Dockerize the application without changing architecture.</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">Dockerfile</Badge>
                    <Badge variant="secondary" className="text-xs">Docker Compose</Badge>
                    <Badge variant="secondary" className="text-xs">CI/CD Pipeline</Badge>
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">2</div>
                  <div className="flex-1 w-0.5 bg-blue-500/30 my-2"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Phase 2: Database Migration</span>
                    <Badge variant="outline" className="text-xs">Week 3-4</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Replace Excel with PostgreSQL using SQLAlchemy ORM.</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">PostgreSQL</Badge>
                    <Badge variant="secondary" className="text-xs">SQLAlchemy</Badge>
                    <Badge variant="secondary" className="text-xs">Alembic</Badge>
                    <Badge variant="secondary" className="text-xs">Data Migration Script</Badge>
                  </div>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">3</div>
                  <div className="flex-1 w-0.5 bg-purple-500/30 my-2"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Phase 3: Async Processing</span>
                    <Badge variant="outline" className="text-xs">Week 5-6</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Add job queue for background extraction processing.</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">Redis</Badge>
                    <Badge variant="secondary" className="text-xs">Celery</Badge>
                    <Badge variant="secondary" className="text-xs">WebSocket</Badge>
                    <Badge variant="secondary" className="text-xs">Job Dashboard</Badge>
                  </div>
                </div>
              </div>

              {/* Phase 4 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">4</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Phase 4: Kubernetes Deployment</span>
                    <Badge variant="outline" className="text-xs">Week 7-8</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Deploy to Kubernetes with auto-scaling and monitoring.</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">Kubernetes</Badge>
                    <Badge variant="secondary" className="text-xs">Helm Charts</Badge>
                    <Badge variant="secondary" className="text-xs">Prometheus</Badge>
                    <Badge variant="secondary" className="text-xs">Grafana</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expected Improvements */}
        <Card>
          <CardHeader>
            <CardTitle>Expected Performance Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-green-600">100x</div>
                <div className="text-sm text-muted-foreground">Concurrent Users</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-blue-600">10x</div>
                <div className="text-sm text-muted-foreground">Processing Speed</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-purple-600">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-orange-600">∞</div>
                <div className="text-sm text-muted-foreground">Document Types</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="border-2 border-amber-200 dark:border-amber-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <HelpCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions about the architecture and approach</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Q1: 10,000 invoices */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Badge variant="outline" className="text-amber-600">Q1</Badge>
                How would you handle 10,000 invoices per day?
              </h4>
              <div className="pl-4 border-l-2 border-amber-200 space-y-3">
                <p className="text-muted-foreground">
                  The current synchronous architecture would be replaced with queue-based async processing:
                </p>
                
                {/* Architecture Diagram */}
                <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                  <div className="flex items-center justify-center gap-2 min-w-[600px]">
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 border">
                        <Upload className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-xs mt-1">Upload API</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border">
                        <Database className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="text-xs mt-1">Redis Queue</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-1">
                        <div className="p-2 rounded bg-green-100 dark:bg-green-900/30 border">
                          <Zap className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="p-2 rounded bg-green-100 dark:bg-green-900/30 border">
                          <Zap className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="p-2 rounded bg-green-100 dark:bg-green-900/30 border">
                          <Zap className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <span className="text-xs">Celery Workers (5+)</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 border">
                        <Brain className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-xs mt-1">LLM APIs</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 border">
                        <HardDrive className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="text-xs mt-1">PostgreSQL</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm"><strong>Queue-based:</strong> Redis + Celery for async processing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm"><strong>Auto-scaling:</strong> Kubernetes HPA based on queue depth</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm"><strong>Batch API:</strong> OpenAI batch endpoints for bulk processing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm"><strong>Capacity:</strong> ~100K invoices/day with 5 workers @ 3s each</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Q2: Error Rate */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Badge variant="outline" className="text-amber-600">Q2</Badge>
                What&apos;s your error rate and how do you handle false extractions?
              </h4>
              <div className="pl-4 border-l-2 border-amber-200 space-y-3">
                <p className="text-muted-foreground">
                  Multiple validation layers catch errors before data is committed:
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">Confidence Score</span>
                    </div>
                    <p className="text-xs text-muted-foreground">LLM returns 0.0-1.0 confidence. Low scores (&lt;0.7) flagged for review.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Math Validation</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Line items checked: qty × unit_price ≈ line_total (1% tolerance)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Edit Before Save</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Users review and correct fields before committing to database.</p>
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span>~95% accurate (no edits needed)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <span>~4% minor corrections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span>&lt;1% critical errors</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Q3: Why Excel */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Badge variant="outline" className="text-amber-600">Q3</Badge>
                Why Excel instead of a real database?
              </h4>
              <div className="pl-4 border-l-2 border-amber-200 space-y-3">
                <p className="text-muted-foreground">
                  Per case study requirements, but designed for easy migration:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-dashed">
                    <h5 className="font-medium text-sm mb-2">Current Design</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Separate files: reference (read) vs extracted (write)</li>
                      <li>• All operations through `Database` class abstraction</li>
                      <li>• Pandas DataFrames as internal data model</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                    <h5 className="font-medium text-sm mb-2 text-green-700 dark:text-green-400">Migration Path</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Replace pandas read/write with SQLAlchemy ORM</li>
                      <li>• Same `Database` class interface, different backend</li>
                      <li>• One-time data migration script from Excel</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
