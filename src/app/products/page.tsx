
// src/app/products/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link'; 
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { FileUploadCard } from "@/components/common/file-upload-card";
import { ProductStatusModal } from "@/components/product/product-status-modal";
import { AddEditProductModal } from "@/components/product/add-edit-product-modal"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { PRODUCT_STATUS_OPTIONS, ALL_FILTER_VALUE } from '@/lib/constants';
import type { Product, ProductStatus } from '@/lib/types';
import { Package, Filter, UploadCloud, Edit3, MoreHorizontal, Trash2, Eye, Edit, PlusCircle, Info } from 'lucide-react';
import type { ColumnDef } from "@tanstack/react-table";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { useAuth } from '@/contexts/auth-context';
import { ClientSideFormattedDate } from '@/components/common/client-side-formatted-date';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function ProductsPage() {
  const { currentUser, categories, warehouses, products: contextProducts, setProducts: setContextProducts } = useAuth(); 
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>(ALL_FILTER_VALUE);
  const [filterStatus, setFilterStatus] = useState<string>(ALL_FILTER_VALUE);
  const [filterWarehouse, setFilterWarehouse] = useState<string>(ALL_FILTER_VALUE); 

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedProductForStatus, setSelectedProductForStatus] = useState<Product | null>(null);
  
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();

  const canAddProducts = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canEditProducts = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canDeleteProducts = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';

  const handleProductImport = async (file: File) => {
    if (!canAddProducts && !canEditProducts) {
      toast({ title: "Permission Denied", description: "You do not have permission to import products.", variant: "destructive" });
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const importedProductsData: Product[] = results.data.map((row: any) => {
            if (!row.id || !row.name || !row.sku) {
              throw new Error(`Missing required fields (id, name, sku) in row: ${JSON.stringify(row)}`);
            }
            const warehouseExists = warehouses.some(wh => wh.id === String(row.warehouseId || ''));
            if (!warehouseExists && row.warehouseId) {
                toast({ title: "Import Warning", description: `Warehouse ID '${row.warehouseId}' for product '${row.name}' does not exist. Product will be assigned to default or no warehouse. Ensure 'warehouseId' matches an existing warehouse ID.`, variant: "default", duration: 7000 });
            }
            return {
              id: String(row.id),
              name: String(row.name),
              sku: String(row.sku),
              category: String(row.category || 'Uncategorized'),
              quantity: parseInt(row.quantity || '0', 10),
              reorderLevel: parseInt(row.reorderLevel || '0', 10),
              warehouseId: warehouseExists ? String(row.warehouseId) : warehouses[0]?.id || 'wh1',
              status: (PRODUCT_STATUS_OPTIONS.find(opt => opt.value.toLowerCase() === String(row.status || '').toLowerCase())?.value as ProductStatus) || 'Available',
              lastUpdated: new Date().toISOString(),
              imageUrl: String(row.imageUrl || 'https://placehold.co/100x100.png'),
              description: String(row.description || ''),
            };
          });

          const productMap = new Map(contextProducts.map(p => [p.id, p]));
          importedProductsData.forEach(np => productMap.set(np.id, np));

          setContextProducts(Array.from(productMap.values()));
          toast({ title: "Products Imported", description: `${importedProductsData.length} products processed from ${file.name}.` });
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
    if (!canEditProducts) {
       toast({ title: "Permission Denied", description: "You do not have permission to update inventory.", variant: "destructive" });
      return;
    }
     Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const updates = results.data as Array<{ sku: string, quantity?: string, reorderLevel?: string }>;
          let updatedCount = 0;

          setContextProducts(prevProducts => {
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
    setContextProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, status: newStatus, description: newDescription || p.description, lastUpdated: new Date().toISOString() } : p
      )
    );
    toast({ title: "Status Updated", description: `Status for product ${productId} changed to ${newStatus}.` });
  };
  
  const handleOpenAddEditModal = (product?: Product) => {
    setEditingProduct(product || null);
    setIsAddEditModalOpen(true);
  };

  const handleSaveProduct = (productData: Product) => {
    if (editingProduct) { 
      setContextProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
      toast({ title: "Product Updated", description: `${productData.name} has been updated.`});
    } else { 
      setContextProducts(prev => [{...productData, id: `prod${Date.now()}`}, ...prev]);
      toast({ title: "Product Added", description: `${productData.name} has been added.`});
    }
    setEditingProduct(null);
  };


  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find(wh => wh.id === warehouseId)?.name || 'N/A';
  };

  const filteredProducts = useMemo(() => {
    let userAllowedProducts = contextProducts;
    if (currentUser?.role === 'DepartmentEmployee' && currentUser.categoryAccess) {
      userAllowedProducts = contextProducts.filter(product => product.category === currentUser.categoryAccess);
    }

    return userAllowedProducts.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(filterName.toLowerCase()) || product.sku.toLowerCase().includes(filterName.toLowerCase());
      const categoryMatch = filterCategory === ALL_FILTER_VALUE || !filterCategory ? true : product.category === filterCategory;
      const statusMatch = filterStatus === ALL_FILTER_VALUE || !filterStatus ? true : product.status === filterStatus;
      const warehouseMatch = filterWarehouse === ALL_FILTER_VALUE || !filterWarehouse ? true : product.warehouseId === filterWarehouse;
      return nameMatch && categoryMatch && statusMatch && warehouseMatch;
    });
  }, [contextProducts, filterName, filterCategory, filterStatus, filterWarehouse, currentUser]);

  const productInsights = useMemo(() => {
    const lowStockCount = contextProducts.filter(p => p.status === 'Low Stock' || p.quantity <= p.reorderLevel).length;
    const outOfStockCount = contextProducts.filter(p => p.status === 'Out of Stock').length;
    return {
      totalProducts: contextProducts.length,
      totalWarehouses: warehouses.length,
      lowStockCount,
      outOfStockCount,
    };
  }, [contextProducts, warehouses]);

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
      enableSorting: false,
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
          status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700' :
          status === 'Available' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700' : ''
        }>{status}</Badge>;
      },
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ row }) => <ClientSideFormattedDate dateString={row.original.lastUpdated} formatString="PP" />,
    },
    {
      id: "actions",
      enableSorting: false,
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
            <DropdownMenuItem asChild>
              <Link href={`/products/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            {canEditProducts && (
              <DropdownMenuItem onClick={() => handleOpenAddEditModal(row.original)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Product
              </DropdownMenuItem>
            )}
            {(canEditProducts || (currentUser?.role === 'DepartmentEmployee' && currentUser.categoryAccess === row.original.category)) && (
              <DropdownMenuItem onClick={() => handleOpenStatusModal(row.original)}>
                <Edit3 className="mr-2 h-4 w-4" /> Update Status
              </DropdownMenuItem>
            )}
            
            {canDeleteProducts && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => { 
                    setContextProducts(prev => prev.filter(p => p.id !== row.original.id));
                    toast({title: "Product Deleted", description: `Product ${row.original.name} has been deleted (simulated).`, variant: "destructive"})
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                </DropdownMenuItem>
              </>
            )}
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
        actions={canAddProducts ? <Button onClick={() => handleOpenAddEditModal()}><PlusCircle className="mr-2 h-4 w-4" />Add New Product</Button> : null}
      />

      {(canAddProducts || canEditProducts) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" id="import">
          <FileUploadCard
            title="Import Products (CSV)"
            description={`Upload a .csv file to bulk add or update products. Expects headers: id,name,sku,category,quantity,reorderLevel,warehouseId,status,imageUrl,description. Ensure 'warehouseId' matches an existing ID from the ${warehouses.length} available warehouses.`}
            onFileUpload={handleProductImport}
            acceptedFileTypes=".csv"
            icon={<UploadCloud className="h-8 w-8 text-primary" />}
            disabled={!canAddProducts && !canEditProducts}
            className="lg:col-span-1"
          />
          <FileUploadCard
            title="Update Inventory (CSV)"
            description="Use a .csv file to update existing stock quantities and reorder levels. Expects headers: sku,quantity,reorderLevel"
            onFileUpload={handleInventoryUpdate}
            acceptedFileTypes=".csv"
            icon={<UploadCloud className="h-8 w-8 text-primary" />}
            disabled={!canEditProducts}
            className="lg:col-span-1"
          />
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-6 w-6 text-primary" />
                Product Insights
              </CardTitle>
              <CardDescription>A quick overview of your product catalog.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Products:</span>
                <span className="font-semibold">{productInsights.totalProducts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Managed Warehouses:</span>
                <span className="font-semibold">{productInsights.totalWarehouses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low Stock Items:</span>
                <span className={`font-semibold ${productInsights.lowStockCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{productInsights.lowStockCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Out of Stock Items:</span>
                <span className={`font-semibold ${productInsights.outOfStockCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{productInsights.outOfStockCount}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-3">
                Use the "Reports" section for detailed inventory analysis and reorder planning.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {!canAddProducts && !canEditProducts && (
         <div className="p-6 bg-card rounded-lg shadow-lg border text-center">
            <CardTitle className="text-lg font-semibold mb-2 text-foreground">Product Information</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mb-4">
              You are viewing products based on your assigned category: <span className="font-bold text-primary">{currentUser?.categoryAccess || 'N/A'}</span>.
            </CardDescription>
            <CardDescription className="text-sm text-muted-foreground">
              Contact an administrator for broader access or product management capabilities.
            </CardDescription>
        </div>
      )}


      <div className="space-y-4 pt-6">
        <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center">
          <Input
            placeholder="Filter by name or SKU..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full md:max-w-xs h-9"
          />
          <Select
            value={filterCategory}
            onValueChange={(value) => setFilterCategory(value === ALL_FILTER_VALUE ? ALL_FILTER_VALUE : value)}
            disabled={currentUser?.role === 'DepartmentEmployee' && !!currentUser.categoryAccess}
          >
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder={currentUser?.role === 'DepartmentEmployee' && currentUser.categoryAccess ? currentUser.categoryAccess : "All Categories"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
              {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value === ALL_FILTER_VALUE ? ALL_FILTER_VALUE : value)}
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
            onValueChange={(value) => setFilterWarehouse(value === ALL_FILTER_VALUE ? ALL_FILTER_VALUE : value)}
          >
            <SelectTrigger className="w-full md:w-[180px] h-9">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Warehouses</SelectItem>
              {warehouses.map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => { setFilterName(''); if (!(currentUser?.role === 'DepartmentEmployee' && !!currentUser.categoryAccess)) setFilterCategory(ALL_FILTER_VALUE); setFilterStatus(ALL_FILTER_VALUE); setFilterWarehouse(ALL_FILTER_VALUE);}} className="h-9">
            <Filter className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>
        <DataTable columns={columns} data={filteredProducts} filterColumn="name" />
      </div>

      {selectedProductForStatus && (<ProductStatusModal
        product={selectedProductForStatus}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSave={handleSaveStatus}
      />)}
      <AddEditProductModal
        isOpen={isAddEditModalOpen}
        onClose={() => {setIsAddEditModalOpen(false); setEditingProduct(null);}}
        onSubmit={handleSaveProduct}
        existingProduct={editingProduct}
      />
    </div>
  );
}

