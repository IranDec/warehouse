
// src/components/product/add-edit-product-modal.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, ProductStatus, Warehouse } from '@/lib/types'; // Removed Category import
import { PRODUCT_STATUS_OPTIONS, MOCK_WAREHOUSES } from '@/lib/constants'; // Removed MOCK_CATEGORIES
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative").default(0),
  reorderLevel: z.coerce.number().min(0, "Reorder level cannot be negative").default(0),
  status: z.enum(PRODUCT_STATUS_OPTIONS.map(opt => opt.value) as [ProductStatus, ...ProductStatus[]], {
    required_error: "Status is required",
  }),
  imageUrl: z.string().url("Must be a valid URL (e.g., https://placehold.co/100x100.png)").optional().or(z.literal('')),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Product) => void;
  existingProduct?: Product | null;
}

export function AddEditProductModal({ isOpen, onClose, onSubmit, existingProduct }: AddEditProductModalProps) {
  const { toast } = useToast();
  const { categories } = useAuth(); // Get categories from AuthContext

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      warehouseId: '',
      quantity: 0,
      reorderLevel: 0,
      status: 'Available',
      imageUrl: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (existingProduct) {
        reset({
          id: existingProduct.id,
          name: existingProduct.name,
          sku: existingProduct.sku,
          category: existingProduct.category,
          warehouseId: existingProduct.warehouseId,
          quantity: existingProduct.quantity,
          reorderLevel: existingProduct.reorderLevel,
          status: existingProduct.status,
          imageUrl: existingProduct.imageUrl || '',
          description: existingProduct.description || '',
        });
      } else {
        reset({ 
          name: '',
          sku: '',
          category: categories[0]?.name || '', // Use categories from context
          warehouseId: MOCK_WAREHOUSES[0]?.id || '',
          quantity: 0,
          reorderLevel: 10,
          status: 'Available',
          imageUrl: 'https://placehold.co/100x100.png',
          description: '',
        });
      }
    }
  }, [isOpen, existingProduct, reset, categories]);

  const handleFormSubmit = (data: ProductFormData) => {
    const productToSubmit: Product = {
      id: existingProduct?.id || `prod${Date.now()}`, 
      lastUpdated: new Date().toISOString(),
      ...data,
      imageUrl: data.imageUrl || 'https://placehold.co/100x100.png', 
    };
    onSubmit(productToSubmit);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{existingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {existingProduct ? 'Update the details of this product.' : 'Fill in the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4 flex-grow overflow-y-auto pr-2">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="name" {...field} />}
            />
            {errors.name && <p className="text-xs text-destructive pt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <Controller
              name="sku"
              control={control}
              render={({ field }) => <Input id="sku" {...field} />}
            />
            {errors.sku && <p className="text-xs text-destructive pt-1">{errors.sku.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => ( // Use categories from context
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-xs text-destructive pt-1">{errors.category.message}</p>}
            </div>

            <div>
              <Label htmlFor="warehouseId">Warehouse</Label>
              <Controller
                name="warehouseId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="warehouseId">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_WAREHOUSES.map(wh => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.warehouseId && <p className="text-xs text-destructive pt-1">{errors.warehouseId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => <Input id="quantity" type="number" {...field} />}
              />
              {errors.quantity && <p className="text-xs text-destructive pt-1">{errors.quantity.message}</p>}
            </div>

            <div>
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Controller
                name="reorderLevel"
                control={control}
                render={({ field }) => <Input id="reorderLevel" type="number" {...field} />}
              />
              {errors.reorderLevel && <p className="text-xs text-destructive pt-1">{errors.reorderLevel.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-xs text-destructive pt-1">{errors.status.message}</p>}
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => <Input id="imageUrl" {...field} placeholder="https://placehold.co/100x100.png" />}
            />
            {errors.imageUrl && <p className="text-xs text-destructive pt-1">{errors.imageUrl.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Textarea id="description" {...field} rows={3} />}
            />
            {errors.description && <p className="text-xs text-destructive pt-1">{errors.description.message}</p>}
          </div>

          <DialogFooter className="sm:justify-end gap-2 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{existingProduct ? 'Update Product' : 'Add Product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
