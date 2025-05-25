// src/app/products/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { FileUploadCard } from "@/components/common/file-upload-card";
import { ProductStatusModal } from "@/components/product/product-status-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, PRODUCT_STATUS_OPTIONS } from '@/lib/constants';
import type { Product, ProductStatus, Category } from '@/lib/types';
import { Package, Filter, UploadCloud, Edit3, MoreHorizontal, Trash2, Eye } from 'lucide-react';
import type { ColumnDef } from "@tanstack/react-table";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const ALL_FILTER_VALUE = "__ALL__";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedProductForStatus, setSelectedProductForStatus] = useState<Product | null>(null);
  const { toast } = useToast();

  const handleProductImport = async (file: File) => {
    // Simulate file processing for product import
    console.log("Importing products from:", file.name);
    // In a real app, parse file and update products state or call API
    toast({ title: "Products Imported", description: `${file.name} processed. (Simulated)` });
  };

  const handleInventoryUpdate = async (file: File) => {
    // Simulate file processing for inventory update
    console.log("Updating inventory from:", file.name);
    // In a real app, parse file and update product quantities or call API
    toast({ title: "Inventory Updated", description: `${file.name} processed. (Simulated)` });
  };

  const handleOpenStatusModal = (product: Product) => {
    setSelectedProductForStatus(product);
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = (productId: string, newStatus: ProductStatus, newDescription?: string) => {
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, status: newStatus, description: newDescription || p.description, lastUpdated: new Date().toISOString() } : p
      )
    );
    toast({ title: "Status Updated", description: `Status for product ${productId} changed to ${newStatus}.` });
  };
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(filterName.toLowerCase()) || product.sku.toLowerCase().includes(filterName.toLowerCase());
      const categoryMatch = filterCategory ? product.category === filterCategory : true;
      const statusMatch = filterStatus ? product.status === filterStatus : true;
      return nameMatch && categoryMatch && statusMatch;
    });
  }, [products, filterName, filterCategory, filterStatus]);

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "imageUrl",
      header: "",
      cell: ({ row }) => (
        <Image 
          src={row.original.imageUrl || "https://placehold.co/40x40.png"} 
          alt={row.original.name} 
          width={40} 
          height={40} 
          className="rounded"
          data-ai-hint="product package" 
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      )
    },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "quantity", header: "Quantity" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (status === "Low Stock") badgeVariant = "outline"; // yellow-ish
        if (status === "Out of Stock" || status === "Damaged") badgeVariant = "destructive";
        
        return <Badge variant={badgeVariant} className={
          status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
          status === 'Available' ? 'bg-green-100 text-green-800 border-green-300' : ''
        }>{status}</Badge>;
      },
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ row }) => new Date(row.original.lastUpdated).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleOpenStatusModal(row.original)}>
              <Edit3 className="mr-2 h-4 w-4" /> Update Status
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Product Management"
        icon={Package}
        description="Oversee your product catalog, update stock levels, and manage statuses."
        actions={<Button>Add New Product</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" id="import">
        <FileUploadCard
          title="Import Products"
          description="Upload an .xlsx or .csv file to bulk add new products to the inventory."
          onFileUpload={handleProductImport}
          icon={<UploadCloud className="h-8 w-8 text-primary" />}
        />
        <FileUploadCard
          title="Update Inventory"
          description="Use an Excel file to update existing stock quantities and reorder levels."
          onFileUpload={handleInventoryUpdate}
          icon={<UploadCloud className="h-8 w-8 text-primary" />}
        />
         <div className="lg:col-span-1 p-6 bg-card rounded-lg shadow-lg border">
          <h3 className="text-lg font-semibold mb-2 text-foreground">Product Insights</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Currently managing <span className="font-bold text-primary">{products.length}</span> distinct products.
            Monitor stock levels and statuses to ensure optimal inventory management.
          </p>
          <Image src="https://placehold.co/300x150.png" alt="Product insights placeholder" width={300} height={150} className="rounded-md w-full" data-ai-hint="warehouse shelves" />
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <Input
            placeholder="Filter by name or SKU..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="max-w-sm h-9"
          />
          <Select 
            value={filterCategory} 
            onValueChange={(value) => setFilterCategory(value === ALL_FILTER_VALUE ? "" : value)}
          >
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
              {MOCK_CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select 
            value={filterStatus} 
            onValueChange={(value) => setFilterStatus(value === ALL_FILTER_VALUE ? "" : value)}
          >
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Statuses</SelectItem>
              {PRODUCT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => { setFilterName(''); setFilterCategory(''); setFilterStatus('');}} className="h-9">
            <Filter className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>
        <DataTable columns={columns} data={filteredProducts} filterColumn="name" />
      </div>

      <ProductStatusModal
        product={selectedProductForStatus}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSave={handleSaveStatus}
      />
    </div>
  );
}
