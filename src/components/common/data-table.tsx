
// src/components/common/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel, // Added for sorting
  SortingState,      // Added for sorting
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowUpDown } from "lucide-react"; // For sort icons

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterInputPlaceholder?: string;
  filterColumn?: string; 
  actionButtons?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterInputPlaceholder = "Filter records...",
  filterColumn,
  actionButtons,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]); // Added for sorting

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting, // Added for sorting
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting, // Added for sorting
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(), // Added for sorting
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        {filterColumn && (
             <Input
                placeholder={filterInputPlaceholder}
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(String(event.target.value))}
                className="w-full sm:max-w-sm h-9"
            />
        )}
        <div className="ml-auto">{actionButtons}</div>
      </div>
      <ScrollArea className="rounded-md border whitespace-nowrap">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() !== 0 ? header.getSize() : undefined }}>
                      {header.isPlaceholder
                        ? null
                        : (
                          <Button
                            variant="ghost"
                            onClick={header.column.getToggleSortingHandler()}
                            className="px-2 py-1 h-auto -ml-2 hover:bg-muted disabled:opacity-100 disabled:cursor-default"
                            disabled={!header.column.getCanSort()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && header.column.getIsSorted() === "asc" && <ArrowUpDown className="ml-2 h-3 w-3 rotate-180" />}
                            {header.column.getCanSort() && header.column.getIsSorted() === "desc" && <ArrowUpDown className="ml-2 h-3 w-3" />}
                            {header.column.getCanSort() && !header.column.getIsSorted() && <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />}
                          </Button>
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
