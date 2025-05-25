
// src/app/reports/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DateRangePicker } from "@/components/common/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_INVENTORY_TRANSACTIONS } from '@/lib/constants';
import type { InventoryTransaction } from '@/lib/types';
import { BarChart3, PackageX, Undo2, PackagePlus, PackageMinus, AlertCircle } from "lucide-react";
import type { DateRange } from 'react-day-picker';
import { addDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface ReportStat {
  totalQuantity: number;
  transactionCount: number;
  distinctProducts: number;
}

const StatCard = ({ title, value, description, icon: Icon, unit = "items" }: { title: string, value: ReportStat, description: string, icon: React.ElementType, unit?: string }) => {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.totalQuantity} <span className="text-lg font-normal text-muted-foreground">{unit}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {description} ({value.transactionCount} transactions, {value.distinctProducts} products)
        </p>
      </CardContent>
    </Card>
  );
};


export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return {
      from: startOfMonth(today),
      to: endOfMonth(today),
    };
  });

  const reportData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return {
        damaged: { totalQuantity: 0, transactionCount: 0, distinctProducts: 0 },
        returned: { totalQuantity: 0, transactionCount: 0, distinctProducts: 0 },
        inflow: { totalQuantity: 0, transactionCount: 0, distinctProducts: 0 },
        outflow: { totalQuantity: 0, transactionCount: 0, distinctProducts: 0 },
      };
    }

    const filteredTransactions = MOCK_INVENTORY_TRANSACTIONS.filter(t => {
      const transactionDate = new Date(t.date);
      return isWithinInterval(transactionDate, { start: dateRange.from as Date, end: dateRange.to as Date });
    });

    const calculateStats = (types: InventoryTransaction['type'][]): ReportStat => {
      const relevantTransactions = filteredTransactions.filter(t => types.includes(t.type));
      const totalQuantity = relevantTransactions.reduce((sum, t) => sum + Math.abs(t.quantityChange), 0);
      const distinctProductIds = new Set(relevantTransactions.map(t => t.productId));
      return {
        totalQuantity,
        transactionCount: relevantTransactions.length,
        distinctProducts: distinctProductIds.size,
      };
    };
    
    const damagedStats = calculateStats(['Damage']);
    const returnedStats = calculateStats(['Return']);
    const inflowStats = calculateStats(['Inflow', 'Initial']);
    const outflowStats = calculateStats(['Outflow']);


    return {
      damaged: damagedStats,
      returned: returnedStats,
      inflow: inflowStats,
      outflow: outflowStats,
    };
  }, [dateRange]);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Inventory Reports"
        icon={BarChart3}
        description="Analyze inventory movements and trends within specific periods."
        actions={
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        }
      />

      {(!dateRange?.from || !dateRange?.to) && (
        <div className="flex items-center p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
          <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
          <span className="font-medium">Please select a date range to view reports.</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Damaged" 
          value={reportData.damaged} 
          description="Items marked as damaged" 
          icon={PackageX} 
        />
        <StatCard 
          title="Total Returned" 
          value={reportData.returned} 
          description="Items returned to inventory" 
          icon={Undo2} 
        />
        <StatCard 
          title="Total Stock Inflow" 
          value={reportData.inflow} 
          description="New items & initial stock" 
          icon={PackagePlus} 
        />
        <StatCard 
          title="Total Stock Outflow" 
          value={reportData.outflow} 
          description="Items used or sold" 
          icon={PackageMinus} 
        />
      </div>

      {/* Placeholder for more detailed tables or charts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>
            Further detailed reports (e.g., by product, category, warehouse) will be available here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          <p>Detailed report tables and charts coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
