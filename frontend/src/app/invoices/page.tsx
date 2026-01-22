"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileImage, Upload, ChevronLeft, ChevronRight, Loader2, Database, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

interface Order {
  SalesOrderID: number;
  SalesOrderNumber: string;
  OrderDate: string;
  CustomerID: number;
  SubTotal: number;
  TaxAmt: number;
  Freight: number;
  TotalDue: number;
  Status: number;
}

interface OrderDetail {
  SalesOrderDetailID: number;
  SalesOrderID: number;
  ProductID: number | null;
  ProductNumber: string | null;
  ProductName: string | null;
  OrderQty: number;
  UnitPrice: number;
  LineTotal: number;
  _description?: string;
  _item_number?: number;
}

interface OrdersResponse {
  success: boolean;
  data?: {
    items: Order[];
  };
  meta?: {
    pagination: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

interface Stats {
  orders: number;
  order_details: number;
}

export default function InvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<OrdersResponse["meta"]>();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, OrderDetail[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [page]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/database/orders?page=${page}&per_page=15`);
      const data: OrdersResponse = await res.json();
      
      if (data.success && data.data) {
        setOrders(data.data.items);
        setPagination(data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/database/stats?extracted_only=true`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    if (orderDetails[orderId]) {
      // Already loaded
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }

    setLoadingDetails(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/database/details?order_id=${orderId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrderDetails(prev => ({ ...prev, [orderId]: data.data.items }));
        setExpandedOrder(orderId);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setLoadingDetails(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <FileImage className="h-5 w-5" />
            Invoice Extractor
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/adr">ADR</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/invoices">Invoices</Link>
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sales Orders</h1>
            <p className="text-muted-foreground">View extracted invoice data in SalesOrderHeader & SalesOrderDetail format</p>
          </div>
          <Button asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Invoice
            </Link>
          </Button>
        </div>

        {/* Stats Cards - Extracted Orders Only */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.orders.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Extracted Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-500/10">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.order_details.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Line Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Table - SalesOrderHeader */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>SalesOrderHeader</CardTitle>
            <CardDescription>
              Page {pagination?.pagination.page || 1} of {pagination?.pagination.total_pages.toLocaleString() || "..."} ({pagination?.pagination.total.toLocaleString() || "..."} total)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>SalesOrderNumber</TableHead>
                    <TableHead>OrderDate</TableHead>
                    <TableHead>CustomerID</TableHead>
                    <TableHead className="text-right">SubTotal</TableHead>
                    <TableHead className="text-right">TaxAmt</TableHead>
                    <TableHead className="text-right">TotalDue</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading orders...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No orders found. Upload an invoice to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <React.Fragment key={order.SalesOrderID}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => fetchOrderDetails(order.SalesOrderID)}
                        >
                          <TableCell>
                            {loadingDetails === order.SalesOrderID ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : expandedOrder === order.SalesOrderID ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.SalesOrderNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(order.OrderDate)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {order.CustomerID || "—"}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(order.SubTotal)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(order.TaxAmt)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.TotalDue)}
                          </TableCell>
                          <TableCell className="text-center">
                            {order.Status === 5 ? (
                              <Badge variant="default">Complete</Badge>
                            ) : order.Status === 1 ? (
                              <Badge variant="secondary">New</Badge>
                            ) : (
                              <Badge variant="outline">Status {order.Status}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded SalesOrderDetail Row */}
                        {expandedOrder === order.SalesOrderID && orderDetails[order.SalesOrderID] && (
                          <TableRow key={`${order.SalesOrderID}-details`}>
                            <TableCell colSpan={8} className="bg-muted/30 p-0">
                              <div className="p-4">
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  SalesOrderDetail ({orderDetails[order.SalesOrderID].length} items)
                                </h4>
                                <div className="border rounded-md bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>DetailID</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">OrderQty</TableHead>
                                        <TableHead className="text-right">UnitPrice</TableHead>
                                        <TableHead className="text-right">LineTotal</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {orderDetails[order.SalesOrderID].map((detail) => (
                                        <TableRow key={detail.SalesOrderDetailID}>
                                          <TableCell className="font-mono text-sm">
                                            {detail.SalesOrderDetailID}
                                          </TableCell>
                                          <TableCell>
                                            {detail._description || detail.ProductName || `Product ${detail.ProductID}`}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {detail.OrderQty}
                                          </TableCell>
                                          <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(detail.UnitPrice)}
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            {formatCurrency(detail.LineTotal)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.pagination.page} of {pagination.pagination.total_pages.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.pagination.has_prev}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.pagination.has_next}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
