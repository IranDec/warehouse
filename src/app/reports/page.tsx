
// src/app/reports/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DateRangePicker } from "@/components/common/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_USER_ACTIVITIES, ALL_FILTER_VALUE } from '@/lib/constants';
import type { InventoryTransaction, Product, InventoryTransactionType, UserActivityLog } from '@/lib/types';
import { BarChart3, PackageX, Undo2, PackagePlus, PackageMinus, AlertCircle, Download, Filter as FilterIcon, AlertTriangle, Users as UsersIcon, Loader2 } from "lucide-react";
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format } from 'date-fns';
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
import { ClientSideFormattedDate } from '@/components/common/client-side-formatted-date';

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
  const { categories: authCategories, warehouses, products: contextProducts, inventoryTransactions: contextTransactions, users: authUsers } = useAuth();
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
  const [filterUserActivity, setFilterUserActivity] = useState<string>(ALL_FILTER_VALUE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Simulate loading delay
    return () => clearTimeout(timer);
  }, [dateRange, filterCategory, filterProduct, filterWarehouse, filterUserActivity, contextTransactions, contextProducts]);


  const availableProductsForFilter = useMemo(() => {
    if (filterCategory === ALL_FILTER_VALUE || !filterCategory) {
      return contextProducts;
    }
    return contextProducts.filter(p => p.category === filterCategory);
  }, [filterCategory, contextProducts]);

  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return [];
    }
    return contextTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const dateMatch = isWithinInterval(transactionDate, { start: dateRange.from as Date, end: dateRange.to as Date });

      const productDetails = contextProducts.find(p => p.id === t.productId);
      const categoryMatch = filterCategory === ALL_FILTER_VALUE || !filterCategory ? true : (productDetails && productDetails.category === filterCategory);
      const productMatch = filterProduct === ALL_FILTER_VALUE || !filterProduct ? true : t.productId === filterProduct;
      const warehouseMatch = filterWarehouse === ALL_FILTER_VALUE || !filterWarehouse ? true : t.warehouseId === filterWarehouse;

      return dateMatch && categoryMatch && productMatch && warehouseMatch;
    });
  }, [dateRange, filterCategory, filterProduct, filterWarehouse, contextTransactions, contextProducts]);

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
      adjustment: calculateStats(['Adjustment']),
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

  const defectReturnTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'Damage' || t.type === 'Return');
  }, [filteredTransactions]);

  const defectReturnColumns: ColumnDef<InventoryTransaction>[] = [
    {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => <div className="font-medium">{row.original.productName}</div>
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
            <Badge variant={row.original.type === 'Damage' ? 'destructive' : 'secondary'}
                   className={row.original.type === 'Damage' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-800/30 dark:text-red-300 dark:border-red-700' : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-800/30 dark:text-blue-300 dark:border-blue-700'}>
                {row.original.type}
            </Badge>
        )
    },
    {
        accessorKey: "quantityChange",
        header: "Quantity",
        cell: ({ row }) => {
            const quantity = row.original.quantityChange;
            const type = row.original.type;
            if (type === 'Damage') return <span className="text-red-600">{quantity}</span>;
            if (type === 'Return') return <span className="text-green-600">+{quantity}</span>;
            return <span>{quantity}</span>;
        }
    },
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => <ClientSideFormattedDate dateString={row.original.date} formatString="PP" />
    },
    { accessorKey: "user", header: "User/System" },
    {
        accessorKey: "reason",
        header: "Reason/Notes",
        cell: ({ row }) => <div className="max-w-[200px] truncate" title={row.original.reason || 'N/A'}>{row.original.reason || 'N/A'}</div>
    },
    {
        accessorKey: "warehouseName",
        header: "Warehouse",
        cell: ({ row }) => row.original.warehouseName || warehouses.find(wh => wh.id === row.original.warehouseId)?.name || 'N/A'
    },
  ];

  const barChartData = useMemo(() => {
    return productBreakdown.map(item => ({
      name: item.productName.length > 15 ? `${item.productName.substring(0,15)}...` : item.productName,
      Inflow: item.totalInflow,
      Outflow: item.totalOutflow,
    })).slice(0, 10);
  }, [productBreakdown]);

  const pieChartData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      typeCounts[t.type] = (typeCounts[t.type] || 0) + Math.abs(t.quantityChange);
    });
    return Object.entries(typeCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const lowStockProducts = useMemo(() => {
    return contextProducts.filter(p =>
        p.quantity <= p.reorderLevel ||
        p.status === 'Low Stock' ||
        p.status === 'Out of Stock'
    ).filter(p => {
        return filterWarehouse === ALL_FILTER_VALUE || !filterWarehouse ? true : p.warehouseId === filterWarehouse;
    }).filter(p => {
        return filterCategory === ALL_FILTER_VALUE || !filterCategory ? true : p.category === filterCategory;
    });
  }, [filterWarehouse, filterCategory, contextProducts]);

  const lowStockColumns: ColumnDef<Product>[] = [
    { accessorKey: "name", header: "Product Name", cell: ({row}) => <div className="font-medium">{row.original.name}</div> },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "warehouseId", header: "Warehouse", cell: ({row}) => warehouses.find(wh => wh.id === row.original.warehouseId)?.name || 'N/A' },
    { accessorKey: "quantity", header: "Current Qty", cell: ({row}) => <span className="font-semibold text-red-600">{row.original.quantity}</span> },
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
          status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700' :
          status === 'Available' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700' : ''
        }>{status}</Badge>;
      },
    },
  ];

  const filteredUserActivities = useMemo((): UserActivityLog[] => {
    if (!dateRange?.from || !dateRange?.to) {
      return [];
    }
    return MOCK_USER_ACTIVITIES.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const dateMatch = isWithinInterval(activityDate, { start: dateRange.from as Date, end: dateRange.to as Date });
      const userMatch = filterUserActivity === ALL_FILTER_VALUE || !filterUserActivity ? true : activity.userId === filterUserActivity;
      return dateMatch && userMatch;
    });
  }, [dateRange, filterUserActivity]);

  const userActivityColumns: ColumnDef<UserActivityLog>[] = [
    {
      accessorKey: "userName",
      header: "User",
      cell: ({ row }) => <div className="font-medium">{row.original.userName}</div>
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => <div className="truncate max-w-xs" title={row.original.action}>{row.original.action}</div>
    },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => <ClientSideFormattedDate dateString={row.original.timestamp} formatString="PPp" />
    },
    {
      accessorKey: "details",
      header: "Details/Reference",
      cell: ({ row }) => row.original.details || 'N/A'
    },
  ];

  const generateCsvData = (data: any[], headers: {key: string, label: string}[]) => {
    const mappedData = data.map(item => {
      const row: Record<string, any> = {};
      headers.forEach(header => {
        row[header.label] = item[header.key];
      });
      return row;
    });
    return Papa.unparse(mappedData);
  };

  const downloadCsv = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast({ title: "Export Successful", description: `${filename} has been downloaded.` });
  };

  const handleExportProductMovement = () => {
    if (productBreakdown.length === 0) {
      toast({ title: "No data to export", description: "Please refine your filters or select a date range with data." });
      return;
    }
    const headers = [
      { key: "productName", label: "Product Name" },
      { key: "totalInflow", label: "Total Inflow" },
      { key: "totalOutflow", label: "Total Outflow" },
      { key: "totalDamaged", label: "Damaged" },
      { key: "totalReturned", label: "Returned" },
      { key: "netChange", label: "Net Change" },
    ];
    const csvData = generateCsvData(productBreakdown, headers);
    downloadCsv(csvData, `product_movement_report_${dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}_${dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}.csv`);
  };

  const handleExportDefectReturn = () => {
    if (defectReturnTransactions.length === 0) {
      toast({ title: "No data to export", description: "Please refine your filters for defect/return data." });
      return;
    }
     const headers = [
      { key: "productName", label: "Product Name" },
      { key: "type", label: "Type" },
      { key: "quantityChange", label: "Quantity" },
      { key: "date", label: "Date" },
      { key: "user", label: "User/System" },
      { key: "reason", label: "Reason/Notes" },
      { key: "warehouseName", label: "Warehouse" },
    ];
    const dataToExport = defectReturnTransactions.map(t => ({
        ...t,
        date: t.date ? format(parseISO(t.date), 'yyyy-MM-dd') : '',
        warehouseName: t.warehouseName || warehouses.find(wh => wh.id === t.warehouseId)?.name || 'N/A'
    }));
    const csvData = generateCsvData(dataToExport, headers);
    downloadCsv(csvData, `defect_return_report_${dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}_${dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}.csv`);
  };

  const handleExportLowStock = () => {
    if (lowStockProducts.length === 0) {
      toast({ title: "No data to export", description: "No low stock products found for current filters." });
      return;
    }
    const headers = [
      { key: "name", label: "Product Name" },
      { key: "sku", label: "SKU" },
      { key: "category", label: "Category" },
      { key: "warehouseName", label: "Warehouse" },
      { key: "quantity", label: "Current Qty" },
      { key: "reorderLevel", label: "Reorder Lvl" },
      { key: "status", label: "Status" },
    ];
     const dataToExport = lowStockProducts.map(p => ({
        ...p,
        warehouseName: warehouses.find(wh => wh.id === p.warehouseId)?.name || 'N/A'
    }));
    const csvData = generateCsvData(dataToExport, headers);
    downloadCsv(csvData, `low_stock_report_${dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}_${dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}.csv`);
  };

  const handleExportUserActivity = () => {
    if (filteredUserActivities.length === 0) {
      toast({ title: "No data to export", description: "No user activities found for current filters." });
      return;
    }
    const headers = [
      { key: "userName", label: "User" },
      { key: "action", label: "Action" },
      { key: "timestamp", label: "Timestamp" },
      { key: "details", label: "Details/Reference" },
    ];
    const dataToExport = filteredUserActivities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp ? format(parseISO(activity.timestamp), 'yyyy-MM-dd HH:mm:ss') : '',
    }));
    const csvData = generateCsvData(dataToExport, headers);
    downloadCsv(csvData, `user_activity_log_${dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}_${dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}.csv`);
  };


  const handleClearFilters = () => {
    setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    setFilterCategory(ALL_FILTER_VALUE);
    setFilterProduct(ALL_FILTER_VALUE);
    setFilterWarehouse(ALL_FILTER_VALUE);
    setFilterUserActivity(ALL_FILTER_VALUE);
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
            <Select value={filterWarehouse} onValueChange={(value) => setFilterWarehouse(value === ALL_FILTER_VALUE ? "" : value)}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Warehouses</SelectItem>
                {warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={(value) => {setFilterCategory(value === ALL_FILTER_VALUE ? "" : value); setFilterProduct(ALL_FILTER_VALUE);}}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
                {authCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterProduct} onValueChange={(value) => setFilterProduct(value === ALL_FILTER_VALUE ? "" : value)} disabled={availableProductsForFilter.length === 0 && (filterCategory === ALL_FILTER_VALUE || !filterCategory) }>
              <SelectTrigger className="w-full md:w-[200px] h-9">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Products</SelectItem>
                {availableProductsForFilter.map(prod => <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterUserActivity} onValueChange={(value) => setFilterUserActivity(value === ALL_FILTER_VALUE ? "" : value)}>
              <SelectTrigger className="w-full md:w-[200px] h-9">
                <SelectValue placeholder="All Users (Activity)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Users (Activity)</SelectItem>
                {authUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
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

      {isLoading ? (
          <div className="text-center py-10 col-span-full"> {/* Ensure loading spans all columns if in grid */}
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-3 text-muted-foreground">Loading reports data...</p>
          </div>
      ) : (
        <>
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
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" /> Defect &amp; Return Report</CardTitle>
                    <CardDescription>Details of items marked as damaged or returned within the selected filters.</CardDescription>
                </div>
                <Button onClick={handleExportDefectReturn} variant="outline" size="sm" disabled={defectReturnTransactions.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </CardHeader>
            <CardContent>
                {defectReturnTransactions.length > 0 ? (
                    <DataTable columns={defectReturnColumns} data={defectReturnTransactions} filterColumn="productName" filterInputPlaceholder="Filter by product name..." />
                ) : (
                    <p className="text-center text-muted-foreground py-8">No damaged or returned items found for the selected filters.</p>
                )}
            </CardContent>
          </Card>

          <Card className="mt-6 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />Low Stock / Reorder Needed Report</CardTitle>
                    <CardDescription>Products that are below their reorder level or marked as low/out of stock. Applies active warehouse/category filters.</CardDescription>
                </div>
                <Button onClick={handleExportLowStock} variant="outline" size="sm" disabled={lowStockProducts.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </CardHeader>
            <CardContent>
                {lowStockProducts.length > 0 ? (
                    <DataTable columns={lowStockColumns} data={lowStockProducts} filterColumn="name" filterInputPlaceholder="Filter by product name..." />
                ) : (
                    <p className="text-center text-muted-foreground py-8">No products currently need reordering based on active filters.</p>
                )}
            </CardContent>
          </Card>

          <Card className="mt-6 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center"><UsersIcon className="mr-2 h-5 w-5 text-purple-500" /> User Activity Log</CardTitle>
                    <CardDescription>Tracks key actions performed by users within the selected date range and user filter.</CardDescription>
                </div>
                <Button onClick={handleExportUserActivity} variant="outline" size="sm" disabled={filteredUserActivities.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </CardHeader>
            <CardContent>
              {dateRange?.from && dateRange?.to ? (
                <DataTable columns={userActivityColumns} data={filteredUserActivities} filterColumn="userName" filterInputPlaceholder="Filter by user name in log..." />
              ) : (
                 <p className="text-center text-muted-foreground py-8">Please select a date range to see user activity.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

