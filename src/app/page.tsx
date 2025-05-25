// src/app/page.tsx (Dashboard)
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, AlertTriangle, CheckCircle, Activity, Users, TrendingUp, TrendingDown, FileText, ListOrdered, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MOCK_PRODUCTS, MOCK_INVENTORY_TRANSACTIONS } from "@/lib/constants";
import { Product } from "@/lib/types";
import React, { useEffect, useState } from 'react';


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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: "$0.00"
  });

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
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

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
             <CardDescription>Overview of system health and integrations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Connection</span>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Connected
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
                <CheckCircle className="h-4 w-4" /> Active
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for a chart or recent activity feed */}
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
