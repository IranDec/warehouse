// src/app/settings/page.tsx
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Settings as SettingsIcon, Bell, Users, Database, Palette, Globe, Edit2, FileJson, MessageSquareWarning, Warehouse as WarehouseIcon, UserPlus } from "lucide-react";
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
import type { User, UserRole, Warehouse, Category } from "@/lib/types";
import { USER_ROLES, MOCK_BOM_CONFIGURATIONS, MOCK_NOTIFICATION_SETTINGS, MOCK_WAREHOUSES, MOCK_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { NewUserModal } from "@/components/settings/new-user-modal"; // Import the new modal
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


interface UserRoleEditorProps {
  user: User;
  onRoleChange: (userId: string, newRole: UserRole, newCategoryAccess?: string) => void;
  currentUserRole: UserRole | undefined;
  toast: ReturnType<typeof useToast>['toast'];
}

function UserRoleEditor({ user, onRoleChange, currentUserRole, toast }: UserRoleEditorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(user.categoryAccess);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setSelectedRole(user.role);
    setSelectedCategory(user.categoryAccess);
  }, [user, isDialogOpen]);


  const handleSaveRole = () => {
    if (currentUserRole !== 'Admin' && selectedRole === 'Admin' && user.role !== 'Admin') {
      toast({ title: "Permission Denied", description: "Only Admins can assign the Admin role.", variant: "destructive" });
      return;
    }
    if (selectedRole === 'DepartmentEmployee' && !selectedCategory) {
      toast({ title: "Category Required", description: "Department Employees must have a category assigned.", variant: "destructive" });
      return;
    }
    onRoleChange(user.id, selectedRole, selectedRole === 'DepartmentEmployee' ? selectedCategory : undefined);
    toast({ title: "Role Updated", description: `Role for ${user.name} changed to ${selectedRole}.` });
    setIsDialogOpen(false);
  };

  const canEditThisUserRole =
    currentUserRole === 'Admin' ||
    (currentUserRole === 'WarehouseManager' && user.role !== 'Admin' && user.role !== 'WarehouseManager');


  if (!canEditThisUserRole && user.id !== (useAuth().currentUser?.id)) { // Users can't edit others if no general permission
     return <span className="text-sm text-muted-foreground">{user.role}</span>;
  }
  // Non-admins cannot edit admin roles
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
                        {MOCK_CATEGORIES.map(cat => (
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


export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { currentUser, users: mockUsers, updateUserRole } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const { toast } = useToast(); // Moved toast here

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';
  const canManageWarehouses = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="System Settings"
        icon={SettingsIcon}
        description="Configure application preferences, user roles, integrations, and notifications."
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm"><Palette className="mr-1 h-4 w-4 hidden sm:inline-flex" /> General</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm"><Users className="mr-1 h-4 w-4 hidden sm:inline-flex" /> User Management</TabsTrigger>
          <TabsTrigger value="warehouses" className="text-xs sm:text-sm"><WarehouseIcon className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Warehouses</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs sm:text-sm"><Database className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Integrations & BOM</TabsTrigger>
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
                <Input id="appName" defaultValue="Warehouse Edge" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={resolvedTheme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Label htmlFor="dark-mode">Enable Dark Mode</Label>
              </div>
              <Button onClick={() => toast({title: "Simulated Save", description: "General settings save action clicked."})}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  {canManageUsers
                    ? "Manage user roles. (Simulated: Changes are not persistent)."
                    : "View users. You do not have permission to manage roles."}
                </CardDescription>
              </div>
              {canManageUsers && (
                <Button onClick={() => setIsNewUserModalOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add New User
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {mockUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.role === 'DepartmentEmployee' && user.categoryAccess && (
                         <p className="text-xs text-muted-foreground">Category: {user.categoryAccess}</p>
                    )}
                  </div>
                  {canManageUsers ? (
                    <UserRoleEditor user={user} onRoleChange={updateUserRole} currentUserRole={currentUser?.role} toast={toast} />
                  ) : (
                    <span className="text-sm font-medium">{user.role}</span>
                  )}
                </div>
              ))}
              {!canManageUsers && (
                <p className="text-sm text-muted-foreground text-center pt-4">
                  Contact an Administrator to manage user roles.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Management</CardTitle>
              <CardDescription>
                View and manage your warehouse locations. Products are assigned to warehouses via their `warehouseId`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Below is the list of currently defined warehouses (from mock data). In a full application, administrators
                would be able to add, edit, and delete warehouses here.
              </p>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_WAREHOUSES.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-mono text-xs">{warehouse.id}</TableCell>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>{warehouse.location || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {canManageWarehouses ? (
                <Button onClick={() => toast({ title: "Simulated Action", description: "This would open a form to add a new warehouse."})}>
                  Add New Warehouse (Simulated)
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">You do not have permission to manage warehouses.</p>
              )}
               <p className="text-xs text-muted-foreground pt-4">
                Products are assigned to warehouses using the 'warehouseId' field during CSV import, or through an 'Add/Edit Product' form (which would include a warehouse selection dropdown from the list above).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>CMS Integrations & Bill of Materials (BOM)</CardTitle>
              <CardDescription>Connect with e-commerce platforms and manage product compositions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center text-muted-foreground py-6">
                <Database className="mx-auto h-10 w-10 mb-3" />
                <p className="text-sm">This section would allow connecting to CMS platforms (e.g., WooCommerce, Shopify) to sync product data and sales orders.</p>
                <p className="text-sm mt-1">Upon each sale in the CMS, the WMS would automatically deduct associated raw materials based on the defined Bill of Materials.</p>
                <div className="mt-4 flex justify-center gap-4">
                  <Image src="https://placehold.co/100x40.png?text=WooCommerce" alt="WooCommerce" width={100} height={40} data-ai-hint="logo brand" />
                  <Image src="https://placehold.co/100x40.png?text=Shopify" alt="Shopify" width={100} height={40} data-ai-hint="logo brand" />
                </div>
                <Button variant="outline" className="mt-4" onClick={() => toast({title: "Simulated Action", description: "Add Integration functionality."})}>Add CMS Integration</Button>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-md font-semibold mb-2 flex items-center"><FileJson className="mr-2 h-5 w-5 text-primary"/> Bill of Materials (BOM) Management</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Admins would define the raw materials and quantities needed for each finished product here. This is crucial for automatic deduction from inventory upon CMS sales.
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
                 <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({title: "Simulated Action", description: "Manage BOMs functionality."})}>Manage BOMs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email, SMS, or in-app alerts for important events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="text-center text-muted-foreground py-6">
                <Bell className="mx-auto h-10 w-10 mb-3" />
                <p className="text-sm">Set up alerts for events like low stock levels reaching a predefined minimum threshold.</p>
                <p className="text-sm mt-1">Notifications can be customized per product or category and sent to relevant managers or supervisors.</p>
              </div>
               <div className="border-t pt-6">
                <h3 className="text-md font-semibold mb-2 flex items-center"><MessageSquareWarning className="mr-2 h-5 w-5 text-primary"/>Low Stock Alert Configuration (Examples)</h3>
                 {MOCK_NOTIFICATION_SETTINGS.filter(s => s.channel !== 'in-app').length > 0 ? (
                  <div className="space-y-2 text-xs border rounded-md p-3 bg-muted/20 max-h-60 overflow-y-auto">
                    {MOCK_NOTIFICATION_SETTINGS.filter(s => s.channel !== 'in-app').map(setting => (
                      <div key={setting.id} className="p-2 border-b last:border-b-0">
                        <p><span className="font-semibold text-foreground">Product:</span> {setting.productName || setting.productId}</p>
                        <p><span className="font-semibold text-foreground">Threshold:</span> {setting.threshold}</p>
                        <p><span className="font-semibold text-foreground">Recipient:</span> {setting.recipient}</p>
                        <p><span className="font-semibold text-foreground">Channel:</span> {setting.channel}</p>
                        <p><span className="font-semibold text-foreground">Status:</span> {setting.isEnabled ? "Enabled" : "Disabled"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No mock Email/SMS notification settings configured yet.</p>
                )}
                <Button variant="outline" className="mt-4" onClick={() => toast({title: "Simulated Action", description: "Configure Alerts functionality."})}>Configure Alerts</Button>
              </div>
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
    </div>
  );
}
