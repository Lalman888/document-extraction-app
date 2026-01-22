"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Upload, FileImage, Loader2, CheckCircle, XCircle, Database, Sparkles, 
  Circle, Check, AlertCircle, Pencil, Save, X, RefreshCw, Eye
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

interface ExtractedData {
  header: {
    invoice_number: string;
    date: string;
    customer_id: string | null;
    company_name: string;
    bill_to: { name: string; address: string; city: string; state: string; zip: string };
    ship_to: { name: string; address: string; city: string; state: string; zip: string };
  };
  line_items: Array<{
    item_number: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    shipping: number;
    total: number;
  };
}

interface ExtractionResponse {
  success: boolean;
  data?: {
    extraction: { success: boolean; provider: string; confidence: number; data: ExtractedData };
    validation: { is_valid: boolean; issues: string[] };
    database: { saved: boolean; order_id: number | null };
  };
  error?: { code: string; message: string };
}

type Step = {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
  message?: string;
};

interface DbStats {
  orders: number;
  extracted_orders: number;
  reference_orders: number;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResponse | null>(null);
  const [saveToDb, setSaveToDb] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  
  // Modal states
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  
  const [stats, setStats] = useState<DbStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/database/stats`);
      const data = await res.json();
      if (data.success) {
        setStats({
          orders: data.data.orders,
          extracted_orders: data.data.extracted_orders || 0,
          reference_orders: data.data.reference_orders || data.data.orders
        });
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  const updateStep = (stepId: string, status: Step["status"], message?: string) => {
    setSteps(prev => {
      const existing = prev.find(s => s.id === stepId);
      if (existing) {
        return prev.map(s => s.id === stepId ? { ...s, status, message: message || s.message } : s);
      }
      const labels: Record<string, string> = {
        validate: "Validating file",
        upload: "Reading image",
        analyze: "Analyzing with AI",
        extract: "Validating data",
        save: "Saving to database"
      };
      return [...prev, { id: stepId, label: labels[stepId] || stepId, status, message }];
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith("image/") || droppedFile.type === "application/pdf")) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setResult(null);
      setSteps([]);
      setProcessingComplete(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setSteps([]);
      setProcessingComplete(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setResult(null);
    setSteps([]);
    setProcessingComplete(false);
    setShowProcessingModal(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("save", saveToDb.toString());

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/upload-stream`, {
        method: "POST",
        body: formData,
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "result") {
                if (data.success) {
                  setResult({ success: true, data: data.data });
                  setEditedData(JSON.parse(JSON.stringify(data.data.extraction.data)));
                  setProcessingComplete(true);
                  fetchStats();
                } else {
                  setResult({ success: false, error: data.error });
                }
              } else if (data.step) {
                updateStep(data.step, data.status, data.message);
              }
            } catch (e) {
              console.error("Failed to parse SSE:", e);
            }
          }
        }
      }
    } catch (error) {
      setResult({ success: false, error: { code: "ERR_NETWORK", message: "Failed to connect to server" } });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setSteps([]);
    setProcessingComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditField = (field: string, value: string | number) => {
    if (!editedData) return;
    const updated = { ...editedData };
    const keys = field.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: Record<string, any> = updated as Record<string, any>;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    
    if (field.includes('line_items')) {
      const idx = parseInt(keys[1]);
      const item = updated.line_items[idx];
      item.total = item.quantity * item.unit_price;
      updated.totals.subtotal = updated.line_items.reduce((sum, li) => sum + li.total, 0);
      updated.totals.tax_amount = updated.totals.subtotal * (updated.totals.tax_rate / 100);
      updated.totals.total = updated.totals.subtotal + updated.totals.tax_amount + updated.totals.shipping;
    }
    setEditedData(updated);
  };

  const handleSaveEdits = async () => {
    if (!editedData) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/save-edited`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: editedData }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(prev => prev ? {
          ...prev,
          data: { ...prev.data!, extraction: { ...prev.data!.extraction, data: editedData }, database: { saved: true, order_id: data.data.order_id } }
        } : null);
        setShowEditModal(false);
        setShowResultsModal(true);
        fetchStats();
      }
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const StepIcon = ({ status }: { status: Step["status"] }) => {
    switch (status) {
      case "complete": return <Check className="h-4 w-4 text-green-600" />;
      case "active": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground/40" />;
    }
  };

  const openViewResults = () => {
    setShowProcessingModal(false);
    setShowResultsModal(true);
  };

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
            <Button variant="ghost" size="sm" asChild><Link href="/invoices">Invoices</Link></Button>
            <Button size="sm"><Upload className="h-4 w-4 mr-2" />Upload</Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.extracted_orders}</p>
                    <p className="text-xs text-muted-foreground">Extracted Orders</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchStats}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Extract Invoice Data</h1>
          <p className="text-muted-foreground">Upload an invoice image and AI will extract the data</p>
        </div>

        {/* Upload */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={!file ? handleBrowseClick : undefined}
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${!file ? "cursor-pointer" : ""} ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}`}
            >
              {preview ? (
                <div className="space-y-4">
                  <img src={preview} alt="Invoice preview" className="max-h-64 mx-auto rounded-md border shadow-sm" />
                  <p className="text-sm text-muted-foreground">{file?.name}</p>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); resetForm(); }} className="text-destructive hover:text-destructive">Remove file</Button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"><Upload className="h-6 w-6 text-muted-foreground" /></div>
                  <p className="font-medium mb-1">Drag & drop your invoice here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supports PNG, JPG, WEBP, PDF</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="save-db" checked={saveToDb} onCheckedChange={(c) => setSaveToDb(c as boolean)} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="save-db" className="font-medium cursor-pointer">Save to database after extraction</Label>
                <p className="text-xs text-muted-foreground">Saves to <code className="bg-muted px-1 rounded">Extracted_Orders.xlsx</code></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Button */}
        <Button onClick={handleUpload} disabled={!file || isLoading} className="w-full h-12 mb-6" size="lg">
          {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : <><Sparkles className="h-4 w-4 mr-2" />Extract Invoice Data</>}
        </Button>

        {/* View Results (on main page after processing) */}
        {processingComplete && result?.success && (
          <div className="text-center">
            <Button variant="outline" size="lg" onClick={openViewResults}>
              <Eye className="h-4 w-4 mr-2" />View Extracted Data
            </Button>
          </div>
        )}
      </main>

      {/* Processing Modal */}
      <Dialog open={showProcessingModal} onOpenChange={setShowProcessingModal}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{processingComplete ? "Processing Complete" : "Processing Invoice"}</DialogTitle>
            <DialogDescription>{processingComplete ? "All steps completed successfully" : "Extracting data from your invoice..."}</DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${step.status === "complete" ? "border-green-600 bg-green-50 dark:bg-green-950" : ""} ${step.status === "active" ? "border-primary bg-primary/10" : ""} ${step.status === "error" ? "border-destructive bg-destructive/10" : ""} ${step.status === "pending" ? "border-muted-foreground/30" : ""}`}>
                  <StepIcon status={step.status} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <span className={`text-sm font-medium block ${step.status === "active" ? "text-foreground" : step.status === "complete" ? "text-foreground" : step.status === "error" ? "text-destructive" : "text-muted-foreground/60"}`}>{step.label}</span>
                  {step.message && <span className="text-xs text-muted-foreground block">{step.message}</span>}
                </div>
              </div>
            ))}
          </div>

          {processingComplete && result?.success && (
            <DialogFooter>
              <Button onClick={openViewResults} size="lg">
                <Eye className="h-4 w-4 mr-2" />View Extracted Data
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Extraction Results</DialogTitle>
            <DialogDescription>AI-extracted data from your invoice</DialogDescription>
          </DialogHeader>
          
          {result?.success && result.data && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={result.data.extraction.confidence >= 0.9 ? "default" : "secondary"}>{(result.data.extraction.confidence * 100).toFixed(0)}% Confidence</Badge>
                <Badge variant="outline">{result.data.extraction.provider.toUpperCase()}</Badge>
                {result.data.database.saved && <Badge variant="outline" className="text-green-600 border-green-600"><Database className="h-3 w-3 mr-1" />Order #{result.data.database.order_id}</Badge>}
              </div>

              <Progress value={result.data.extraction.confidence * 100} />
              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Invoice Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground block text-xs">Invoice #</span><span className="font-medium">{result.data.extraction.data.header.invoice_number}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Date</span><span className="font-medium">{result.data.extraction.data.header.date}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Customer</span><span className="font-medium">{result.data.extraction.data.header.customer_id || "—"}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Company</span><span className="font-medium">{result.data.extraction.data.header.company_name}</span></div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Line Items</h4>
                <div className="rounded-md border text-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.data.extraction.data.line_items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{item.item_number}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${result.data.extraction.data.totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax ({result.data.extraction.data.totals.tax_rate}%)</span><span>${result.data.extraction.data.totals.tax_amount.toFixed(2)}</span></div>
                {result.data.extraction.data.totals.shipping > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${result.data.extraction.data.totals.shipping.toFixed(2)}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>${result.data.extraction.data.totals.total.toFixed(2)}</span></div>
              </div>

              {result.data.validation.is_valid ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 rounded-md p-3 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-4 w-4" /><span className="text-sm font-medium">All validation checks passed</span>
                </div>
              ) : (
                <div className="bg-destructive/10 rounded-md p-3 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive mb-2"><XCircle className="h-4 w-4" /><span className="text-sm font-medium">Validation Issues</span></div>
                  <ul className="text-sm text-destructive/80 list-disc list-inside">
                    {result.data.validation.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowResultsModal(false); setShowEditModal(true); }}><Pencil className="h-4 w-4 mr-2" />Edit Data</Button>
            {!result?.data?.database.saved && <Button onClick={handleSaveEdits} disabled={isLoading}><Save className="h-4 w-4 mr-2" />Save to Database</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Extracted Data</DialogTitle>
            <DialogDescription>Modify the extracted data before saving</DialogDescription>
          </DialogHeader>
          
          {editedData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><Label className="text-xs">Invoice #</Label><Input value={editedData.header.invoice_number} onChange={(e) => handleEditField('header.invoice_number', e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Date</Label><Input type="date" value={editedData.header.date} onChange={(e) => handleEditField('header.date', e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Customer ID</Label><Input value={editedData.header.customer_id || ''} onChange={(e) => handleEditField('header.customer_id', e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Company</Label><Input value={editedData.header.company_name} onChange={(e) => handleEditField('header.company_name', e.target.value)} className="mt-1" /></div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Line Items <span className="text-xs text-muted-foreground">(edit qty/price to recalculate)</span></h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Item #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="w-28">Price</TableHead>
                        <TableHead className="w-28 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editedData.line_items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell><Input value={item.item_number} onChange={(e) => handleEditField(`line_items.${i}.item_number`, e.target.value)} className="h-8" /></TableCell>
                          <TableCell><Input value={item.description} onChange={(e) => handleEditField(`line_items.${i}.description`, e.target.value)} className="h-8" /></TableCell>
                          <TableCell><Input type="number" value={item.quantity} onChange={(e) => handleEditField(`line_items.${i}.quantity`, parseInt(e.target.value) || 0)} className="h-8" /></TableCell>
                          <TableCell><Input type="number" step="0.01" value={item.unit_price} onChange={(e) => handleEditField(`line_items.${i}.unit_price`, parseFloat(e.target.value) || 0)} className="h-8" /></TableCell>
                          <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">${editedData.totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Tax ({editedData.totals.tax_rate}%)</span><span className="font-medium">${editedData.totals.tax_amount.toFixed(2)}</span></div>
                {editedData.totals.shipping > 0 && <div className="flex justify-between text-sm"><span>Shipping</span><span className="font-medium">${editedData.totals.shipping.toFixed(2)}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${editedData.totals.total.toFixed(2)}</span></div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); setShowResultsModal(true); }}><X className="h-4 w-4 mr-2" />Cancel</Button>
            <Button onClick={handleSaveEdits} disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save to Database</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
