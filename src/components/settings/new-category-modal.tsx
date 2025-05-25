// src/components/settings/new-category-modal.tsx
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
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/lib/types';

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewCategoryModal({ isOpen, onClose }: NewCategoryModalProps) {
  const { addCategory } = useAuth();
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmitHandler = (data: CategoryFormData) => {
    addCategory(data);
    toast({ title: "Category Added", description: `${data.name} has been added.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Fill in the details for the new product category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="category-name">Category Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="category-name" {...field} placeholder="e.g., Electronics, Textiles" />}
            />
            {errors.name && <p className="text-xs text-destructive pt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="category-description">Description (Optional)</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Textarea id="category-description" {...field} placeholder="e.g., Components for electronic devices" rows={3} />}
            />
            {errors.description && <p className="text-xs text-destructive pt-1">{errors.description.message}</p>}
          </div>
          <DialogFooter className="sm:justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add Category</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
