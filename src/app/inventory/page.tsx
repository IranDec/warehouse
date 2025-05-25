
// src/app/inventory/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { VarianceExplainerModal } from "@/components/inventory/variance-explainer-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_INVENTORY_TRANSACTIONS, MOCK_PRODUCTS, ALL_FILTER_VALUE } from '@/lib/constants';
import type { InventoryTransaction, InventoryTransactionType } from '@/lib/types';
import { ListOrdered, Filter } from 'lucide-react';
import type { ColumnDef } from "@tanstack/react-table";
import { DateRangePicker } from '@/components/common/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { ClientSideFormattedDate } from '@/components/common/client-side-formatted-date';
import { useAuth } from '@/contexts/auth-context'; // Added warehouses

const TRANSACTION_TYPES: InventoryTransactionType[] = ['Inflow', 'Outflow', 'Return', 'Damage', 'Adjustment', 'Initial'];

export default function InventoryPage() {
  const { warehouses } = useAuth(); // Get warehouses from context
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(MOCK_INVENTORY_TRANSACTIONS);
  const [filterProduct, setFilterProduct] = useState<string>(ALL_FILTER_VALUE);
  const [filterType, setFilterType] = useState<string>(ALL_FILTER_VALUE);
  const [filterWarehouse, setFilterWarehouse] = useState<string>(ALL_FILTER_VALUE);
  const [filterUser, setFilterUser] = useState<string>(ALL_FILTER_VALUE);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const uniqueUsers = useMemo(() => {
    const users = new Set(transactions.map(t => t.user));
    return Array.from(users).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const productMatch = filterProduct === ALL_FILTER_VALUE || filterProduct === "" ? true : transaction.productId === filterProduct;
      const typeMatch = filterType === ALL_FILTER_VALUE || filterType === "" ? true : transaction.type === filterType;
      const warehouseMatch = filterWarehouse === ALL_FILTER_VALUE || filterWarehouse === "" ? true : transaction.warehouseId === filterWarehouse;
      const userMatch = filterUser === ALL_FILTER_VALUE || filterUser === "" ? true : transaction.user === filterUser;
      const date = new Date(transaction.date);
      const dateMatch = dateRange?.from && dateRange?.to 
        ? date >= dateRange.from && date <= dateRange.to 
        : true;
      return productMatch && typeMatch && warehouseMatch && userMatch && dateMatch;
    });
  }, [transactions, filterProduct, filterType, filterWarehouse, filterUser, dateRange]);

  const columns: ColumnDef<InventoryTransaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <ClientSideFormattedDate dateString={row.original.date} formatString="PP" />,
    },
    { accessorKey: "productName", header: "Product Name" },
    { 
      accessorKey: "warehouseName", 
      header: "Warehouse",
      cell: ({ row }) => row.original.warehouseName || warehouses.find(wh => wh.id === row.original.warehouseId)?.name || 'N/A'
    },
    { accessorKey: "type", header: "Type" },
    { 
      accessorKey: "quantityChange", 
      header: "Quantity Change",
      cell: ({ row }) => {
        const quantity = row.original.quantityChange;
        const isPositive = quantity > 0;
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? `+${quantity}` : quantity}
          </span>
        );
      }
    },
    { accessorKey: "user", header: "User/System" },
    { accessorKey: "reason", header: "Reason/Notes" },
  ];
  
  const clearAllFilters = () => {
    setFilterProduct(ALL_FILTER_VALUE);
    setFilterType(ALL_FILTER_VALUE);
    setFilterWarehouse(ALL_FILTER_VALUE);
    setFilterUser(ALL_FILTER_VALUE);
    setDateRange({ from: addDays(new Date(), -30), to: new Date() });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Inventory Ledger"
        icon={ListOrdered}
        description="Track all stock movements, adjustments, and transactions."
        actions={<VarianceExplainerModal />}
      />

      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Select 
            value={filterProduct} 
            onValueChange={(value) => setFilterProduct(value === ALL_FILTER_VALUE ? "" : value)}
          >
            <SelectTrigger className="w-full md:w-[200px] h-9">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Products</SelectItem>
              {MOCK_PRODUCTS.map(prod => <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select 
            value={filterType} 
            onValueChange={(value) => setFilterType(value === ALL_FILTER_VALUE ? "" : value)}
          >
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Types</SelectItem>
              {TRANSACTION_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filterWarehouse}
            onValueChange={(value) => setFilterWarehouse(value === ALL_FILTER_VALUE ? "" : value)}
          >
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Warehouses</SelectItem>
              {warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filterUser}
            onValueChange={(value) => setFilterUser(value === ALL_FILTER_VALUE ? "" : value)}
          >
            <SelectTrigger className="w-full md:w-[200px] h-9">
              <SelectValue placeholder="All Users/Systems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Users/Systems</SelectItem>
              {uniqueUsers.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={clearAllFilters} className="h-9">
            <Filter className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>
        <DataTable columns={columns} data={filteredTransactions} filterColumn="productName" />
      </div>
    </div>
  );
}
