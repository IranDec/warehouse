
// src/app/settings/page.tsx
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Settings as SettingsIcon, Bell, Users, Database, Palette, Globe, Edit2, FileJson, MessageSquareWarning, Warehouse as WarehouseIcon, UserPlus, Tag, Edit, PlusCircle, Trash2, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import type { User, UserRole, Warehouse, Category, NotificationSetting, BillOfMaterial, BillOfMaterialItem } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { NewUserModal } from "@/components/settings/new-user-modal";
import { NewCategoryModal } from "@/components/settings/new-category-modal";
import { NewEditWarehouseModal } from "@/components/settings/new-edit-warehouse-modal";
import { NewEditNotificationSettingModal } from "@/components/settings/new-edit-notification-setting-modal";
import { NewEditBomModal } from "@/components/settings/new-edit-bom-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/contexts/language-context'; // Import useLanguage

interface UserRoleEditorProps {
  user: User;
  onRoleChange: (userId: string, newRole: UserRole, newCategoryAccess?: string) => void;
  currentUserRole: UserRole | undefined;
  toastFn: ReturnType<typeof useToast>['toast'];
  categories: Category[];
}

function UserRoleEditor({ user, onRoleChange, currentUserRole, toastFn, categories }: UserRoleEditorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(user.categoryAccess);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setSelectedRole(user.role);
    setSelectedCategory(user.categoryAccess);
  }, [user, isDialogOpen]);


  const handleSaveRole = () => {
    if (currentUserRole !== 'Admin' && selectedRole === 'Admin' && user.role !== 'Admin') {
      toastFn({ title: "Permission Denied", description: "Only Admins can assign the Admin role.", variant: "destructive" });
      return;
    }
    if (selectedRole === 'DepartmentEmployee' && !selectedCategory) {
      toastFn({ title: "Category Required", description: "Department Employees must have a category assigned.", variant: "destructive" });
      return;
    }
    onRoleChange(user.id, selectedRole, selectedRole === 'DepartmentEmployee' ? selectedCategory : undefined);
    toastFn({ title: "Role Updated", description: `Role for ${user.name} changed to ${selectedRole}.` });
    setIsDialogOpen(false);
  };

  const canEditThisUserRole =
    currentUserRole === 'Admin' ||
    (currentUserRole === 'WarehouseManager' && user.role !== 'Admin' && user.role !== 'WarehouseManager');


  if (!canEditThisUserRole && user.id !== (useAuth().currentUser?.id)) {
     return <span className="text-sm text-muted-foreground">{user.role}</span>;
  }
   if (user.role === 'Admin' && currentUserRole !== 'Admin') {
    return <span className="text-sm text-muted-foreground">{user.role} (Cannot change Admin)</span>;
  }


  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={!canEditThisUserRole || (user.role === 'Admin' && currentUserRole !== 'Admin')} className="flex items-center gap-1">
          {user.role} <Edit2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Role for {user.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Select a new role and category access (if applicable) for this user.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-4">
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select new role" />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLES.map(role => (
                <SelectItem key={role} value={role} disabled={role === 'Admin' && currentUserRole !== 'Admin'}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRole === 'DepartmentEmployee' && (
            <div>
                <Label htmlFor="category-access-edit" className="mb-1 block">Category Access</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category-access-edit" className="w-full">
                        <SelectValue placeholder="Select category access" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSaveRole}>Save Role</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const ROLE_DEFINITIONS: Record<UserRole, { name: string; description: string; permissions: string[] }> = {
  Admin: {
    name: "Administrator",
    description: "Has full system access and control.",
    permissions: [
      "Manage users, roles, and all system settings.",
      "Manage all products, categories, and warehouses.",
      "Oversee all inventory transactions and material requests.",
      "Access all reports and system logs.",
      "Configure CMS integrations and notification systems.",
      "Define Bill of Materials (BOM).",
    ],
  },
  WarehouseManager: {
    name: "Warehouse Manager",
    description: "Manages daily warehouse operations and staff.",
    permissions: [
      "Manage products, inventory levels, and stock transactions.",
      "Approve or reject material requests from departments.",
      "Manage Department Employee users (add, edit roles, assign categories).",
      "Access operational reports (inventory, material requests, etc.).",
      "Update product statuses and view BOM configurations.",
      "Manage warehouse locations and categories assigned to them.",
      "Manage notification rules for low stock.",
      "Define and manage Bill of Materials (BOM)."
    ],
  },
  DepartmentEmployee: {
    name: "Department Employee",
    description: "Staff member of a specific department with limited access.",
    permissions: [
      "View products relevant to their assigned department/category.",
      "Submit material requests for their specific department.",
      "Update status for products within their category access.",
      "View personal activity or department-specific reports (if configured).",
    ],
  },
};


export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage(); // Use language context
  const {
    currentUser, users: mockUsers, updateUserRole,
    categories, addCategory,
    warehouses, addWarehouse, updateWarehouse,
    notificationSettings, deleteNotificationSetting, addNotificationSetting, updateNotificationSetting,
    products: contextProducts, bomConfigurations, addBomConfiguration, updateBomConfiguration, deleteBomConfiguration
  } = useAuth();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewEditWarehouseModalOpen, setIsNewEditWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [isNewEditNotificationModalOpen, setIsNewEditNotificationModalOpen] = useState(false);
  const [editingNotificationSetting, setEditingNotificationSetting] = useState<NotificationSetting | null>(null);
  const [showDeleteConfirmNotif, setShowDeleteConfirmNotif] = useState<NotificationSetting | null>(null);
  
  const [isNewEditBomModalOpen, setIsNewEditBomModalOpen] = useState(false);
  const [editingBom, setEditingBom] = useState<BillOfMaterial | null>(null);
  const [showDeleteConfirmBom, setShowDeleteConfirmBom] = useState<BillOfMaterial | null>(null);


  const [appName, setAppName] = useState(t('app.name')); // Use translated app name
  const [cmsApiKey, setCmsApiKey] = useState("");
  const [cmsStoreUrl, setCmsStoreUrl] = useState("");


  useEffect(() => {
    setMounted(true);
    setAppName(t('app.name')); // Update appName when language changes
  }, [t, language]);

  const handleSaveGeneralSettings = () => {
    toast({
        title: t('settings.general.saveToast.title'),
        description: t('settings.general.saveToast.description', { appName: appName })
    });
  };

  const handleSaveLanguage = () => {
    toast({
        title: t('settings.language.saveToast.title'),
        description: t('settings.language.saveToast.description')
    });
  };


  const handleConnectCms = () => {
    if (!cmsApiKey || !cmsStoreUrl) {
        toast({ title: "CMS Connection Failed", description: "API Key and Store URL are required.", variant: "destructive" });
        return;
    }
    toast({ title: "CMS Connection Simulated", description: `Attempting to connect to ${cmsStoreUrl} with provided API key.`});
  };

  const handleSyncCmsProducts = () => {
    toast({ title: "CMS Product Sync Simulated", description: "Fetching products from connected CMS... (This is a simulation)"});
  };


  if (!mounted) {
    return null;
  }

  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageWarehouses = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageCategories = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageNotifications = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageIntegrations = currentUser?.role === 'Admin'; 
  const canManageBOMs = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';

  const handleOpenNewEditWarehouseModal = (warehouse?: Warehouse) => {
    setEditingWarehouse(warehouse || null);
    setIsNewEditWarehouseModalOpen(true);
  };

  const handleOpenNewEditNotificationModal = (setting?: NotificationSetting) => {
    setEditingNotificationSetting(setting || null);
    setIsNewEditNotificationModalOpen(true);
  };

  const handleDeleteNotification = (settingId: string) => {
    deleteNotificationSetting(settingId);
    toast({ title: "Notification Rule Deleted", description: `The notification rule has been deleted.`, variant: "destructive" });
    setShowDeleteConfirmNotif(null);
  };

  const handleOpenNewEditBomModal = (bom?: BillOfMaterial) => {
    setEditingBom(bom || null);
    setIsNewEditBomModalOpen(true);
  };

  const handleDeleteBom = (productId: string) => {
    deleteBomConfiguration(productId);
    const productName = contextProducts.find(p => p.id === productId)?.name || productId;
    toast({ title: "BOM Deleted", description: `Bill of Materials for ${productName} has been deleted.`, variant: "destructive" });
    setShowDeleteConfirmBom(null);
  };


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={t('settings.page.title')}
        icon={SettingsIcon}
        description={t('settings.page.description')}
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 h-auto p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm"><Palette className="mr-1 h-4 w-4 hidden sm:inline-flex" /> {t('settings.tabs.general')}</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm"><Users className="mr-1 h-4 w-4 hidden sm:inline-flex" /> {t('settings.tabs.usersAndRoles')}</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm"><Tag className="mr-1 h-4 w-4 hidden sm:inline-flex" /> {t('settings.tabs.categories')}</TabsTrigger>
          <TabsTrigger value="warehouses" className="text-xs sm:text-sm"><WarehouseIcon className="mr-1 h-4 w-4 hidden sm:inline-flex" /> {t('settings.tabs.warehouses')}</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs sm:text-sm"><FileJson className="mr-1 h-4 w-4 hidden sm:inline-flex" /> {t('settings.tabs.integrationsAndBom')}</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="mr-1 h-4 w-4 hidden sm:inline-flex" /> {t('settings.tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="language" className="text-xs sm:text-sm"><Globe className="mr-1 h-4 w-4 hidden sm:inline-flex" /> {t('settings.tabs.language')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.general.title')}</CardTitle>
              <CardDescription>{t('settings.general.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">{t('settings.general.appNameLabel')}</Label>
                <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={resolvedTheme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Label htmlFor="dark-mode">{t('settings.general.darkModeLabel')}</Label>
              </div>
              <Button onClick={handleSaveGeneralSettings}>{t('settings.general.saveButton')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div>
                <CardTitle>User &amp; Role Management</CardTitle>
                <CardDescription>
                  Manage user accounts and assign roles. Role definitions and granular permissions are managed by system administrators via backend configurations.
                </CardDescription>
              </div>
              {canManageUsers && (
                <Button onClick={() => setIsNewUserModalOpen(true)} className="mt-2 sm:mt-0">
                  <UserPlus className="mr-2 h-4 w-4" /> Add New User
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-8 border-b pb-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">System Roles Overview</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The system has the following predefined roles. In a complete system, administrators would be able
                  to define custom roles and assign granular permissions (e.g., view specific pages, create/edit/delete specific data) for each module through a dedicated backend interface.
                </p>
                <div className="space-y-4">
                  {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((roleKey) => {
                    const roleDef = ROLE_DEFINITIONS[roleKey];
                    return (
                      <div key={roleKey} className="p-3 border rounded-md bg-muted/20 shadow-sm">
                        <h4 className="font-semibold text-primary">{roleDef.name} <span className="text-xs text-muted-foreground">({roleKey})</span></h4>
                        <p className="text-xs text-muted-foreground mb-1">{roleDef.description}</p>
                        <ul className="list-disc list-inside pl-4 text-xs text-muted-foreground space-y-0.5">
                          {roleDef.permissions.map((perm, index) => (
                            <li key={index}>{perm}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                 <h3 className="text-lg font-semibold text-foreground mb-3">User Accounts</h3>
                {mockUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 mb-2 last:mb-0">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.role === 'DepartmentEmployee' && user.categoryAccess && (
                          <p className="text-xs text-muted-foreground">Category: {user.categoryAccess}</p>
                      )}
                    </div>
                    {canManageUsers ? (
                      <UserRoleEditor user={user} onRoleChange={updateUserRole} currentUserRole={currentUser?.role} toastFn={toast} categories={categories} />
                    ) : (
                      <span className="text-sm font-medium">{user.role}</span>
                    )}
                  </div>
                ))}
                {!canManageUsers && (
                  <p className="text-sm text-muted-foreground text-center pt-4">
                    Contact an Administrator to manage user roles or add new users.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>
                  {canManageCategories
                    ? "Manage product categories. (Simulated: Changes are not persistent)."
                    : "View product categories. You do not have permission to manage them."}
                </CardDescription>
              </div>
              {canManageCategories && (
                <Button onClick={() => setIsNewCategoryModalOpen(true)}>
                  <Tag className="mr-2 h-4 w-4" /> Add New Category
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-mono text-xs">{category.id}</TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
               {!canManageCategories && categories.length > 0 && (
                <p className="text-sm text-muted-foreground text-center pt-4">
                  Contact an Administrator to manage categories.
                </p>
              )}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No categories defined yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Warehouse Management</CardTitle>
                <CardDescription>
                  {canManageWarehouses
                    ? "Manage warehouse locations and their assigned categories. Products are assigned via their `warehouseId`. (Simulated: Changes are not persistent)."
                    : "View warehouse locations. You do not have permission to manage them."}
                </CardDescription>
              </div>
               {canManageWarehouses && (
                <Button onClick={() => handleOpenNewEditWarehouseModal()}>
                  <WarehouseIcon className="mr-2 h-4 w-4" /> Add New Warehouse
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Managed Categories</TableHead>
                      {canManageWarehouses && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-mono text-xs">{warehouse.id}</TableCell>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>{warehouse.location || 'N/A'}</TableCell>
                        <TableCell className="text-xs">
                          {warehouse.managedCategoryIds && warehouse.managedCategoryIds.length > 0
                            ? warehouse.managedCategoryIds.map(catId => categories.find(c => c.id === catId)?.name || catId).join(', ')
                            : 'All Categories'}
                        </TableCell>
                        {canManageWarehouses && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenNewEditWarehouseModal(warehouse)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit Warehouse</span>
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {!canManageWarehouses && warehouses.length > 0 && (
                 <p className="text-sm text-muted-foreground text-center pt-4">
                  Contact an Administrator to manage warehouses.
                </p>
              )}
              {warehouses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No warehouses defined yet.</p>
              )}
               <p className="text-xs text-muted-foreground pt-4">
                Products are assigned to warehouses using the 'warehouseId' field. Warehouses can be configured to manage specific categories of products (affecting product creation/editing forms).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>CMS Integrations &amp; Bill of Materials (BOM)</CardTitle>
              <CardDescription>Connect with e-commerce platforms and manage product compositions for automated inventory deduction based on sales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/20 shadow-inner">
                <h3 className="text-md font-semibold mb-2 flex items-center"><Link2 className="mr-2 h-5 w-5 text-primary"/> Connect to CMS (e.g., PrestaShop)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Enter your CMS API credentials to enable product synchronization and automated inventory updates. In a real system, this would involve secure backend communication.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cmsStoreUrl">Store URL</Label>
                    <Input id="cmsStoreUrl" value={cmsStoreUrl} onChange={(e)=> setCmsStoreUrl(e.target.value)} placeholder="e.g., https://yourstore.prestashop.com" disabled={!canManageIntegrations}/>
                  </div>
                  <div>
                    <Label htmlFor="cmsApiKey">API Key</Label>
                    <Input id="cmsApiKey" type="password" value={cmsApiKey} onChange={(e)=> setCmsApiKey(e.target.value)} placeholder="Enter your CMS API Key" disabled={!canManageIntegrations}/>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleConnectCms} disabled={!canManageIntegrations || (!cmsStoreUrl || !cmsApiKey)}>
                      Connect CMS (Simulated)
                    </Button>
                    <Button variant="outline" onClick={handleSyncCmsProducts} disabled={!canManageIntegrations}>
                      Sync Products from CMS (Simulated)
                    </Button>
                  </div>
                  {!canManageIntegrations && <p className="text-xs text-destructive pt-2">You do not have permission to manage CMS integrations.</p>}
                </div>
                <div className="mt-4 flex justify-center gap-4">
                  <Image src="https://placehold.co/100x40.png?text=PrestaShop" alt="PrestaShop" width={100} height={40} data-ai-hint="logo brand"/>
                  <Image src="https://placehold.co/100x40.png?text=WooCommerce" alt="WooCommerce" width={100} height={40} data-ai-hint="logo brand"/>
                  <Image src="https://placehold.co/100x40.png?text=Shopify" alt="Shopify" width={100} height={40} data-ai-hint="logo brand"/>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-semibold flex items-center"><FileJson className="mr-2 h-5 w-5 text-primary"/> Bill of Materials (BOM) Management</h3>
                    {canManageBOMs && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenNewEditBomModal()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New BOM
                        </Button>
                    )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Define the raw materials and quantities needed to produce each finished good. Changes are simulated and not persistent.
                </p>
                {bomConfigurations.length > 0 ? (
                   <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Finished Good</TableHead>
                            <TableHead>Raw Materials (Qty)</TableHead>
                            {canManageBOMs && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bomConfigurations.map((bom) => {
                                const finishedGood = contextProducts.find(p => p.id === bom.productId);
                                return (
                                <TableRow key={bom.productId}>
                                    <TableCell className="font-medium">{finishedGood?.name || bom.productName || bom.productId}</TableCell>
                                    <TableCell className="text-xs">
                                    {bom.items.map((item, index) => {
                                        const rawMaterial = contextProducts.find(p => p.id === item.rawMaterialId);
                                        return (
                                        <span key={index} className="block">
                                            {rawMaterial?.name || item.rawMaterialName || `ID: ${item.rawMaterialId}`} (Qty: {item.quantityNeeded})
                                        </span>
                                        );
                                    })}
                                    </TableCell>
                                    {canManageBOMs && (
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenNewEditBomModal(bom)} className="mr-1">
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">Edit BOM</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirmBom(bom)} className="text-destructive hover:text-destructive/90">
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete BOM</span>
                                        </Button>
                                    </TableCell>
                                    )}
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No BOM configurations defined yet.
                    {canManageBOMs && " Click 'Add New BOM' to create one."}
                  </p>
                )}
                 {!canManageBOMs && bomConfigurations.length > 0 && (
                   <p className="text-xs text-destructive pt-2 text-center">You do not have permission to manage BOM configurations.</p>
                 )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  {canManageNotifications
                    ? "Configure email, SMS, or in-app alerts for important inventory events. (Simulated: Changes are not persistent)."
                    : "View notification rules. You do not have permission to manage them."}
                </CardDescription>
              </div>
              {canManageNotifications && (
                <Button onClick={() => handleOpenNewEditNotificationModal()} className="mt-2 sm:mt-0">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Notification Rule
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="prose prose-sm max-w-none text-muted-foreground text-xs mb-4">
                <p>
                  In a complete system, this section allows administrators to set up automated notifications for events like low stock. Rules would define: product/category, inventory threshold, recipient(s), notification channel (Email, SMS, In-app), and rule status (enabled/disabled).
                </p>
                <p>
                  The backend would monitor inventory changes and trigger notifications based on these rules. The list below shows example configurations.
                </p>
              </div>

              {notificationSettings.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Threshold</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead className="text-center">Channel</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        {canManageNotifications && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationSettings.map((setting: NotificationSetting) => (
                        <TableRow key={setting.id}>
                          <TableCell className="font-medium">{setting.productName || setting.productId}</TableCell>
                          <TableCell className="text-center">{setting.threshold}</TableCell>
                          <TableCell className="text-xs">{setting.recipient}</TableCell>
                          <TableCell className="text-center"><Badge variant="outline" className="capitalize">{setting.channel}</Badge></TableCell>
                          <TableCell className="text-center">
                            <Badge variant={setting.isEnabled ? "default" : "secondary"} className={setting.isEnabled ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400"}>
                              {setting.isEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </TableCell>
                          {canManageNotifications && (
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenNewEditNotificationModal(setting)} className="mr-1">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit Rule</span>
                              </Button>
                                <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirmNotif(setting)} className="text-destructive hover:text-destructive/90">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete Rule</span>
                                </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notification rules configured yet.
                  {canManageNotifications && " Click 'Add Notification Rule' to create one."}
                </p>
              )}
              {!canManageNotifications && notificationSettings.length > 0 && (
                <p className="text-sm text-muted-foreground text-center pt-4">
                  Contact an Administrator to manage notification rules.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language.title')}</CardTitle>
              <CardDescription>{t('settings.language.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language-select">{t('settings.language.selectLabel')}</Label>
                <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'fa')}>
                  <SelectTrigger id="language-select" className="w-[280px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('settings.language.english')}</SelectItem>
                    <SelectItem value="fa">{t('settings.language.persian')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <p className="text-sm text-muted-foreground">{t('settings.language.comingSoon')}</p>
              <Button onClick={handleSaveLanguage}>{t('settings.language.saveButton')}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <NewUserModal isOpen={isNewUserModalOpen} onClose={() => setIsNewUserModalOpen(false)} />
      <NewCategoryModal isOpen={isNewCategoryModalOpen} onClose={() => setIsNewCategoryModalOpen(false)} />
      <NewEditWarehouseModal
        isOpen={isNewEditWarehouseModalOpen}
        onClose={() => {
          setIsNewEditWarehouseModalOpen(false);
          setEditingWarehouse(null);
        }}
        existingWarehouse={editingWarehouse}
        addWarehouse={addWarehouse}
        updateWarehouse={updateWarehouse}
      />
      <NewEditNotificationSettingModal
        isOpen={isNewEditNotificationModalOpen}
        onClose={() => {
            setIsNewEditNotificationModalOpen(false);
            setEditingNotificationSetting(null);
        }}
        existingSetting={editingNotificationSetting}
        addNotificationSetting={addNotificationSetting}
        updateNotificationSetting={updateNotificationSetting}
      />
      {showDeleteConfirmNotif && (
        <AlertDialog open={!!showDeleteConfirmNotif} onOpenChange={() => setShowDeleteConfirmNotif(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                Are you sure you want to delete the notification rule for product <span className="font-semibold">{showDeleteConfirmNotif.productName || showDeleteConfirmNotif.productId}</span>? This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirmNotif(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                onClick={() => handleDeleteNotification(showDeleteConfirmNotif.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                Yes, Delete Rule
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {showDeleteConfirmBom && (
        <AlertDialog open={!!showDeleteConfirmBom} onOpenChange={() => setShowDeleteConfirmBom(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm BOM Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                Are you sure you want to delete the Bill of Materials for product <span className="font-semibold">{contextProducts.find(p => p.id === showDeleteConfirmBom!.productId)?.name || showDeleteConfirmBom!.productId}</span>? This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirmBom(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                onClick={() => handleDeleteBom(showDeleteConfirmBom!.productId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                Yes, Delete BOM
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
       <NewEditBomModal
        isOpen={isNewEditBomModalOpen}
        onClose={() => {
          setIsNewEditBomModalOpen(false);
          setEditingBom(null);
        }}
        existingBom={editingBom}
      />
    </div>
  );
}
    
