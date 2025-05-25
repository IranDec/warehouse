// src/app/settings/page.tsx
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Settings as SettingsIcon, Bell, Users, Database, Palette, Globe, Edit2 } from "lucide-react";
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
import type { User, UserRole } from "@/lib/types";
import { USER_ROLES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
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


interface UserRoleEditorProps {
  user: User;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  currentUserRole: UserRole | undefined;
}

function UserRoleEditor({ user, onRoleChange, currentUserRole }: UserRoleEditorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveRole = () => {
    onRoleChange(user.id, selectedRole);
    toast({ title: "Role Updated", description: `Role for ${user.name} changed to ${selectedRole}.` });
    setIsDialogOpen(false);
  };

  // Admin can change any role. WarehouseManager can change DepartmentEmployee roles.
  const canEditThisUserRole = 
    currentUserRole === 'Admin' || 
    (currentUserRole === 'WarehouseManager' && user.role === 'DepartmentEmployee');

  if (!canEditThisUserRole && user.role !== currentUserRole) { // If current user cannot edit this user AND it's not their own profile (no self-edit for roles here)
     return <span className="text-sm text-muted-foreground">{user.role}</span>; // Just display role
  }
   if (user.role === 'Admin' && currentUserRole !== 'Admin') { // Non-Admins cannot change Admin roles
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
            Select a new role for this user. Changes will take effect immediately (simulated).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
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
  const { currentUser, users: mockUsers, updateUserRole } = useAuth(); // users renamed to mockUsers to avoid conflict
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; 
  }
  
  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="System Settings"
        icon={SettingsIcon}
        description="Configure application preferences, user roles, and integrations."
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 h-auto p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm"><Palette className="mr-1 h-4 w-4 hidden sm:inline-flex" /> General</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm"><Users className="mr-1 h-4 w-4 hidden sm:inline-flex" /> User Management</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs sm:text-sm"><Database className="mr-1 h-4 w-4 hidden sm:inline-flex" /> Integrations</TabsTrigger>
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
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                {canManageUsers 
                  ? "Manage user roles. (Simulated: Changes are not persistent)."
                  : "View users. You do not have permission to manage roles."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {canManageUsers ? (
                    <UserRoleEditor user={user} onRoleChange={updateUserRole} currentUserRole={currentUser?.role} />
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

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email and SMS alerts. (Feature Placeholder)</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground py-10">
              <Bell className="mx-auto h-12 w-12 mb-4" />
              <p>Configure low stock alerts and other notifications.</p>
              <Button variant="outline" className="mt-4">Configure Alerts</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>CMS Integrations</CardTitle>
              <CardDescription>Connect with WooCommerce, PrestaShop, etc. (Feature Placeholder)</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground py-10">
              <Database className="mx-auto h-12 w-12 mb-4" />
              <p>Manage integrations with your e-commerce platforms.</p>
              <div className="mt-4 flex justify-center gap-4">
                <Image src="https://placehold.co/100x40.png?text=WooCommerce" alt="WooCommerce" width={100} height={40} data-ai-hint="logo brand" />
                <Image src="https://placehold.co/100x40.png?text=PrestaShop" alt="PrestaShop" width={100} height={40} data-ai-hint="logo brand" />
              </div>
              <Button variant="outline" className="mt-4">Add Integration</Button>
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
              <Button>Save Language</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
