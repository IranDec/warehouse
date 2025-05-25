
// src/components/settings/new-edit-warehouse-modal.tsx
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
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Warehouse } from '@/lib/types';

const warehouseFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Warehouse name is required"),
  location: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseFormSchema>;

interface NewEditWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingWarehouse?: Warehouse | null;
}

export function NewEditWarehouseModal({ isOpen, onClose, existingWarehouse }: NewEditWarehouseModalProps) {
  const { addWarehouse, updateWarehouse } = useAuth();
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: '',
      location: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (existingWarehouse) {
        reset({
          id: existingWarehouse.id,
          name: existingWarehouse.name,
          location: existingWarehouse.location || '',
        });
      } else {
        reset({
          name: '',
          location: '',
        });
      }
    }
  }, [isOpen, existingWarehouse, reset]);

  const onSubmitHandler = (data: WarehouseFormData) => {
    if (existingWarehouse) {
      updateWarehouse({ ...existingWarehouse, ...data });
      toast({ title: "Warehouse Updated", description: `${data.name} has been updated.` });
    } else {
      addWarehouse(data);
      toast({ title: "Warehouse Added", description: `${data.name} has been added.` });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
          <DialogDescription>
            {existingWarehouse ? "Update the details of this warehouse." : "Fill in the details for the new warehouse."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="warehouse-name">Warehouse Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="warehouse-name" {...field} placeholder="e.g., Main Storage" />}
            />
            {errors.name && <p className="text-xs text-destructive pt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="warehouse-location">Location (Optional)</Label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => <Input id="warehouse-location" {...field} placeholder="e.g., Building A, Section 3" />}
            />
            {errors.location && <p className="text-xs text-destructive pt-1">{errors.location.message}</p>}
          </div>
          <DialogFooter className="sm:justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{existingWarehouse ? "Update Warehouse" : "Add Warehouse"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
