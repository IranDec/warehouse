// src/app/inventory/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { VarianceExplainerModal } from "@/components/inventory/variance-explainer-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_INVENTORY_TRANSACTIONS, MOCK_PRODUCTS } from '@/lib/constants';
import type { InventoryTransaction, InventoryTransactionType, Product } from '@/lib/types';
import { ListOrdered, BarChartHorizontalBig, Filter, Package } from 'lucide-react';
import type { ColumnDef } from "@tanstack/react-table";
import { DateRangePicker } from '@/components/common/date-range-picker'; // Assuming this component exists or will be created
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';

// Dummy DateRangePicker for now
const DateRangePickerPlaceholder = ({ date, onDateChange }: { date?: DateRange, onDateChange: (date?: DateRange) => void}) => (
  <Button variant="outline" className="w-full md:w-auto h-9 justify-start text-left font-normal">
    {date?.from ? (
      date.to ? (
        <>
          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
        </>
      ) : (
        format(date.from, "LLL dd, y")
      )
    ) : (
      <span>Pick a date range</span>
    )}
  </Button>
);


const TRANSACTION_TYPES: InventoryTransactionType[] = ['Inflow', 'Outflow', 'Return', 'Damage', 'Adjustment', 'Initial'];

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(MOCK_INVENTORY_TRANSACTIONS);
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const productMatch = filterProduct ? transaction.productId === filterProduct : true;
      const typeMatch = filterType ? transaction.type === filterType : true;
      const date = new Date(transaction.date);
      const dateMatch = dateRange?.from && dateRange?.to 
        ? date >= dateRange.from && date <= dateRange.to 
        : true;
      return productMatch && typeMatch && dateMatch;
    });
  }, [transactions, filterProduct, filterType, dateRange]);

  const columns: ColumnDef<InventoryTransaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    { accessorKey: "productName", header: "Product Name" },
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

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Inventory Ledger"
        icon={ListOrdered}
        description="Track all stock movements, adjustments, and transactions."
        actions={<VarianceExplainerModal />}
      />

      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-full md:w-[200px] h-9">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Products</SelectItem>
              {MOCK_PRODUCTS.map(prod => <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {TRANSACTION_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          {/* Replace DateRangePickerPlaceholder with actual DateRangePicker if available */}
          <DateRangePickerPlaceholder date={dateRange} onDateChange={setDateRange} />
          <Button variant="ghost" onClick={() => { setFilterProduct(''); setFilterType(''); setDateRange({ from: addDays(new Date(), -30), to: new Date() }); }} className="h-9">
            <Filter className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>
        <DataTable columns={columns} data={filteredTransactions} filterColumn="productName" />
      </div>
    </div>
  );
}

// Basic DateRangePicker component if not already present in shadcn/ui (as of my knowledge cutoff)
// For actual use, you'd typically use a library or a more complete shadcn component.
// This is a simplified version for the sake of this example.
// import { CalendarIcon } from "lucide-react"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { Calendar } from "@/components/ui/calendar"

// function DateRangePicker({ date, onDateChange, className }: { date?: DateRange, onDateChange: (date?: DateRange) => void, className?: string }) {
//   return (
//     <div className={cn("grid gap-2", className)}>
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button
//             id="date"
//             variant={"outline"}
//             className={cn(
//               "w-full md:w-[300px] h-9 justify-start text-left font-normal",
//               !date && "text-muted-foreground"
//             )}
//           >
//             <CalendarIcon className="mr-2 h-4 w-4" />
//             {date?.from ? (
//               date.to ? (
//                 <>
//                   {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
//                 </>
//               ) : (
//                 format(date.from, "LLL dd, y")
//               )
//             ) : (
//               <span>Pick a date</span>
//             )}
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-auto p-0" align="start">
//           <Calendar
//             initialFocus
//             mode="range"
//             defaultMonth={date?.from}
//             selected={date}
//             onSelect={onDateChange}
//             numberOfMonths={2}
//           />
//         </PopoverContent>
//       </Popover>
//     </div>
//   )
// }

