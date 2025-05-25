import type { LucideIcon } from 'lucide-react';

export type ProductStatus = 'Available' | 'Low Stock' | 'Out of Stock' | 'Damaged';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string; // Category ID or name
  quantity: number;
  reorderLevel: number;
  warehouse: string; // Warehouse ID or name
  status: ProductStatus;
  lastUpdated: string; // ISO date string
  imageUrl?: string;
  description?: string; // Added for 'explainProductStatus'
}

export type InventoryTransactionType = 'Inflow' | 'Outflow' | 'Return' | 'Damage' | 'Adjustment' | 'Initial';

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string; 
  type: InventoryTransactionType;
  quantityChange: number; // Positive for inflow/return/initial, negative for outflow/damage
  reason?: string;
  date: string; // ISO date string
  user: string; // User who performed the transaction or system
  notes?: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  children?: NavItem[];
}

export interface BillOfMaterialItem {
  rawMaterialId: string;
  quantityNeeded: number;
}

export interface BillOfMaterial {
  productId: string; // Finished product ID
  items: BillOfMaterialItem[];
}
