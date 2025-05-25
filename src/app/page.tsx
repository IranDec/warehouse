
// src/app/page.tsx (Dashboard)
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign, Package, AlertTriangle, CheckCircle, Activity, Users, TrendingUp, TrendingDown, FileText, ListOrdered, Settings, ShoppingCart, Component } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MOCK_PRODUCTS, MOCK_INVENTORY_TRANSACTIONS, MOCK_BOM_CONFIGURATIONS } from "@/lib/constants";
import type { Product, BillOfMaterial } from "@/lib/types";
import React, { useEffect, useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";


const StatCard = ({ title, value, icon, description, trend, isLoading }: { title: string, value: string | number, icon: React.ElementType, description?: string, trend?: 'up' | 'down' | 'neutral', isLoading?: boolean }) => {
  const Icon = icon;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-4 w-4 animate-pulse bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold h-8 animate-pulse bg-muted rounded w-1/2 mb-1"></div>
          <div className="text-xs text-muted-foreground h-4 animate-pulse bg-muted rounded w-3/4"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground flex items-center">
             {description}
             {trend && trend !== 'neutral' && <TrendIcon className={`ml-1 h-4 w-4 ${trendColor}`} />}
          </p>
        )}
      </CardContent>
    </Card>
  );
};


export default function DashboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: "$0.00"
  });
  const [selectedFinishedGood, setSelectedFinishedGood] = useState<string>("");

  const finishedGoods = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => p.category === 'Finished Goods');
  }, []);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      const totalProducts = MOCK_PRODUCTS.length;
      const lowStockItems = MOCK_PRODUCTS.filter(p => p.status === 'Low Stock').length;
      const outOfStockItems = MOCK_PRODUCTS.filter(p => p.status === 'Out of Stock').length;
      // Mock total value calculation
      const totalValue = MOCK_PRODUCTS.reduce((sum, p) => sum + (p.quantity * (Math.random() * 100 + 10)), 0); // Random price for demo

      setStats({
        totalProducts,
        lowStockItems,
        outOfStockItems,
        totalValue: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      });
      setLoading(false);
    }, 1000); // Simulate 1 second loading time
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
        duration: 9000, // Longer duration for preformatted text
      });
    } else {
      toast({
        title: "No BOM",
        description: `No Bill of Materials defined for ${product.name}. Raw materials would not be automatically deducted.`,
        variant: "default",
      });
    }
  };


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader 
        title="Welcome to Warehouse Edge!"
        description="Your central hub for managing warehouse operations efficiently."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} description="Across all categories" isLoading={loading} trend="up" />
        <StatCard title="Low Stock Items" value={stats.lowStockItems} icon={AlertTriangle} description="Needs reordering soon" isLoading={loading} trend={stats.lowStockItems > 5 ? "down" : "neutral"} />
        <StatCard title="Out of Stock Items" value={stats.outOfStockItems} icon={AlertTriangle} description="Currently unavailable" isLoading={loading} trend={stats.outOfStockItems > 0 ? "down" : "neutral"} />
        <StatCard title="Estimated Inventory Value" value={stats.totalValue} icon={DollarSign} description="Based on current stock" isLoading={loading} trend="up" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Perform common tasks directly from here.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline">
              <Link href="/products"><Package className="mr-2 h-4 w-4" /> View Products</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/inventory"><ListOrdered className="mr-2 h-4 w-4" /> Check Ledger</Link>
            </Button>
            <Button asChild variant="outline" className="col-span-2 sm:col-span-1">
              <Link href="/products#import"><FileText className="mr-2 h-4 w-4" /> Import Products</Link>
            </Button>
             <Button asChild variant="outline" className="col-span-2 sm:col-span-1">
              <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> System Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
             <CardDescription>Overview of system health and integrations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Connection</span>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Connected (Simulated)
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">CMS Sync (WooCommerce)</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" /> Not Configured
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Notification Service</span>
               <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Active (Simulated)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><Component className="mr-2 h-5 w-5 text-primary" /> Simulate CMS Operations</CardTitle>
            <CardDescription>Test Bill of Materials (BOM) based deduction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="finished-good-select">Select Finished Good</Label>
              <Select value={selectedFinishedGood} onValueChange={setSelectedFinishedGood}>
                <SelectTrigger id="finished-good-select">
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {finishedGoods.map(fg => (
                    <SelectItem key={fg.id} value={fg.id}>{fg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSimulateSale} className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" /> Simulate Sale & BOM Deduction
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm" data-ai-hint="office workspace">
        <CardHeader>
          <CardTitle>Recent Activity (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          <Image src="https://placehold.co/600x200.png" alt="Activity chart placeholder" width={600} height={200} className="rounded-md" />
        </CardContent>
      </Card>

    </div>
  );
}
