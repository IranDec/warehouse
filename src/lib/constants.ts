import type { Product, InventoryTransaction, NavItem, Category } from './types';
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

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Electronics', description: 'Electronic components and devices.' },
  { id: 'cat2', name: 'Raw Materials', description: 'Materials used in production.' },
  { id: 'cat3', name: 'Finished Goods', description: 'Products ready for sale.' },
  { id: 'cat4', name: 'Office Supplies', description: 'Items for office use.' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Alpha-Core Processor',
    sku: 'AC-P-001',
    category: 'Electronics',
    quantity: 150,
    reorderLevel: 50,
    warehouse: 'Main Warehouse',
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
    warehouse: 'Main Warehouse',
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
    warehouse: 'Textile Storage',
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
    warehouse: 'Metalworks Bay',
    status: 'Damaged', // Example of damaged status
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
    warehouse: 'Shipping Hub',
    status: 'Available',
    lastUpdated: new Date().toISOString(),
    imageUrl: 'https://placehold.co/100x100.png',
    description: 'Standard widget, assembled and packaged.',
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
  },
];

export const PRODUCT_STATUS_OPTIONS: { value: Product['status']; label: string }[] = [
  { value: 'Available', label: 'Available' },
  { value: 'Low Stock', label: 'Low Stock' },
  { value: 'Out of Stock', label: 'Out of Stock' },
  { value: 'Damaged', label: 'Damaged' },
];
