// src/components/settings/new-user-modal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import type { User, UserRole } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants'; // MOCK_CATEGORIES removed
import { useToast } from '@/hooks/use-toast';

const newUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(USER_ROLES as [UserRole, ...UserRole[]], { required_error: "Role is required" }),
  categoryAccess: z.string().optional(),
}).refine(data => {
  if (data.role === 'DepartmentEmployee' && !data.categoryAccess) {
    return false;
  }
  return true;
}, {
  message: "Category Access is required for Department Employee role",
  path: ["categoryAccess"],
});

type NewUserFormData = z.infer<typeof newUserSchema>;

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewUserModal({ isOpen, onClose }: NewUserModalProps) {
  const { addNewUser, currentUser, categories } = useAuth(); // Get categories from AuthContext
  const { toast } = useToast();

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: undefined,
      categoryAccess: '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (data: NewUserFormData) => {
    if (currentUser?.role !== 'Admin' && data.role === 'Admin') {
        toast({ title: "Permission Denied", description: "Only Admins can create other Admin users.", variant: "destructive" });
        return;
    }
    addNewUser({
      name: data.name,
      email: data.email,
      role: data.role,
      categoryAccess: data.role === 'DepartmentEmployee' ? data.categoryAccess : undefined,
    });
    toast({ title: "User Added", description: `${data.name} has been added.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Fill in the details for the new user.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="name" {...field} placeholder="e.g., John Doe" />}
            />
            {errors.name && <p className="text-xs text-destructive pt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => <Input id="email" type="email" {...field} placeholder="e.g., john.doe@example.com" />}
            />
            {errors.email && <p className="text-xs text-destructive pt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(role => (
                      <SelectItem key={role} value={role} disabled={currentUser?.role !== 'Admin' && role === 'Admin'}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-xs text-destructive pt-1">{errors.role.message}</p>}
          </div>

          {selectedRole === 'DepartmentEmployee' && (
            <div>
              <Label htmlFor="categoryAccess">Category Access</Label>
              <Controller
                name="categoryAccess"
                control={control}
                render={({ field }) => (
                   <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="categoryAccess">
                      <SelectValue placeholder="Select category access" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => ( // Use categories from context
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryAccess && <p className="text-xs text-destructive pt-1">{errors.categoryAccess.message}</p>}
            </div>
          )}

          <DialogFooter className="sm:justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
