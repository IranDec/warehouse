import type { LucideIcon } from 'lucide-react';

export type ProductStatus = 'Available' | 'Low Stock' | 'Out of Stock' | 'Damaged';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string; // Category Name, ideally should be Category ID
  quantity: number;
  reorderLevel: number;
  warehouseId: string; 
  status: ProductStatus;
  lastUpdated: string; // ISO date string
  imageUrl?: string;
  description?: string;
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
  warehouseId?: string; // Optional: ID of the warehouse for this transaction
  warehouseName?: string; // Optional: Name of the warehouse, denormalized for easier display
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

// RBAC Types
export type UserRole = 'Admin' | 'WarehouseManager' | 'DepartmentEmployee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarFallback: string;
  categoryAccess?: string; // For DepartmentEmployee: limits access to products of this category
}
