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
import { MOCK_PRODUCTS, MOCK_CATEGORIES, PRODUCT_STATUS_OPTIONS, MOCK_WAREHOUSES, ALL_FILTER_VALUE } from '@/lib/constants';
import type { Product, ProductStatus, Category, Warehouse } from '@/lib/types';
import { Package, Filter, UploadCloud, Edit3, MoreHorizontal, Trash2, Eye, Home } from 'lucide-react';
import type { ColumnDef } from "@tanstack/react-table";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('');

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedProductForStatus, setSelectedProductForStatus] = useState<Product | null>(null);
  const { toast } = useToast();

  const handleProductImport = async (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const newProducts: Product[] = results.data.map((row: any) => {
            // Basic validation and type conversion
            if (!row.id || !row.name || !row.sku) {
              throw new Error(`Missing required fields (id, name, sku) in row: ${JSON.stringify(row)}`);
            }
            return {
              id: String(row.id),
              name: String(row.name),
              sku: String(row.sku),
              category: String(row.category || 'Uncategorized'),
              quantity: parseInt(row.quantity || '0', 10),
              reorderLevel: parseInt(row.reorderLevel || '0', 10),
              warehouseId: String(row.warehouseId || MOCK_WAREHOUSES[0]?.id || 'wh1'),
              status: (row.status as ProductStatus) || 'Available',
              lastUpdated: new Date().toISOString(),
              imageUrl: String(row.imageUrl || 'https://placehold.co/100x100.png'),
              description: String(row.description || ''),
            };
          });

          // Filter out duplicates by ID, prefer new data
          const productMap = new Map(products.map(p => [p.id, p]));
          newProducts.forEach(np => productMap.set(np.id, np));
          
          setProducts(Array.from(productMap.values()));
          toast({ title: "Products Imported", description: `${newProducts.length} products processed from ${file.name}.` });
        } catch (error: any) {
          console.error("Error processing product import CSV:", error);
          toast({ title: "Import Error", description: `Failed to import products: ${error.message}`, variant: "destructive" });
        }
      },
      error: (error: any) => {
        console.error("Error parsing product import CSV:", error);
        toast({ title: "Parsing Error", description: `Could not parse ${file.name}: ${error.message}`, variant: "destructive" });
      }
    });
  };

  const handleInventoryUpdate = async (file: File) => {
     Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const updates = results.data as Array<{ sku: string, quantity?: string, reorderLevel?: string }>;
          let updatedCount = 0;

          setProducts(prevProducts => {
            const newProductsState = prevProducts.map(p => {
              const update = updates.find(u => u.sku === p.sku);
              if (update) {
                updatedCount++;
                return {
                  ...p,
                  quantity: update.quantity !== undefined ? parseInt(update.quantity, 10) : p.quantity,
                  reorderLevel: update.reorderLevel !== undefined ? parseInt(update.reorderLevel, 10) : p.reorderLevel,
                  lastUpdated: new Date().toISOString(),
                };
              }
              return p;
            });
            return newProductsState;
          });
          
          toast({ title: "Inventory Updated", description: `${updatedCount} products updated from ${file.name}.` });
        } catch (error: any) {
          console.error("Error processing inventory update CSV:", error);
          toast({ title: "Update Error", description: `Failed to update inventory: ${error.message}`, variant: "destructive" });
        }
      },
      error: (error: any) => {
        console.error("Error parsing inventory update CSV:", error);
        toast({ title: "Parsing Error", description: `Could not parse ${file.name}: ${error.message}`, variant: "destructive" });
      }
    });
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
  
  const getWarehouseName = (warehouseId: string) => {
    return MOCK_WAREHOUSES.find(wh => wh.id === warehouseId)?.name || 'N/A';
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(filterName.toLowerCase()) || product.sku.toLowerCase().includes(filterName.toLowerCase());
      const categoryMatch = filterCategory ? product.category === filterCategory : true;
      const statusMatch = filterStatus ? product.status === filterStatus : true;
      const warehouseMatch = filterWarehouse ? product.warehouseId === filterWarehouse : true;
      return nameMatch && categoryMatch && statusMatch && warehouseMatch;
    });
  }, [products, filterName, filterCategory, filterStatus, filterWarehouse]);

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
    { 
      accessorKey: "warehouseId", 
      header: "Warehouse",
      cell: ({ row }) => getWarehouseName(row.original.warehouseId)
    },
    { accessorKey: "quantity", header: "Quantity" },
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
          title="Import Products (CSV)"
          description="Upload a .csv file to bulk add or update products. Expects headers: id,name,sku,category,quantity,reorderLevel,warehouseId,status,imageUrl,description"
          onFileUpload={handleProductImport}
          acceptedFileTypes=".csv"
          icon={<UploadCloud className="h-8 w-8 text-primary" />}
        />
        <FileUploadCard
          title="Update Inventory (CSV)"
          description="Use a .csv file to update existing stock quantities and reorder levels. Expects headers: sku,quantity,reorderLevel"
          onFileUpload={handleInventoryUpdate}
          acceptedFileTypes=".csv"
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
        <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center">
          <Input
            placeholder="Filter by name or SKU..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="max-w-xs h-9"
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
          <Select
            value={filterWarehouse}
            onValueChange={(value) => setFilterWarehouse(value === ALL_FILTER_VALUE ? "" : value)}
          >
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Warehouses</SelectItem>
              {MOCK_WAREHOUSES.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => { setFilterName(''); setFilterCategory(''); setFilterStatus(''); setFilterWarehouse('');}} className="h-9">
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
