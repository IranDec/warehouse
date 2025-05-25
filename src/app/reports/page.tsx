
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
import { DataTable } from "@/components/common/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface ReportStat {
  totalQuantity: number;
  transactionCount: number;
  distinctProducts: number;
}

interface ProductReportItem {
  productId: string;
  productName: string;
  totalInflow: number;
  totalOutflow: number;
  totalDamaged: number;
  totalReturned: number;
  netChange: number;
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

  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return [];
    }
    return MOCK_INVENTORY_TRANSACTIONS.filter(t => {
      const transactionDate = new Date(t.date);
      return isWithinInterval(transactionDate, { start: dateRange.from as Date, end: dateRange.to as Date });
    });
  }, [dateRange]);

  const overallStats = useMemo(() => {
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
    
    return {
      damaged: calculateStats(['Damage']),
      returned: calculateStats(['Return']),
      inflow: calculateStats(['Inflow', 'Initial']),
      outflow: calculateStats(['Outflow']),
    };
  }, [filteredTransactions]);

  const productBreakdown = useMemo((): ProductReportItem[] => {
    const statsMap: Record<string, ProductReportItem> = {};

    filteredTransactions.forEach(transaction => {
      if (!statsMap[transaction.productId]) {
        statsMap[transaction.productId] = {
          productId: transaction.productId,
          productName: transaction.productName,
          totalInflow: 0,
          totalOutflow: 0,
          totalDamaged: 0,
          totalReturned: 0,
          netChange: 0,
        };
      }
      const productStat = statsMap[transaction.productId];
      productStat.netChange += transaction.quantityChange;

      switch (transaction.type) {
        case 'Inflow':
        case 'Initial':
          productStat.totalInflow += transaction.quantityChange;
          break;
        case 'Outflow':
          productStat.totalOutflow += Math.abs(transaction.quantityChange);
          break;
        case 'Damage':
          productStat.totalDamaged += Math.abs(transaction.quantityChange);
          break;
        case 'Return':
          productStat.totalReturned += transaction.quantityChange;
          break;
      }
    });
    return Object.values(statsMap);
  }, [filteredTransactions]);

  const productReportColumns: ColumnDef<ProductReportItem>[] = [
    { 
      accessorKey: "productName", 
      header: "Product Name",
      cell: ({ row }) => <div className="font-medium">{row.original.productName}</div>
    },
    { 
      accessorKey: "totalInflow", 
      header: "Total Inflow",
      cell: ({ row }) => <span className="text-green-600">+{row.original.totalInflow}</span>
    },
    { 
      accessorKey: "totalOutflow", 
      header: "Total Outflow",
      cell: ({ row }) => <span className="text-red-600">-{row.original.totalOutflow}</span>
    },
    { 
      accessorKey: "totalDamaged", 
      header: "Damaged",
      cell: ({ row }) => <span className="text-orange-600">{row.original.totalDamaged}</span>
    },
    { 
      accessorKey: "totalReturned", 
      header: "Returned",
      cell: ({ row }) => <span className="text-blue-600">{row.original.totalReturned}</span>
    },
    { 
      accessorKey: "netChange", 
      header: "Net Change",
      cell: ({ row }) => {
        const netChange = row.original.netChange;
        const colorClass = netChange > 0 ? 'text-green-600' : netChange < 0 ? 'text-red-600' : 'text-muted-foreground';
        return <span className={`${colorClass} font-semibold`}>{netChange > 0 ? `+${netChange}` : netChange}</span>;
      }
    },
  ];

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
          value={overallStats.damaged} 
          description="Items marked as damaged" 
          icon={PackageX} 
        />
        <StatCard 
          title="Total Returned" 
          value={overallStats.returned} 
          description="Items returned to inventory" 
          icon={Undo2} 
        />
        <StatCard 
          title="Total Stock Inflow" 
          value={overallStats.inflow} 
          description="New items & initial stock" 
          icon={PackagePlus} 
        />
        <StatCard 
          title="Total Stock Outflow" 
          value={overallStats.outflow} 
          description="Items used or sold" 
          icon={PackageMinus} 
        />
      </div>

      <Card className="mt-6 shadow-md">
        <CardHeader>
          <CardTitle>Product Movement Breakdown</CardTitle>
          <CardDescription>
            Detailed summary of inventory movements per product for the selected date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dateRange?.from && dateRange?.to ? (
            <DataTable columns={productReportColumns} data={productBreakdown} filterColumn="productName" filterInputPlaceholder="Filter by product name..."/>
          ) : (
             <p className="text-center text-muted-foreground py-8">Please select a date range to see the detailed breakdown.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

