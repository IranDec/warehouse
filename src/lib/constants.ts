import type { Product, InventoryTransaction, NavItem, Category, Warehouse } from './types';
import { Home, Package, ListOrdered, Settings, Boxes, BarChart3, FileText, UploadCloud, Users } from 'lucide-react';

export const APP_NAME = 'Warehouse Edge';

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: ListOrdered },
  // { href: '/reports', label: 'Reports', icon: BarChart3 },
  // { href: '/import', label: 'Import/Export', icon: UploadCloud },
  // { href: '/users', label: 'User Management', icon: Users },
  // { href: '/categories', label: 'Categories', icon: Boxes },
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
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Alpha-Core Processor',
    sku: 'AC-P-001',
    category: 'Electronics',
    quantity: 150,
    reorderLevel: 50,
    warehouseId: 'wh1', // Main Warehouse
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
    warehouseId: 'wh1', // Main Warehouse
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
    reorderLevel: 100, // meters
    warehouseId: 'wh2', // Textile Storage
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
    quantity: 5, // plates
    reorderLevel: 10,
    warehouseId: 'wh3', // Metalworks Bay
    status: 'Damaged',
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: '5mm thick steel plates, some reported as bent.',
  },
  {
    id: 'prod5',
    name: 'Epsilon Finished Widget',
    sku: 'EFW-001',
    category: 'Finished Goods',
    quantity: 500,
    reorderLevel: 100,
    warehouseId: 'wh4', // Shipping Hub
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
    quantity: 200, // kg
    reorderLevel: 50,
    warehouseId: 'wh5', // Cold Storage
    status: 'Available',
    lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'Fresh organic apples, requires temperature control.',
  },
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
    quantityChange: -5, // meters
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Warehouse Inspection',
    reason: 'Water damage',
    warehouseId: 'wh2',
    warehouseName: 'Textile Storage',
  },
  {
    id: 'txn5',
    productId: 'prod5',
    productName: 'Epsilon Finished Widget',
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

export const ALL_FILTER_VALUE = "__ALL__"; // Added for consistency
