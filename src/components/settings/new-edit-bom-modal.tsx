
// src/components/settings/new-edit-bom-modal.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { BillOfMaterial, Product } from '@/lib/types';

const bomItemSchema = z.object({
  rawMaterialId: z.string().min(1, "Raw material is required"),
  quantityNeeded: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
});

const bomFormSchema = z.object({
  productId: z.string().min(1, "Finished good is required"),
  items: z.array(bomItemSchema).min(1, "At least one raw material item is required"),
});

type BomFormData = z.infer<typeof bomFormSchema>;

interface NewEditBomModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBom?: BillOfMaterial | null;
  // We'll get allProducts from AuthContext now
}

export function NewEditBomModal({ 
    isOpen, 
    onClose, 
    existingBom,
}: NewEditBomModalProps) {
  const { toast } = useToast();
  const { products: allProducts, addBomConfiguration, updateBomConfiguration } = useAuth();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<BomFormData>({
    resolver: zodResolver(bomFormSchema),
    defaultValues: {
      productId: '',
      items: [{ rawMaterialId: '', quantityNeeded: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const finishedGoods = useMemo(() => allProducts.filter(p => p.category === 'Finished Goods'), [allProducts]);
  const rawMaterials = useMemo(() => allProducts.filter(p => p.category !== 'Finished Goods'), [allProducts]);

  useEffect(() => {
    if (isOpen) {
      if (existingBom) {
        const itemsWithJustIdAndQty = existingBom.items.map(item => ({
          rawMaterialId: item.rawMaterialId,
          quantityNeeded: item.quantityNeeded
        }));
        reset({
          productId: existingBom.productId,
          items: itemsWithJustIdAndQty.length > 0 ? itemsWithJustIdAndQty : [{ rawMaterialId: '', quantityNeeded: 1 }],
        });
      } else {
        reset({
          productId: '',
          items: [{ rawMaterialId: '', quantityNeeded: 1 }],
        });
      }
    }
  }, [isOpen, existingBom, reset]);

  const onSubmitHandler = (data: BomFormData) => {
    const finishedGoodProduct = allProducts.find(p => p.id === data.productId);
    if (!finishedGoodProduct) {
        toast({title: "Error", description: "Selected finished good not found.", variant: "destructive"});
        return;
    }

    const bomToSave: BillOfMaterial = {
      productId: data.productId,
      productName: finishedGoodProduct.name, // Ensure productName is set
      items: data.items.map(item => {
        const rawMaterialProduct = allProducts.find(p => p.id === item.rawMaterialId);
        return {
          rawMaterialId: item.rawMaterialId,
          rawMaterialName: rawMaterialProduct?.name || item.rawMaterialId, // Ensure rawMaterialName is set
          quantityNeeded: item.quantityNeeded,
        };
      }),
    };

    if (existingBom) {
      updateBomConfiguration(bomToSave);
      toast({ title: "BOM Updated", description: `BOM for ${bomToSave.productName} has been updated.` });
    } else {
      // Check if BOM already exists before adding
      const { bomConfigurations } = useAuth(); // Get current BOMs
      if (bomConfigurations.find(b => b.productId === bomToSave.productId)) {
        toast({ title: "Error", description: `BOM for product ${bomToSave.productName} already exists. Please edit the existing one.`, variant: "destructive"});
        return;
      }
      addBomConfiguration(bomToSave);
      toast({ title: "BOM Added", description: `New BOM for ${bomToSave.productName} has been added.` });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{existingBom ? "Edit Bill of Materials" : "Add New Bill of Materials"}</DialogTitle>
          <DialogDescription>
            Define the raw materials required to produce a finished good.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4 py-4 flex-grow overflow-y-auto pr-2">
          <div>
            <Label htmlFor="finishedGoodId">Finished Good</Label>
            <Controller
              name="productId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!!existingBom}>
                  <SelectTrigger id="finishedGoodId">
                    <SelectValue placeholder="Select a finished good" />
                  </SelectTrigger>
                  <SelectContent>
                    {finishedGoods.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (SKU: {product.sku})
                      </SelectItem>
                    ))}
                    {finishedGoods.length === 0 && <SelectItem value="none" disabled>No finished goods available</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.productId && <p className="text-xs text-destructive pt-1">{errors.productId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Raw Material Items</Label>
            {errors.items?.root && <p className="text-xs text-destructive pt-1">{errors.items.root.message}</p>}
            {errors.items && !errors.items.root && <p className="text-xs text-destructive pt-1">Please correct errors in raw material items.</p>}

            <div className="space-y-3 max-h-[calc(90vh-450px)] sm:max-h-[calc(90vh-400px)] overflow-y-auto pr-1 border rounded-md p-3 bg-muted/20 shadow-inner">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-end gap-2 p-3 border rounded-md bg-card shadow-sm">
                  <div className="flex-grow w-full space-y-1">
                    <Label htmlFor={`items.${index}.rawMaterialId`} className="text-xs">Raw Material</Label>
                    <Controller
                      name={`items.${index}.rawMaterialId`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <Select onValueChange={controllerField.onChange} value={controllerField.value}>
                          <SelectTrigger id={`items.${index}.rawMaterialId`} className="h-9">
                            <SelectValue placeholder="Select raw material" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterials.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (SKU: {product.sku})
                              </SelectItem>
                            ))}
                             {rawMaterials.length === 0 && <SelectItem value="none" disabled>No raw materials available</SelectItem>}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.items?.[index]?.rawMaterialId && <p className="text-xs text-destructive pt-1">{errors.items?.[index]?.rawMaterialId?.message}</p>}
                  </div>
                  <div className="w-full sm:w-[120px] space-y-1">
                    <Label htmlFor={`items.${index}.quantityNeeded`} className="text-xs">Quantity Needed</Label>
                    <Controller
                      name={`items.${index}.quantityNeeded`}
                      control={control}
                      render={({ field: controllerField }) => <Input id={`items.${index}.quantityNeeded`} type="number" step="0.01" {...controllerField} className="h-9" />}
                    />
                     {errors.items?.[index]?.quantityNeeded && <p className="text-xs text-destructive pt-1">{errors.items?.[index]?.quantityNeeded?.message}</p>}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => fields.length > 1 ? remove(index) : toast({title: "Cannot Remove", description: "At least one raw material item is required.", variant:"destructive"})} 
                    className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0 mt-2 sm:mt-0 self-end sm:self-auto" 
                    title="Remove Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={() => append({ rawMaterialId: '', quantityNeeded: 1 })} className="w-full sm:w-auto text-sm mt-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Raw Material Item
            </Button>
          </div>

          <DialogFooter className="sm:justify-end gap-2 pt-4 border-t mt-auto">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{existingBom ? "Update BOM" : "Add BOM"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    
