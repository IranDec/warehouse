
// src/app/products/[productId]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_PRODUCTS, MOCK_WAREHOUSES, PRODUCT_STATUS_OPTIONS } from '@/lib/constants';
import type { Product, Warehouse } from '@/lib/types';
import { Package, ArrowLeft, AlertTriangle, CheckCircle, Edit, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { AddEditProductModal } from '@/components/product/add-edit-product-modal';
import { ProductStatusModal } from '@/components/product/product-status-modal';
import { useToast } from '@/hooks/use-toast';
import { ClientSideFormattedDate } from '@/components/common/client-side-formatted-date';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined for loading, null for not found
  const [warehouse, setWarehouse] = useState<Warehouse | null | undefined>(undefined);

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const productId = params.productId as string;

  useEffect(() => {
    if (productId) {
      const foundProduct = MOCK_PRODUCTS.find(p => p.id === productId);
      setProduct(foundProduct || null);
      if (foundProduct) {
        const foundWarehouse = MOCK_WAREHOUSES.find(wh => wh.id === foundProduct.warehouseId);
        setWarehouse(foundWarehouse || null);
      } else {
        setWarehouse(null);
      }
    }
  }, [productId]);

  const handleSaveProduct = (updatedProduct: Product) => {
    const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === updatedProduct.id);
    if (productIndex !== -1) {
      MOCK_PRODUCTS[productIndex] = updatedProduct;
    }
    setProduct(updatedProduct); 
    const updatedWarehouse = MOCK_WAREHOUSES.find(wh => wh.id === updatedProduct.warehouseId);
    setWarehouse(updatedWarehouse || null);
    toast({ title: "Product Updated", description: `${updatedProduct.name} has been updated.` });
  };

  const handleSaveStatus = (pid: string, newStatus: Product['status'], newDescription?: string) => {
    if (product && product.id === pid) {
      const updatedProduct = { ...product, status: newStatus, description: newDescription || product.description, lastUpdated: new Date().toISOString() };
      const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === pid);
      if (productIndex !== -1) {
        MOCK_PRODUCTS[productIndex] = updatedProduct;
      }
      setProduct(updatedProduct);
      toast({ title: "Status Updated", description: `Status for product ${product.name} changed to ${newStatus}.` });
    }
  };

  const canEditProduct = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canUpdateStatus = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager' || (currentUser?.role === 'DepartmentEmployee' && currentUser.categoryAccess === product?.category);


  if (product === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Package className="h-12 w-12 animate-pulse text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8 text-center">
        <PageHeader title="Product Not Found" icon={AlertTriangle} description="The product you are looking for does not exist or could not be found." />
        <Button onClick={() => router.push('/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
      </div>
    );
  }

  if (currentUser?.role === 'DepartmentEmployee' && currentUser.categoryAccess !== product.category) {
     return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8 text-center">
        <PageHeader title="Access Denied" icon={AlertTriangle} description="You do not have permission to view this product." />
        <Button onClick={() => router.push('/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: Product['status']) => {
    if (status === "Low Stock") return "outline";
    if (status === "Out of Stock" || status === "Damaged") return "destructive";
    return "default";
  }

  const getStatusBadgeClass = (status: Product['status']) => {
     if (status === 'Low Stock') return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700';
     if (status === 'Available') return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700';
     return '';
  }


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={product.name}
        icon={Package}
        description={`Details for SKU: ${product.sku}`}
        actions={
          <div className="flex gap-2">
            {canUpdateStatus && (
              <Button variant="outline" onClick={() => setIsStatusModalOpen(true)}>
                <Edit3 className="mr-2 h-4 w-4" /> Update Status
              </Button>
            )}
            {canEditProduct && (
              <Button onClick={() => setIsAddEditModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Product
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="overflow-hidden shadow-lg">
            <Image
              src={product.imageUrl || "https://placehold.co/400x300.png"}
              alt={product.name}
              width={400}
              height={300}
              className="w-full h-auto object-cover"
              data-ai-hint="product image"
            />
            <CardContent className="p-4">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>SKU: {product.sku}</CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Category:</span>
                <span>{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Warehouse:</span>
                <span>{warehouse?.name || product.warehouseId}</span>
              </div>
               <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Status:</span>
                <Badge variant={getStatusBadgeVariant(product.status)} className={getStatusBadgeClass(product.status)}>
                    {product.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Quantity:</span>
                <span className="font-semibold">{product.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Reorder Level:</span>
                <span>{product.reorderLevel} units</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Last Updated:</span>
                <span><ClientSideFormattedDate dateString={product.lastUpdated} formatString="PP" /></span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {product.description || "No description available."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      {product && (
        <>
          <ProductStatusModal
            product={product}
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            onSave={handleSaveStatus}
          />
          <AddEditProductModal
            isOpen={isAddEditModalOpen}
            onClose={() => setIsAddEditModalOpen(false)}
            onSubmit={handleSaveProduct}
            existingProduct={product}
          />
        </>
      )}
    </div>
  );
}
