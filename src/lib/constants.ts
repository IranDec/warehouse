
import type { Product, InventoryTransaction, NavItem, Category, Warehouse, User, UserRole, MaterialRequest, MaterialRequestStatus, BillOfMaterial, NotificationSetting } from './types';
import { Home, Package, ListOrdered, Settings, Boxes, BarChart3, FileText, UploadCloud, Users, ClipboardList } from 'lucide-react';

export const APP_NAME = 'Warehouse Edge';
export const ALL_FILTER_VALUE = "__ALL__";

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/inventory', label: 'Inventory Ledger', icon: ListOrdered },
  { href: '/material-requests', label: 'Material Requests', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'wh1', name: 'Main Warehouse', location: 'Building A' },
  { id: 'wh2', name: 'Textile Storage', location: 'Building B, Section 2' },
  { id: 'wh3', name: 'Metalworks Bay', location: 'Building C' },
  { id: 'wh4', name: 'Shipping Hub', location: 'Building A, Dock 5' },
  { id: 'wh5', name: 'Cold Storage', location: 'Building D' },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Electronics', description: 'Electronic components and devices.' },
  { id: 'cat2', name: 'Raw Materials', description: 'Materials used in production.' },
  { id: 'cat3', name: 'Finished Goods', description: 'Products ready for sale.' },
  { id: 'cat4', name: 'Office Supplies', description: 'Items for office use.' },
  { id: 'cat5', name: 'Perishables', description: 'Goods with limited shelf life.' },
  { id: 'cat6', name: 'Hardware Components', description: 'Small hardware parts like screws, bolts.' },
  { id: 'cat7', name: 'Plastic Components', description: 'Molded plastic parts.'},
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Alpha-Core Processor',
    sku: 'AC-P-001',
    category: 'Electronics',
    quantity: 150,
    reorderLevel: 50,
    warehouseId: 'wh1',
    status: 'Available',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'High-performance processor for advanced computing.',
  },
  {
    id: 'prod2',
    name: 'Beta-Series RAM Module (16GB)',
    sku: 'BS-RM-016',
    category: 'Electronics',
    quantity: 35,
    reorderLevel: 25,
    warehouseId: 'wh1',
    status: 'Low Stock',
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: '16GB DDR5 RAM module for desktops.',
  },
  {
    id: 'prod3',
    name: 'Gamma Fabric Roll (Blue)',
    sku: 'GF-R-BLU',
    category: 'Raw Materials',
    quantity: 0,
    reorderLevel: 100,
    warehouseId: 'wh2',
    status: 'Out of Stock',
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'High-quality blue fabric for apparel manufacturing.',
  },
  {
    id: 'prod4',
    name: 'Delta-Grade Steel Plate',
    sku: 'DG-SP-005',
    category: 'Raw Materials',
    quantity: 5,
    reorderLevel: 10,
    warehouseId: 'wh3',
    status: 'Damaged',
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: '5mm thick steel plates, some reported as bent.',
  },
  {
    id: 'prod5',
    name: 'Standard Assembled Widget', // Was Epsilon Finished Widget
    sku: 'SAW-001', // Was EFW-001
    category: 'Finished Goods',
    quantity: 500,
    reorderLevel: 100,
    warehouseId: 'wh4',
    status: 'Available',
    lastUpdated: new Date().toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'Standard widget, assembled and packaged.',
  },
  {
    id: 'prod6',
    name: 'Organic Apples',
    sku: 'ORG-APP-001',
    category: 'Perishables',
    quantity: 200,
    reorderLevel: 50,
    warehouseId: 'wh5',
    status: 'Available',
    lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'Fresh organic apples, requires temperature control.',
  },
  {
    id: 'prod7',
    name: 'M3 Screw Pack (100 units)',
    sku: 'HW-SCR-M3-100',
    category: 'Hardware Components', // Raw Material for BOM
    quantity: 1000,
    reorderLevel: 200,
    warehouseId: 'wh3',
    status: 'Available',
    lastUpdated: new Date().toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'Pack of 100 M3 screws.',
  },
  {
    id: 'prod8',
    name: 'Standard Plastic Casing',
    sku: 'PL-CAS-STD-01',
    category: 'Plastic Components', // Raw Material for BOM
    quantity: 300,
    reorderLevel: 50,
    warehouseId: 'wh1',
    status: 'Available',
    lastUpdated: new Date().toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'Standard plastic casing for small devices.',
  },
  {
    id: 'prod9',
    name: 'Advanced Gadget X',
    sku: 'FG-ADVGX-001',
    category: 'Finished Goods',
    quantity: 75,
    reorderLevel: 20,
    warehouseId: 'wh4',
    status: 'Available',
    lastUpdated: new Date().toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'Deluxe assembled gadget with multiple components.',
  }
];

export const MOCK_INVENTORY_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 'txn1',
    productId: 'prod1',
    productName: 'Alpha-Core Processor',
    type: 'Inflow',
    quantityChange: 100,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Supplier XYZ',
    reason: 'New Stock Arrival',
    warehouseId: 'wh1',
    warehouseName: 'Main Warehouse',
  },
  {
    id: 'txn2',
    productId: 'prod2',
    productName: 'Beta-Series RAM Module (16GB)',
    type: 'Initial',
    quantityChange: 50,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'System',
    reason: 'Initial system setup',
    warehouseId: 'wh1',
    warehouseName: 'Main Warehouse',
  },
  {
    id: 'txn3',
    productId: 'prod1',
    productName: 'Alpha-Core Processor',
    type: 'Outflow',
    quantityChange: -20,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Assembly Line A',
    reason: 'Production Order #123',
    warehouseId: 'wh1',
    warehouseName: 'Main Warehouse',
  },
  {
    id: 'txn4',
    productId: 'prod3',
    productName: 'Gamma Fabric Roll (Blue)',
    type: 'Damage',
    quantityChange: -5,
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Warehouse Inspection',
    reason: 'Water damage',
    warehouseId: 'wh2',
    warehouseName: 'Textile Storage',
  },
  {
    id: 'txn5',
    productId: 'prod5', // Standard Assembled Widget
    productName: 'Standard Assembled Widget',
    type: 'Inflow',
    quantityChange: 200,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Production Line B',
    reason: 'New batch completed',
    warehouseId: 'wh4',
    warehouseName: 'Shipping Hub',
  },
  {
    id: 'txn6',
    productId: 'prod2',
    productName: 'Beta-Series RAM Module (16GB)',
    type: 'Outflow',
    quantityChange: -15,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Sales Order #SO456',
    reason: 'Customer Sale',
    warehouseId: 'wh1',
    warehouseName: 'Main Warehouse',
  },
  {
    id: 'txn7',
    productId: 'prod6',
    productName: 'Organic Apples',
    type: 'Inflow',
    quantityChange: 250,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Farm Fresh Deliveries',
    reason: 'Weekly shipment',
    warehouseId: 'wh5',
    warehouseName: 'Cold Storage',
  },
  {
    id: 'txn8',
    productId: 'prod6',
    productName: 'Organic Apples',
    type: 'Outflow',
    quantityChange: -50,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Local Market Stall',
    reason: 'Daily sale',
    warehouseId: 'wh5',
    warehouseName: 'Cold Storage',
  },
];

export const PRODUCT_STATUS_OPTIONS: { value: Product['status']; label: string }[] = [
  { value: 'Available', label: 'Available' },
  { value: 'Low Stock', label: 'Low Stock' },
  { value: 'Out of Stock', label: 'Out of Stock' },
  { value: 'Damaged', label: 'Damaged' },
];

export const USER_ROLES: UserRole[] = ['Admin', 'WarehouseManager', 'DepartmentEmployee'];

export const MOCK_USERS: User[] = [
  { id: 'user1', name: 'Alice Admin', email: 'admin@example.com', role: 'Admin', avatarFallback: 'AA' },
  { id: 'user2', name: 'Bob Manager', email: 'manager@example.com', role: 'WarehouseManager', avatarFallback: 'BM' },
  { id: 'user3', name: 'Charlie Tech', email: 'charlie@example.com', role: 'DepartmentEmployee', categoryAccess: 'Electronics', avatarFallback: 'CT' },
  { id: 'user4', name: 'Diana Fabric', email: 'diana@example.com', role: 'DepartmentEmployee', categoryAccess: 'Raw Materials', avatarFallback: 'DF' },
  { id: 'user5', name: 'Edward Goods', email: 'edward@example.com', role: 'DepartmentEmployee', categoryAccess: 'Finished Goods', avatarFallback: 'EG' },
  { id: 'user6', name: 'Fiona Food', email: 'fiona@example.com', role: 'DepartmentEmployee', categoryAccess: 'Perishables', avatarFallback: 'FF' },
];

export const DEFAULT_CURRENT_USER_ID = MOCK_USERS.find(u => u.role === 'Admin')?.id || MOCK_USERS[0]?.id || 'user1';

export const MATERIAL_REQUEST_STATUS_OPTIONS: { value: MaterialRequestStatus; label: string }[] = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export const MOCK_MATERIAL_REQUESTS: MaterialRequest[] = [
  {
    id: 'mr001',
    requesterId: 'user3', // Charlie Tech
    requesterName: 'Charlie Tech',
    departmentCategory: 'Electronics',
    items: [{ productId: 'prod1', productName: 'Alpha-Core Processor', quantity: 20 }],
    reasonForRequest: 'Project Tesla - Phase 1',
    requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    submissionDate: new Date().toISOString(),
  },
  {
    id: 'mr002',
    requesterId: 'user4', // Diana Fabric
    requesterName: 'Diana Fabric',
    departmentCategory: 'Raw Materials',
    items: [{ productId: 'prod3', productName: 'Gamma Fabric Roll (Blue)', quantity: 5 }],
    reasonForRequest: 'New clothing line samples',
    requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Approved',
    submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    approverId: 'user2', // Bob Manager
    approverName: 'Bob Manager',
    actionDate: new Date().toISOString(),
  },
  {
    id: 'mr003',
    requesterId: 'user3', // Charlie Tech
    requesterName: 'Charlie Tech',
    departmentCategory: 'Electronics',
    items: [{ productId: 'prod2', productName: 'Beta-Series RAM Module (16GB)', quantity: 50 }],
    reasonForRequest: 'Urgent restock for server maintenance',
    requestedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Rejected',
    submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    approverId: 'user2', // Bob Manager
    approverName: 'Bob Manager',
    approverNotes: 'Stock level too low for this quantity. Please request a smaller amount or wait for restock.',
    actionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];


export const MOCK_BOM_CONFIGURATIONS: BillOfMaterial[] = [
  {
    productId: 'prod5', // Standard Assembled Widget
    productName: 'Standard Assembled Widget',
    items: [
      { rawMaterialId: 'prod7', rawMaterialName: 'M3 Screw Pack (100 units)', quantityNeeded: 5 }, // Needs 5 screws
      { rawMaterialId: 'prod8', rawMaterialName: 'Standard Plastic Casing', quantityNeeded: 1 }, // Needs 1 casing
      { rawMaterialId: 'prod1', rawMaterialName: 'Alpha-Core Processor', quantityNeeded: 1 } // Needs 1 processor
    ]
  },
  {
    productId: 'prod9', // Advanced Gadget X
    productName: 'Advanced Gadget X',
    items: [
      { rawMaterialId: 'prod1', rawMaterialName: 'Alpha-Core Processor', quantityNeeded: 2 },
      { rawMaterialId: 'prod2', rawMaterialName: 'Beta-Series RAM Module (16GB)', quantityNeeded: 1 },
      { rawMaterialId: 'prod7', rawMaterialName: 'M3 Screw Pack (100 units)', quantityNeeded: 10 },
      { rawMaterialId: 'prod8', rawMaterialName: 'Standard Plastic Casing', quantityNeeded: 1 }
    ]
  }
];

export const MOCK_NOTIFICATION_SETTINGS: NotificationSetting[] = [
    { id: 'notif1', productId: 'prod1', productName: 'Alpha-Core Processor', threshold: 55, recipient: 'manager@example.com', channel: 'email', isEnabled: true },
    { id: 'notif2', productId: 'prod2', productName: 'Beta-Series RAM Module (16GB)', threshold: 30, recipient: 'admin@example.com', channel: 'in-app', isEnabled: true },
    { id: 'notif3', productId: 'prod7', productName: 'M3 Screw Pack (100 units)', threshold: 250, recipient: 'supervisor_hw@example.com', channel: 'email', isEnabled: false },
];
