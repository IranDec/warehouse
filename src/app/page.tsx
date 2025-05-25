
// src/app/page.tsx (Dashboard)
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Package, AlertTriangle, Activity, TrendingUp, TrendingDown, ListOrdered, Settings, ShoppingCart, Component,
  ClipboardList, BarChart3, ArrowRight, PackageSearch, ClockHistory, CheckCircle2, XCircle, Hourglass
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_INVENTORY_TRANSACTIONS, MOCK_BOM_CONFIGURATIONS, MOCK_MATERIAL_REQUESTS } from "@/lib/constants";
import type { Product, BillOfMaterial, InventoryTransaction, MaterialRequest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { addDays, subDays, isWithinInterval, parseISO } from 'date-fns';
import { ClientSideFormattedDate } from '@/components/common/client-side-formatted-date';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  linkTo?: string;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, trend, isLoading, linkTo, colorClass }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <div className="text-2xl font-bold h-8 animate-pulse bg-muted rounded w-1/2 mb-1"></div>
            <div className="text-xs text-muted-foreground h-4 animate-pulse bg-muted rounded w-3/4"></div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground flex items-center">
                {description}
                {trend && trend !== 'neutral' && <TrendIcon className={`ml-1 h-4 w-4 ${trendColor}`} />}
              </p>
            )}
          </>
        )}
      </CardContent>
    </>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="block hover:opacity-90 transition-opacity">
        <Card className={cn("shadow-sm hover:shadow-md transition-shadow duration-200 h-full", colorClass)}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cn("shadow-sm hover:shadow-md transition-shadow duration-200 h-full", colorClass)}>
      {cardContent}
    </Card>
  );
};


export default function DashboardPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockAlerts: 0,
    pendingMaterialRequests: 0,
    recentTransactionsCount: 0,
  });

  const [selectedFinishedGood, setSelectedFinishedGood] = useState<string>("");
  const [recentInventory, setRecentInventory] = useState<InventoryTransaction[]>([]);
  const [recentRequests, setRecentRequests] = useState<MaterialRequest[]>([]);
  const [itemsToReorder, setItemsToReorder] = useState<Product[]>([]);

  const finishedGoods = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => p.category === 'Finished Goods');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const products = MOCK_PRODUCTS;
      const inventoryTransactions = MOCK_INVENTORY_TRANSACTIONS;
      const materialRequests = MOCK_MATERIAL_REQUESTS;

      const lowStockProducts = products.filter(p => p.quantity <= p.reorderLevel || p.status === 'Low Stock' || p.status === 'Out of Stock');
      const pendingRequests = materialRequests.filter(r => r.status === 'Pending');
      
      const sevenDaysAgo = subDays(new Date(), 7);
      const recentTrans = inventoryTransactions.filter(t => {
        try {
          return parseISO(t.date) >= sevenDaysAgo;
        } catch { return false; }
      });

      setStats({
        totalProducts: products.length,
        lowStockAlerts: lowStockProducts.length,
        pendingMaterialRequests: pendingRequests.length,
        recentTransactionsCount: recentTrans.length,
      });

      setRecentInventory(inventoryTransactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).slice(0, 5));
      setRecentRequests(materialRequests.sort((a, b) => parseISO(b.submissionDate).getTime() - parseISO(a.submissionDate).getTime()).slice(0, 5));
      setItemsToReorder(lowStockProducts.sort((a,b) => (a.quantity - a.reorderLevel) - (b.quantity - b.reorderLevel)).slice(0,3));

      setLoading(false);
    }, 500); 
    return () => clearTimeout(timer);
  }, []);

  const handleSimulateSale = () => {
    if (!selectedFinishedGood) {
      toast({
        title: "No Product Selected",
        description: "Please select a finished good to simulate a sale.",
        variant: "destructive",
      });
      return;
    }

    const product = MOCK_PRODUCTS.find(p => p.id === selectedFinishedGood);
    if (!product) return;

    const bom = MOCK_BOM_CONFIGURATIONS.find(b => b.productId === selectedFinishedGood);

    if (bom && bom.items.length > 0) {
      let deductionMessage = `Simulated sale of ${product.name}. The following raw materials would be deducted:\n`;
      bom.items.forEach(item => {
        const rawMaterial = MOCK_PRODUCTS.find(p => p.id === item.rawMaterialId);
        deductionMessage += `- ${item.quantityNeeded} x ${rawMaterial ? rawMaterial.name : item.rawMaterialId}\n`;
      });
      console.log("BOM Deduction Simulation:", deductionMessage);
      toast({
        title: "CMS Sale Simulated",
        description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">{deductionMessage}</code>
            </pre>
          ),
        duration: 9000,
      });
    } else {
      toast({
        title: "No BOM",
        description: `No Bill of Materials defined for ${product.name}. Raw materials would not be automatically deducted.`,
        variant: "default",
      });
    }
  };

  const getStatusBadgeVariant = (status: MaterialRequest['status']) => {
    switch(status) {
        case "Pending": return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50";
        case "Approved": return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50";
        case "Completed": return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50";
        case "Rejected": return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50";
        case "Cancelled": return "bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/50";
        default: return "bg-secondary text-secondary-foreground border-transparent";
    }
  };
  const getStatusIcon = (status: MaterialRequest['status']) => {
    switch(status) {
        case "Pending": return <Hourglass className="h-3 w-3 text-yellow-600" />;
        case "Approved": return <CheckCircle2 className="h-3 w-3 text-green-600" />;
        case "Completed": return <PackageSearch className="h-3 w-3 text-blue-600" />;
        case "Rejected": return <XCircle className="h-3 w-3 text-red-600" />;
        case "Cancelled": return <Activity className="h-3 w-3 text-slate-600" />; // Using Activity as a placeholder
        default: return null;
    }
  };


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader 
        title={`Welcome, ${currentUser?.name || 'User'}!`}
        description="Your central hub for managing warehouse operations efficiently."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Total Products" 
            value={stats.totalProducts} 
            icon={Package} 
            description="Managed in system" 
            isLoading={loading} 
            linkTo="/products"
            colorClass="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
        />
        <StatCard 
            title="Low Stock Alerts" 
            value={stats.lowStockAlerts} 
            icon={AlertTriangle} 
            description="Items needing reorder" 
            isLoading={loading} 
            linkTo="/reports" // Link to general reports, user can find low stock there
            colorClass="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700"
        />
        <StatCard 
            title="Pending Requests" 
            value={stats.pendingMaterialRequests} 
            icon={ClipboardList} 
            description="Awaiting approval" 
            isLoading={loading} 
            linkTo="/material-requests?status=Pending"
            colorClass="bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700"
        />
        <StatCard 
            title="Recent Movements" 
            value={stats.recentTransactionsCount} 
            icon={ListOrdered} 
            description="Transactions (last 7 days)" 
            isLoading={loading} 
            linkTo="/inventory"
            colorClass="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm md:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Navigate to key sections.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/products"><Package className="mr-2" /> View Products</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/inventory"><ListOrdered className="mr-2" /> Inventory Ledger</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/material-requests"><ClipboardList className="mr-2" /> Material Requests</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/reports"><BarChart3 className="mr-2" /> View Reports</Link>
            </Button>
             {(currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager') && (
                <Button asChild variant="outline" className="w-full justify-start col-span-full sm:col-span-1">
                 <Link href="/settings"><Settings className="mr-2" /> System Settings</Link>
                </Button>
             )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><ClockHistory className="mr-2 h-5 w-5 text-primary" /> Recent Stock Movements</CardTitle>
            <CardDescription>Last 5 inventory transactions. <Link href="/inventory" className="text-primary hover:underline text-xs">View All</Link></CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading recent movements...</p>
            ) : recentInventory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty Change</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInventory.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium py-1.5">{tx.productName}</TableCell>
                        <TableCell className="py-1.5">{tx.type}</TableCell>
                        <TableCell className={cn("text-right py-1.5", tx.quantityChange > 0 ? "text-green-600" : "text-red-600")}>
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </TableCell>
                        <TableCell className="text-right py-1.5">
                          <ClientSideFormattedDate dateString={tx.date} formatString="MMM d" fallback="-" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No recent inventory movements.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center"><Component className="mr-2 h-5 w-5 text-primary" /> Simulate CMS Operations</CardTitle>
            <CardDescription>Test Bill of Materials (BOM) based deduction for finished goods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="finished-good-select">Select Finished Good</Label>
              <Select value={selectedFinishedGood} onValueChange={setSelectedFinishedGood}>
                <SelectTrigger id="finished-good-select">
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {finishedGoods.length === 0 && <SelectItem value="none" disabled>No finished goods available</SelectItem>}
                  {finishedGoods.map(fg => (
                    <SelectItem key={fg.id} value={fg.id}>{fg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSimulateSale} className="w-full" disabled={!selectedFinishedGood || finishedGoods.length === 0}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Simulate Sale & BOM Deduction
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" /> Items to Reorder</CardTitle>
            <CardDescription>Top 3 products at or below reorder level. <Link href="/reports" className="text-primary hover:underline text-xs">View Full Report</Link></CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
              <p className="text-muted-foreground text-sm">Loading reorder alerts...</p>
            ) : itemsToReorder.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Current Qty</TableHead>
                      <TableHead className="text-right">Reorder Lvl</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsToReorder.map(prod => (
                      <TableRow key={prod.id}>
                        <TableCell className="font-medium py-1.5">{prod.name}</TableCell>
                        <TableCell className="text-right py-1.5 text-red-600 font-semibold">{prod.quantity}</TableCell>
                        <TableCell className="text-right py-1.5">{prod.reorderLevel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No items currently need reordering.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary" /> Recent Material Requests</CardTitle>
            <CardDescription>Last 5 material requests submitted. <Link href="/material-requests" className="text-primary hover:underline text-xs">View All Requests</Link></CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <p className="text-muted-foreground text-sm">Loading recent requests...</p>
            ) : recentRequests.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table className="text-xs">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request ID</TableHead>
                                <TableHead>Requester</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Submitted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-mono py-1.5">{req.id}</TableCell>
                                    <TableCell className="py-1.5">{req.requesterName}</TableCell>
                                    <TableCell className="py-1.5 truncate max-w-[150px]" title={req.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}>
                                        {req.items.map(i => i.productName).join(', ').substring(0,30)}...
                                    </TableCell>
                                    <TableCell className="py-1.5">
                                        <Badge variant="outline" className={cn("font-medium text-xs px-1.5 py-0.5", getStatusBadgeVariant(req.status))}>
                                           <span className="mr-1">{getStatusIcon(req.status)}</span> {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right py-1.5">
                                        <ClientSideFormattedDate dateString={req.submissionDate} formatString="MMM d" fallback="-" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <p className="text-muted-foreground text-sm">No material requests found.</p>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
