
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
import type { User, UserRole, Warehouse, Category, NotificationSetting, NotificationChannel } from '@/lib/types';
import { USER_ROLES, MOCK_BOM_CONFIGURATIONS } from '@/lib/constants'; 
import { useToast } from '@/hooks/use-toast';
import { NewUserModal } from "@/components/settings/new-user-modal";
import { NewCategoryModal } from "@/components/settings/new-category-modal";
import { NewEditWarehouseModal } from "@/components/settings/new-edit-warehouse-modal";
import { NewEditNotificationSettingModal } from "@/components/settings/new-edit-notification-setting-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


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
      "Update product statuses and manage BOM configurations.",
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
  const { 
    currentUser, users: mockUsers, updateUserRole, 
    categories, addCategory, 
    warehouses, addWarehouse, updateWarehouse,
    notificationSettings, deleteNotificationSetting, addNotificationSetting, updateNotificationSetting
  } = useAuth();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewEditWarehouseModalOpen, setIsNewEditWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  
  const [isNewEditNotificationModalOpen, setIsNewEditNotificationModalOpen] = useState(false);
  const [editingNotificationSetting, setEditingNotificationSetting] = useState<NotificationSetting | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<NotificationSetting | null>(null);
  
  const [appName, setAppName] = useState("Warehouse Edge");
  const [cmsApiKey, setCmsApiKey] = useState("");
  const [cmsStoreUrl, setCmsStoreUrl] = useState("");


  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveGeneralSettings = () => {
    toast({
        title: "General Settings Saved (Simulated)",
        description: `Application name set to "${appName}". Theme preference is managed separately.`
    });
  };
  
  const handleConnectCms = () => {
    if (!cmsApiKey || !cmsStoreUrl) {
        toast({ title: "CMS Connection Failed", description: "API Key and Store URL are required.", variant: "destructive" });
        return;
    }
    toast({ title: "CMS Connection Simulated", description: `Attempting to connect to ${cmsStoreUrl} with provided API key.`});
    // In a real app, this would trigger an API call to the backend
  };

  const handleSyncCmsProducts = () => {
    toast({ title: "CMS Product Sync Simulated", description: "Fetching products from connected CMS... (This is a simulation)"});
    // In a real app, this would trigger a backend process
  };


  if (!mounted) {
    return null;
  }

  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageWarehouses = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageCategories = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageNotifications = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageIntegrations = currentUser?.role === 'Admin';

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
    setShowDeleteConfirm(null);
  };


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="System Settings"
        icon={SettingsIcon}
        description="Configure application preferences, user roles, integrations, and notifications."
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 h-auto p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm"><Palette className="mr-1 h-4 w-4 hidden sm:inline-flex" /> General</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm"><Users className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Users &amp; Roles</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm"><Tag className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Categories</TabsTrigger>
          <TabsTrigger value="warehouses" className="text-xs sm:text-sm"><WarehouseIcon className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Warehouses</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs sm:text-sm"><Database className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Integrations &amp; BOM</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Notifications</TabsTrigger>
          <TabsTrigger value="language" className="text-xs sm:text-sm"><Globe className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Language</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage basic application settings and appearance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name</Label>
                <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={resolvedTheme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Label htmlFor="dark-mode">Enable Dark Mode</Label>
              </div>
              <Button onClick={handleSaveGeneralSettings}>Save Changes</Button>
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
                      <div key={roleKey} className="p-3 border rounded-md bg-muted/30">
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
                    ? "Manage warehouse locations. Products are assigned via their `warehouseId`. (Simulated: Changes are not persistent)."
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
                      {canManageWarehouses && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-mono text-xs">{warehouse.id}</TableCell>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>{warehouse.location || 'N/A'}</TableCell>
                        {canManageWarehouses && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenNewEditWarehouseModal(warehouse)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit Warehouse</span>
                            </Button>
                             {/* Delete button can be added here with confirmation */}
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
                Products are assigned to warehouses using the 'warehouseId' field during CSV import, or through an 'Add/Edit Product' form (which includes a warehouse selection dropdown from the list above).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>CMS Integrations &amp; Bill of Materials (BOM)</CardTitle>
              <CardDescription>Connect with e-commerce platforms (e.g., PrestaShop, WooCommerce, Shopify) and manage product compositions for automated inventory deduction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="text-md font-semibold mb-2 flex items-center"><Link2 className="mr-2 h-5 w-5 text-primary"/> Connect to CMS (e.g., PrestaShop)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Enter your CMS API credentials to enable product synchronization and automated inventory updates based on sales.
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
                  <Image src="https://placehold.co/100x40.png?text=PrestaShop" alt="PrestaShop" width={100} height={40} data-ai-hint="logo brand" />
                  <Image src="https://placehold.co/100x40.png?text=WooCommerce" alt="WooCommerce" width={100} height={40} data-ai-hint="logo brand" />
                  <Image src="https://placehold.co/100x40.png?text=Shopify" alt="Shopify" width={100} height={40} data-ai-hint="logo brand" />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-md font-semibold mb-2 flex items-center"><FileJson className="mr-2 h-5 w-5 text-primary"/> Bill of Materials (BOM) Management</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  After syncing products from your CMS, define the raw materials and quantities from your WMS inventory needed to produce each CMS product. This is crucial for automatic deduction from inventory upon CMS sales.
                  <br/> (Currently showing mock BOM configurations. Full BOM management requires backend development.)
                </p>
                {MOCK_BOM_CONFIGURATIONS.length > 0 ? (
                  <div className="space-y-2 text-xs border rounded-md p-3 bg-muted/20 max-h-60 overflow-y-auto">
                    <p className="font-medium text-muted-foreground">Example BOM Configurations (Read-only):</p>
                    {MOCK_BOM_CONFIGURATIONS.map(bom => (
                      <div key={bom.productId} className="p-2 border-b last:border-b-0">
                        <span className="font-semibold text-foreground">{bom.productName || bom.productId}:</span>
                        <ul className="list-disc list-inside ml-4">
                          {bom.items.map(item => (
                            <li key={item.rawMaterialId}>
                              {item.quantityNeeded} x {item.rawMaterialName || item.rawMaterialId}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No mock BOMs configured yet.</p>
                )}
                 <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({title: "Simulated Action", description: "Manage BOMs functionality would open a dedicated interface."})} disabled={!canManageIntegrations}>
                    Manage BOMs (Simulated)
                </Button>
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
                              <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(setting)} className="text-destructive hover:text-destructive/90">
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
              <CardTitle>Language Settings</CardTitle>
              <CardDescription>Choose your preferred language for the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language-select">Application Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language-select" className="w-[280px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fa" disabled>فارسی (Persian) - Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <p className="text-sm text-muted-foreground">Multi-language support (English & Persian) is planned.</p>
              <Button onClick={() => toast({title: "Simulated Save", description: "Language settings save action clicked."})}>Save Language</Button>
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
      {showDeleteConfirm && (
        <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                Are you sure you want to delete the notification rule for product <span className="font-semibold">{showDeleteConfirm.productName || showDeleteConfirm.productId}</span>? This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                onClick={() => handleDeleteNotification(showDeleteConfirm.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                Yes, Delete Rule
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

