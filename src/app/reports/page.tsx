
// src/app/reports/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DateRangePicker } from "@/components/common/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_INVENTORY_TRANSACTIONS, MOCK_PRODUCTS, MOCK_WAREHOUSES, MOCK_CATEGORIES, ALL_FILTER_VALUE } from '@/lib/constants';
import type { InventoryTransaction, Product, Warehouse, Category } from '@/lib/types';
import { BarChart3, PackageX, Undo2, PackagePlus, PackageMinus, AlertCircle, Download, Filter as FilterIcon } from "lucide-react";
import type { DateRange } from 'react-day-picker';
import { addDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DataTable } from "@/components/common/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/auth-context';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';


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

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#FFBB28', '#FF8042'];


export default function ReportsPage() {
  const { toast } = useToast();
  const { categories: authCategories } = useAuth(); // Get categories from AuthContext
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return {
      from: startOfMonth(today),
      to: endOfMonth(today),
    };
  });
  const [filterCategory, setFilterCategory] = useState<string>(ALL_FILTER_VALUE);
  const [filterProduct, setFilterProduct] = useState<string>(ALL_FILTER_VALUE);
  const [filterWarehouse, setFilterWarehouse] = useState<string>(ALL_FILTER_VALUE);

  const availableProductsForFilter = useMemo(() => {
    if (filterCategory === ALL_FILTER_VALUE) {
      return MOCK_PRODUCTS;
    }
    return MOCK_PRODUCTS.filter(p => p.category === filterCategory);
  }, [filterCategory]);

  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return [];
    }
    return MOCK_INVENTORY_TRANSACTIONS.filter(t => {
      const transactionDate = new Date(t.date);
      const dateMatch = isWithinInterval(transactionDate, { start: dateRange.from as Date, end: dateRange.to as Date });
      
      const productDetails = MOCK_PRODUCTS.find(p => p.id === t.productId);
      const categoryMatch = filterCategory === ALL_FILTER_VALUE || (productDetails && productDetails.category === filterCategory);
      const productMatch = filterProduct === ALL_FILTER_VALUE || t.productId === filterProduct;
      const warehouseMatch = filterWarehouse === ALL_FILTER_VALUE || t.warehouseId === filterWarehouse;

      return dateMatch && categoryMatch && productMatch && warehouseMatch;
    });
  }, [dateRange, filterCategory, filterProduct, filterWarehouse]);

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
      adjustment: calculateStats(['Adjustment']), // Assuming 'Adjustment' type exists
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

  const barChartData = useMemo(() => {
    return productBreakdown.map(item => ({
      name: item.productName.length > 15 ? `${item.productName.substring(0,15)}...` : item.productName, // Truncate long names
      Inflow: item.totalInflow,
      Outflow: item.totalOutflow,
    })).slice(0, 10); // Limit to top 10 for better readability
  }, [productBreakdown]);

  const pieChartData = useMemo(() => {
    const typeCounts: Record<InventoryTransaction['type'], number> = {
      Inflow: 0, Initial: 0, Outflow: 0, Damage: 0, Return: 0, Adjustment: 0,
    };
    filteredTransactions.forEach(t => {
      typeCounts[t.type] = (typeCounts[t.type] || 0) + Math.abs(t.quantityChange);
    });
    return Object.entries(typeCounts)
      .filter(([, value]) => value > 0) // Only include types with actual transactions
      .map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const lowStockProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => 
        p.quantity <= p.reorderLevel || 
        p.status === 'Low Stock' || 
        p.status === 'Out of Stock'
    ).filter(p => { // Apply warehouse filter if active
        return filterWarehouse === ALL_FILTER_VALUE || p.warehouseId === filterWarehouse;
    }).filter(p => { // Apply category filter if active
        return filterCategory === ALL_FILTER_VALUE || p.category === filterCategory;
    });
  }, [filterWarehouse, filterCategory]);

  const lowStockColumns: ColumnDef<Product>[] = [
    { accessorKey: "name", header: "Product Name", cell: ({row}) => <div className="font-medium">{row.original.name}</div> },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "warehouseId", header: "Warehouse", cell: ({row}) => MOCK_WAREHOUSES.find(wh => wh.id === row.original.warehouseId)?.name || 'N/A' },
    { accessorKey: "quantity", header: "Current Qty" },
    { accessorKey: "reorderLevel", header: "Reorder Lvl" },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (status === "Low Stock") badgeVariant = "outline";
        if (status === "Out of Stock" || status === "Damaged") badgeVariant = "destructive";
        return <Badge variant={badgeVariant} className={
          status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
          status === 'Available' ? 'bg-green-100 text-green-800 border-green-300' : ''
        }>{status}</Badge>;
      },
    },
  ];

  const handleExportProductMovement = () => {
    if (productBreakdown.length === 0) {
      toast({ title: "No data to export", description: "Please refine your filters or select a date range with data." });
      return;
    }
    const csvData = Papa.unparse(productBreakdown.map(item => ({
      "Product Name": item.productName,
      "Total Inflow": item.totalInflow,
      "Total Outflow": item.totalOutflow,
      "Damaged": item.totalDamaged,
      "Returned": item.totalReturned,
      "Net Change": item.netChange,
    })));
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `product_movement_report_${dateRange?.from ? new Date(dateRange.from).toLocaleDateString() : ''}_${dateRange?.to ? new Date(dateRange.to).toLocaleDateString() : ''}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast({ title: "Export Successful", description: "Product movement report has been downloaded." });
  };

  const handleClearFilters = () => {
    setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    setFilterCategory(ALL_FILTER_VALUE);
    setFilterProduct(ALL_FILTER_VALUE);
    setFilterWarehouse(ALL_FILTER_VALUE);
  };


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Inventory Reports"
        icon={BarChart3}
        description="Analyze inventory movements, stock levels, and trends within specific periods and filters."
      />

      <Card>
        <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Select date range and other filters to refine your reports.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row flex-wrap gap-2 items-center">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Warehouses</SelectItem>
                {MOCK_WAREHOUSES.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={(value) => {setFilterCategory(value); setFilterProduct(ALL_FILTER_VALUE);}}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
                {authCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterProduct} onValueChange={setFilterProduct} disabled={availableProductsForFilter.length === 0 && filterCategory === ALL_FILTER_VALUE}>
              <SelectTrigger className="w-full md:w-[200px] h-9">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Products</SelectItem>
                {availableProductsForFilter.map(prod => <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleClearFilters} className="h-9">
              <FilterIcon className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
        </CardContent>
      </Card>


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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Product Inflow vs. Outflow (Top 10)</CardTitle>
            <CardDescription>Comparison of total inflow and outflow for selected products.</CardDescription>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} margin={{ top: 5, right: 20, left: -20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} style={{ fontSize: '0.75rem' }}/>
                  <YAxis style={{ fontSize: '0.75rem' }}/>
                  <Tooltip contentStyle={{fontSize: '0.75rem'}}/>
                  <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
                  <Bar dataKey="Inflow" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Outflow" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available for the selected filters to display this chart.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Transaction Type Distribution</CardTitle>
            <CardDescription>Breakdown of transaction types by total quantity moved.</CardDescription>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                    style={{ fontSize: '0.8rem' }}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{fontSize: '0.75rem'}}/>
                  <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No transaction data available for the selected filters to display this chart.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Movement Breakdown</CardTitle>
            <CardDescription>
              Detailed summary of inventory movements per product for the selected date range and filters.
            </CardDescription>
          </div>
          <Button onClick={handleExportProductMovement} variant="outline" size="sm" disabled={productBreakdown.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {dateRange?.from && dateRange?.to ? (
            <DataTable columns={productReportColumns} data={productBreakdown} filterColumn="productName" filterInputPlaceholder="Filter by product name..."/>
          ) : (
             <p className="text-center text-muted-foreground py-8">Please select a date range to see the detailed breakdown.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 shadow-md">
        <CardHeader>
            <CardTitle>Low Stock / Reorder Needed Report</CardTitle>
            <CardDescription>Products that are below their reorder level or marked as low/out of stock. Applies active warehouse/category filters.</CardDescription>
        </CardHeader>
        <CardContent>
            {lowStockProducts.length > 0 ? (
                <DataTable columns={lowStockColumns} data={lowStockProducts} filterColumn="name" filterInputPlaceholder="Filter by product name..." />
            ) : (
                <p className="text-center text-muted-foreground py-8">No products currently need reordering based on active filters.</p>
            )}
        </CardContent>
      </Card>

    </div>
  );
}


    