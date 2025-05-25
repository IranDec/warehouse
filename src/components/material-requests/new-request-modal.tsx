
// src/components/material-requests/new-request-modal.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
import { DatePicker } from "@/components/common/date-picker"; // Assuming you have a single date picker
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, PackagePlus } from 'lucide-react';
import type { RequestedItem, User, MaterialRequest, Product } from '@/lib/types';
import { MOCK_PRODUCTS } from '@/lib/constants'; // For product selection
import { useToast } from '@/hooks/use-toast';
import { addDays, format, parseISO } from 'date-fns';

interface NewMaterialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    items: RequestedItem[];
    reasonForRequest: string;
    requestedDate: string;
  }) => void;
  currentUser: User;
  existingRequest?: MaterialRequest | null;
}

const defaultNewItem: RequestedItem = { productId: '', productName: '', quantity: 1 };

export function NewMaterialRequestModal({ isOpen, onClose, onSubmit, currentUser, existingRequest }: NewMaterialRequestModalProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<RequestedItem[]>([defaultNewItem]);
  const [reasonForRequest, setReasonForRequest] = useState('');
  const [requestedDate, setRequestedDate] = useState<Date | undefined>(addDays(new Date(), 7));

  const availableProducts = useMemo(() => {
    if (currentUser.role === 'DepartmentEmployee' && currentUser.categoryAccess) {
      return MOCK_PRODUCTS.filter(p => p.category === currentUser.categoryAccess && p.status !== 'Out of Stock' && p.status !== 'Damaged');
    }
    return MOCK_PRODUCTS.filter(p => p.status !== 'Out of Stock' && p.status !== 'Damaged'); // Should not happen for employee
  }, [currentUser]);

  useEffect(() => {
    if (existingRequest) {
      setItems(existingRequest.items.map(item => ({...item}))); // Deep copy
      setReasonForRequest(existingRequest.reasonForRequest);
      setRequestedDate(parseISO(existingRequest.requestedDate));
    } else {
      // Reset form for new request
      setItems([{ productId: '', productName: '', quantity: 1 }]);
      setReasonForRequest('');
      setRequestedDate(addDays(new Date(), 7));
    }
  }, [existingRequest, isOpen]);


  const handleItemChange = (index: number, field: keyof RequestedItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = availableProducts.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: String(value),
        productName: product ? product.name : '',
      };
    } else if (field === 'quantity') {
       newItems[index] = { ...newItems[index], quantity: Math.max(1, Number(value)) }; // Ensure quantity is at least 1
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    } else {
      toast({ title: "Cannot Remove", description: "At least one item is required in a request.", variant: "destructive" });
    }
  };

  const handleSubmit = () => {
    if (items.some(item => !item.productId || item.quantity <= 0)) {
      toast({ title: "Invalid Items", description: "Please select a product and specify a valid quantity for all items.", variant: "destructive" });
      return;
    }
    if (!reasonForRequest.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for your request.", variant: "destructive" });
      return;
    }
    if (!requestedDate) {
      toast({ title: "Date Required", description: "Please select a date when materials are needed.", variant: "destructive" });
      return;
    }

    onSubmit({
      items: items.map(item => ({ productId: item.productId, productName: item.productName, quantity: item.quantity })),
      reasonForRequest,
      requestedDate: format(requestedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), // ISO string
    });
    onClose(); // Close modal after submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{existingRequest ? 'Edit Material Request' : 'New Material Request'}</DialogTitle>
          <DialogDescription>
            {existingRequest ? 'Update the details of your material request.' : 'Fill in the details below to request materials for your department.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-grow overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Requested Items</Label>
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-end gap-2 p-3 border rounded-md bg-muted/30">
                <div className="space-y-1 flex-grow w-full sm:w-auto">
                  <Label htmlFor={`product-${index}`} className="text-xs">Product</Label>
                  <Select
                    value={item.productId}
                    onValueChange={(value) => handleItemChange(index, 'productId', value)}

                  >
                    <SelectTrigger id={`product-${index}`}>
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.length === 0 && <SelectItem value="no-products" disabled>No products available for your department</SelectItem>}
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (SKU: {product.sku}) - Stock: {product.quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-full sm:w-[100px]">
                  <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10))}
                    min="1"
                    className="h-9"
                  />
                </div>
                {items.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={handleAddItem} className="w-full sm:w-auto text-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Item
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasonForRequest">Reason for Request</Label>
            <Textarea
              id="reasonForRequest"
              value={reasonForRequest}
              onChange={(e) => setReasonForRequest(e.target.value)}
              placeholder="e.g., For upcoming Project X, Stock replenishment for production line B..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedDate">Date Needed By</Label>
            <DatePicker
              date={requestedDate}
              onDateChange={setRequestedDate}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit}>
            {existingRequest ? 'Update Request' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
