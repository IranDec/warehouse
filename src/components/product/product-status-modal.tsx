// src/components/product/product-status-modal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea'; // Using textarea for description
import { Loader2, Sparkles } from 'lucide-react';
import type { Product, ProductStatus } from '@/lib/types';
import { PRODUCT_STATUS_OPTIONS } from '@/lib/constants';
import { explainProductStatus, ExplainProductStatusInput } from '@/ai/flows/explain-product-status';
import { useToast } from '@/hooks/use-toast';

interface ProductStatusModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, newStatus: ProductStatus, newDescription?: string) => void; // Simulate save
}

export function ProductStatusModal({ product, isOpen, onClose, onSave }: ProductStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | undefined>(undefined);
  const [productDescription, setProductDescription] = useState<string>('');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setSelectedStatus(product.status);
      setProductDescription(product.description || '');
      setAiExplanation(''); // Clear previous explanation
    }
  }, [product]);

  const handleGenerateExplanation = async () => {
    if (!selectedStatus) {
      toast({ title: "Status required", description: "Please select a status first.", variant: "destructive" });
      return;
    }
    setIsGeneratingExplanation(true);
    setAiExplanation('');
    try {
      const input: ExplainProductStatusInput = {
        status: selectedStatus,
        description: productDescription || product?.name || 'the product', // Use product name if description is empty
      };
      const result = await explainProductStatus(input);
      setAiExplanation(result.explanation);
    } catch (error) {
      console.error("Error generating explanation:", error);
      toast({ title: "AI Error", description: "Failed to generate explanation.", variant: "destructive" });
      setAiExplanation("Could not generate explanation at this time.");
    } finally {
      setIsGeneratingExplanation(false);
    }
  };

  const handleSave = () => {
    if (product && selectedStatus) {
      onSave(product.id, selectedStatus, productDescription);
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Status for: {product.name}</DialogTitle>
          <DialogDescription>
            Change the product status and optionally provide a description.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product-status">Product Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as ProductStatus)}
            >
              <SelectTrigger id="product-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-description">Product Description (Optional)</Label>
            <Textarea
              id="product-description"
              placeholder="Enter a brief description of the product or its current condition..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <Button onClick={handleGenerateExplanation} disabled={isGeneratingExplanation || !selectedStatus} variant="outline" className="w-full">
            {isGeneratingExplanation ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Explain Status (AI)
          </Button>

          {aiExplanation && (
            <div className="p-3 bg-muted/50 border rounded-md">
              <Label className="font-semibold text-primary">AI Explanation:</Label>
              <p className="text-sm mt-1">{aiExplanation}</p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!selectedStatus}>
            Save Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
