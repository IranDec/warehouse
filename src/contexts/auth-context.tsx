// src/contexts/auth-context.tsx
"use client";

import type { User, UserRole, Category } from '@/lib/types';
import { MOCK_USERS, DEFAULT_CURRENT_USER_ID, MOCK_CATEGORIES } from '@/lib/constants';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUserById: (userId: string) => void;
  users: User[];
  updateUserRole: (userId: string, newRole: User['role'], newCategoryAccess?: string) => void;
  addNewUser: (userData: Omit<User, 'id' | 'avatarFallback' | 'role'> & { role: UserRole }) => void;
  categories: Category[];
  addCategory: (categoryData: Omit<Category, 'id'>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return users.find(u => u.id === DEFAULT_CURRENT_USER_ID) || users[0] || null;
  });

  useEffect(() => {
    if (currentUser) {
      const updatedCurrentUser = users.find(u => u.id === currentUser.id);
      if (updatedCurrentUser && (updatedCurrentUser.role !== currentUser.role || updatedCurrentUser.categoryAccess !== currentUser.categoryAccess)) {
        setCurrentUser(updatedCurrentUser);
      } else if (!updatedCurrentUser) {
        setCurrentUser(users.find(u => u.id === DEFAULT_CURRENT_USER_ID) || users[0] || null);
      }
    } else if (users.length > 0) {
       setCurrentUser(users.find(u => u.id === DEFAULT_CURRENT_USER_ID) || users[0] || null);
    }
  }, [users, currentUser?.id]);


  const setCurrentUserById = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setCurrentUser(user || null);
  };

  const updateUserRole = (userId: string, newRole: UserRole, newCategoryAccess?: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, role: newRole, categoryAccess: newRole === 'DepartmentEmployee' ? newCategoryAccess : undefined } : user
      )
    );
  };

  const addNewUser = (userData: Omit<User, 'id' | 'avatarFallback' | 'role'> & { role: UserRole }) => {
    const newUser: User = {
      ...userData,
      id: `user${Date.now()}`, // Simple unique ID for mock
      avatarFallback: (userData.name || 'N A').split(' ').map(n => n[0]).join('').toUpperCase(),
      categoryAccess: userData.role === 'DepartmentEmployee' ? userData.categoryAccess : undefined,
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat${Date.now()}`, // Simple unique ID for mock
    };
    setCategories(prevCategories => [...prevCategories, newCategory]);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUserById, users, updateUserRole, addNewUser, categories, addCategory }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
