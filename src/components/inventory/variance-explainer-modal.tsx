// src/components/inventory/variance-explainer-modal.tsx
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, HelpCircle, Sparkles } from 'lucide-react';
import { explainInventoryVariance, ExplainInventoryVarianceInput } from '@/ai/flows/explain-variance';
import { useToast } from '@/hooks/use-toast';

interface VarianceExplainerModalProps {
  triggerButton?: React.ReactNode; // Optional custom trigger
}

export function VarianceExplainerModal({ triggerButton }: VarianceExplainerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState('');
  const [actualQuantity, setActualQuantity] = useState('');
  const [recentTransactions, setRecentTransactions] = useState('');
  
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!itemName || !expectedQuantity || !actualQuantity) {
      toast({ title: "Missing Fields", description: "Item name, expected, and actual quantities are required.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setAiExplanation('');

    try {
      const input: ExplainInventoryVarianceInput = {
        itemName,
        expectedQuantity: parseFloat(expectedQuantity),
        actualQuantity: parseFloat(actualQuantity),
        date: new Date().toISOString(), // Use current date
        recentTransactions: recentTransactions || "No recent transactions provided.",
      };
      const result = await explainInventoryVariance(input);
      setAiExplanation(result.explanation);
    } catch (error) {
      console.error("Error generating variance explanation:", error);
      toast({ title: "AI Error", description: "Failed to generate variance explanation.", variant: "destructive" });
      setAiExplanation("Could not generate explanation at this time.");
    } finally {
      setIsGenerating(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline">
      <HelpCircle className="mr-2 h-4 w-4" />
      Explain Variance (AI)
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Explain Inventory Variance</DialogTitle>
          <DialogDescription>
            Enter the details below and let AI help you understand the possible reasons for inventory discrepancies.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Alpha-Core Processor" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected-quantity">Expected Quantity</Label>
              <Input id="expected-quantity" type="number" value={expectedQuantity} onChange={(e) => setExpectedQuantity(e.target.value)} placeholder="e.g., 100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual-quantity">Actual Quantity</Label>
              <Input id="actual-quantity" type="number" value={actualQuantity} onChange={(e) => setActualQuantity(e.target.value)} placeholder="e.g., 95" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recent-transactions">Recent Transactions (Optional)</Label>
            <Textarea 
              id="recent-transactions" 
              value={recentTransactions} 
              onChange={(e) => setRecentTransactions(e.target.value)} 
              placeholder="List any relevant recent transactions, e.g., SO#123 shipped 5 units, PO#456 received 10 units..."
              rows={4}
            />
          </div>
          
          {aiExplanation && (
            <div className="p-3 bg-muted/50 border rounded-md space-y-1">
              <Label className="font-semibold text-primary flex items-center gap-1"><Sparkles className="h-4 w-4"/>AI Explanation:</Label>
              <p className="text-sm whitespace-pre-wrap">{aiExplanation}</p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Explanation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
