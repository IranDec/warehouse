
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
  managedCategoryIds?: string[]; // New field: IDs of categories managed by this warehouse
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
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
  warehouseId?: string;
  warehouseName?: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  children?: NavItem[];
}

export interface BillOfMaterialItem {
  rawMaterialId: string; // ID of the raw material product
  rawMaterialName?: string; // Optional: Name for easier display
  quantityNeeded: number;
}

export interface BillOfMaterial {
  productId: string; // Finished product ID
  productName?: string; // Optional: Name for easier display
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

// Material Request Types
export type MaterialRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';

export interface RequestedItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface MaterialRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  departmentCategory: string; // e.g., Electronics, Raw Materials
  items: RequestedItem[];
  reasonForRequest: string; // Reason for needing the materials
  requestedDate: string; // ISO date string for when materials are needed
  status: MaterialRequestStatus;
  submissionDate: string; // ISO date string when request was submitted
  approverId?: string; // User ID of Admin/Manager who actioned
  approverName?: string;
  approverNotes?: string; // Notes from approver (e.g., reason for rejection)
  actionDate?: string; // ISO date string of approval/rejection
}

// Notification System Types
export type NotificationChannel = 'email' | 'sms' | 'in-app';
export const NOTIFICATION_CHANNELS: NotificationChannel[] = ['email', 'sms', 'in-app'];


export interface NotificationSetting {
  id: string;
  productId: string;
  productName?: string;
  threshold: number;
  recipient: string; // e.g., email address or user ID
  channel: NotificationChannel;
  isEnabled: boolean;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string; // ISO date string
  details?: string; // e.g., Product ID, Request ID
}

