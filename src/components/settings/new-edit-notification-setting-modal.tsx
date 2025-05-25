
// src/components/settings/new-edit-notification-setting-modal.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
// import { useAuth } from '@/contexts/auth-context'; // No longer needed directly
import { useToast } from '@/hooks/use-toast';
import type { NotificationSetting, NotificationChannel, Product } from '@/lib/types';
import { NOTIFICATION_CHANNELS } from '@/lib/types'; 
import { MOCK_PRODUCTS } from '@/lib/constants'; 

const notificationSettingSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  productName: z.string().optional(), // To store product name for display
  threshold: z.coerce.number().min(0, "Threshold must be a non-negative number"),
  recipient: z.string().min(1, "Recipient is required (e.g., email, role)"),
  channel: z.enum(NOTIFICATION_CHANNELS as [NotificationChannel, ...NotificationChannel[]], {
    required_error: "Channel is required",
  }),
  isEnabled: z.boolean().default(true),
});

type NotificationSettingFormData = z.infer<typeof notificationSettingSchema>;

interface NewEditNotificationSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSetting?: NotificationSetting | null;
  addNotificationSetting: (data: Omit<NotificationSetting, 'id'>) => void; // Passed from SettingsPage
  updateNotificationSetting: (data: NotificationSetting) => void; // Passed from SettingsPage
}

export function NewEditNotificationSettingModal({ 
    isOpen, 
    onClose, 
    existingSetting,
    addNotificationSetting,
    updateNotificationSetting
}: NewEditNotificationSettingModalProps) {
  const { toast } = useToast();
  const products: Product[] = MOCK_PRODUCTS; 

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<NotificationSettingFormData>({
    resolver: zodResolver(notificationSettingSchema),
    defaultValues: {
      productId: '',
      productName: '',
      threshold: 10,
      recipient: '',
      channel: 'email',
      isEnabled: true,
    },
  });

  const watchedProductId = watch("productId");

  useEffect(() => {
    if (isOpen) {
      if (existingSetting) {
        reset({
          id: existingSetting.id,
          productId: existingSetting.productId,
          productName: existingSetting.productName || products.find(p => p.id === existingSetting.productId)?.name || '',
          threshold: existingSetting.threshold,
          recipient: existingSetting.recipient,
          channel: existingSetting.channel,
          isEnabled: existingSetting.isEnabled,
        });
      } else {
        reset({
          productId: '',
          productName: '',
          threshold: 10,
          recipient: '',
          channel: 'email',
          isEnabled: true,
        });
      }
    }
  }, [isOpen, existingSetting, reset, products]);

  useEffect(() => {
    if (watchedProductId) {
      const selectedProduct = products.find(p => p.id === watchedProductId);
      setValue("productName", selectedProduct?.name || '');
    } else {
        setValue("productName", '');
    }
  }, [watchedProductId, products, setValue]);

  const onSubmitHandler = (data: NotificationSettingFormData) => {
    const product = products.find(p => p.id === data.productId);
    const settingToSave: Omit<NotificationSetting, 'id'> & { id?: string } = {
      ...data,
      productName: product?.name || data.productId, 
    };

    if (existingSetting) {
      updateNotificationSetting({ ...existingSetting, ...settingToSave, id: existingSetting.id });
      toast({ title: "Notification Setting Updated", description: `Rule for ${settingToSave.productName} updated.` });
    } else {
      const {id, ...settingToAdd} = settingToSave; // remove id if present for new settings
      addNotificationSetting(settingToAdd as Omit<NotificationSetting, 'id'>);
      toast({ title: "Notification Setting Added", description: `New rule for ${settingToSave.productName} added.` });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{existingSetting ? "Edit Notification Rule" : "Add New Notification Rule"}</DialogTitle>
          <DialogDescription>
            Configure when and how to be notified for low stock alerts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4 py-4 flex-grow overflow-y-auto pr-2">
          <div>
            <Label htmlFor="productId">Product</Label>
            <Controller
              name="productId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="productId">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (SKU: {product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.productId && <p className="text-xs text-destructive pt-1">{errors.productId.message}</p>}
          </div>

          <div>
            <Label htmlFor="threshold">Low Stock Threshold</Label>
            <Controller
              name="threshold"
              control={control}
              render={({ field }) => <Input id="threshold" type="number" {...field} placeholder="e.g., 50" />}
            />
            {errors.threshold && <p className="text-xs text-destructive pt-1">{errors.threshold.message}</p>}
          </div>

          <div>
            <Label htmlFor="recipient">Recipient</Label>
            <Controller
              name="recipient"
              control={control}
              render={({ field }) => <Input id="recipient" {...field} placeholder="e.g., manager@example.com or 'WarehouseManager' role" />}
            />
            {errors.recipient && <p className="text-xs text-destructive pt-1">{errors.recipient.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="channel">Notification Channel</Label>
            <Controller
              name="channel"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_CHANNELS.map(channel => (
                      <SelectItem key={channel} value={channel} className="capitalize">
                        {channel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.channel && <p className="text-xs text-destructive pt-1">{errors.channel.message}</p>}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="isEnabled"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isEnabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isEnabled" className="cursor-pointer">Enable this notification rule</Label>
            {errors.isEnabled && <p className="text-xs text-destructive pt-1">{errors.isEnabled.message}</p>}
          </div>


          <DialogFooter className="sm:justify-end gap-2 pt-4 border-t mt-auto">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{existingSetting ? "Update Rule" : "Add Rule"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

