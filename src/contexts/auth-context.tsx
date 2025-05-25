
// src/contexts/auth-context.tsx
"use client";

import type { User, UserRole, Category, Warehouse, NotificationSetting, MaterialRequest, RequestedItem, Product, InventoryTransaction } from '@/lib/types';
import { MOCK_USERS, DEFAULT_CURRENT_USER_ID, MOCK_CATEGORIES, MOCK_WAREHOUSES, MOCK_NOTIFICATION_SETTINGS, MOCK_MATERIAL_REQUESTS, MOCK_PRODUCTS, MOCK_INVENTORY_TRANSACTIONS } from '@/lib/constants';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUserById: (userId: string) => void;
  users: User[];
  updateUserRole: (userId: string, newRole: User['role'], newCategoryAccess?: string) => void;
  addNewUser: (userData: Omit<User, 'id' | 'avatarFallback' | 'role'> & { role: UserRole }) => void;
  
  categories: Category[];
  addCategory: (categoryData: Omit<Category, 'id'>) => void;
  
  warehouses: Warehouse[];
  addWarehouse: (warehouseData: Omit<Warehouse, 'id'>) => void;
  updateWarehouse: (warehouseData: Warehouse) => void;
  
  notificationSettings: NotificationSetting[];
  addNotificationSetting: (settingData: Omit<NotificationSetting, 'id'>) => void;
  updateNotificationSetting: (settingData: NotificationSetting) => void;
  deleteNotificationSetting: (settingId: string) => void;
  
  materialRequests: MaterialRequest[];
  addMaterialRequest: (requestData: Omit<MaterialRequest, 'id' | 'submissionDate' | 'status' | 'requesterId' | 'requesterName' | 'departmentCategory'>) => void;
  updateMaterialRequest: (updatedRequest: MaterialRequest) => void;

  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;

  inventoryTransactions: InventoryTransaction[];
  setInventoryTransactions: React.Dispatch<React.SetStateAction<InventoryTransaction[]>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(MOCK_NOTIFICATION_SETTINGS);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>(MOCK_MATERIAL_REQUESTS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS); // Added products state
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(MOCK_INVENTORY_TRANSACTIONS); // Added transactions state
  
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
      id: `user${Date.now()}`, 
      avatarFallback: (userData.name || 'N A').split(' ').map(n => n[0]).join('').toUpperCase(),
      categoryAccess: userData.role === 'DepartmentEmployee' ? userData.categoryAccess : undefined,
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat${Date.now()}`, 
    };
    setCategories(prevCategories => [...prevCategories, newCategory]);
  };

  const addWarehouse = (warehouseData: Omit<Warehouse, 'id'>) => {
    const newWarehouse: Warehouse = {
      ...warehouseData,
      id: `wh${Date.now()}`,
    };
    setWarehouses(prevWarehouses => [...prevWarehouses, newWarehouse]);
  };

  const updateWarehouse = (updatedWarehouse: Warehouse) => {
    setWarehouses(prevWarehouses =>
      prevWarehouses.map(wh => (wh.id === updatedWarehouse.id ? updatedWarehouse : wh))
    );
  };

  const addNotificationSetting = (settingData: Omit<NotificationSetting, 'id'>) => {
    const newSetting: NotificationSetting = {
      ...settingData,
      id: `notif${Date.now()}`,
    };
    setNotificationSettings(prevSettings => [...prevSettings, newSetting]);
  };

  const updateNotificationSetting = (updatedSetting: NotificationSetting) => {
    setNotificationSettings(prevSettings =>
      prevSettings.map(s => (s.id === updatedSetting.id ? updatedSetting : s))
    );
  };

  const deleteNotificationSetting = (settingId: string) => {
    setNotificationSettings(prevSettings => prevSettings.filter(s => s.id !== settingId));
  };

  const addMaterialRequest = (requestData: Omit<MaterialRequest, 'id' | 'submissionDate' | 'status' | 'requesterId' | 'requesterName' | 'departmentCategory'>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "No current user found to submit request.", variant: "destructive" });
      return;
    }
    const fullNewRequest: MaterialRequest = {
      id: `mr${Date.now()}`,
      submissionDate: new Date().toISOString(),
      status: 'Pending',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      departmentCategory: currentUser.categoryAccess || 'N/A',
      ...requestData,
    };
    setMaterialRequests(prev => [fullNewRequest, ...prev]);
    toast({ title: "Material Request Submitted", description: "Your request has been submitted for approval." });
  };

  const updateMaterialRequest = (updatedRequest: MaterialRequest) => {
    setMaterialRequests(prev => prev.map(req => (req.id === updatedRequest.id ? updatedRequest : req)));
     toast({ title: "Material Request Updated", description: `Request ${updatedRequest.id} has been updated.`});
  };


  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      setCurrentUserById, 
      users, 
      updateUserRole, 
      addNewUser, 
      categories, 
      addCategory,
      warehouses,
      addWarehouse,
      updateWarehouse,
      notificationSettings,
      addNotificationSetting,
      updateNotificationSetting,
      deleteNotificationSetting,
      materialRequests,
      addMaterialRequest,
      updateMaterialRequest,
      products, // Provide products
      setProducts, // Provide setProducts
      inventoryTransactions, // Provide inventoryTransactions
      setInventoryTransactions, // Provide setInventoryTransactions
    }}>
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
