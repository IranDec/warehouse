// src/contexts/auth-context.tsx
"use client";

import type { User } from '@/lib/types';
import { MOCK_USERS, DEFAULT_CURRENT_USER_ID } from '@/lib/constants';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUserById: (userId: string) => void;
  users: User[]; // To manage users for role changes in settings
  updateUserRole: (userId: string, newRole: User['role']) => void; // For settings page
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return users.find(u => u.id === DEFAULT_CURRENT_USER_ID) || users[0] || null;
  });

  // Effect to update currentUser if users list changes (e.g. role update) and current user is affected
  useEffect(() => {
    if (currentUser) {
      const updatedCurrentUser = users.find(u => u.id === currentUser.id);
      if (updatedCurrentUser && updatedCurrentUser.role !== currentUser.role) {
        setCurrentUser(updatedCurrentUser);
      } else if (!updatedCurrentUser) { // Current user was somehow removed (not planned for this sim)
        setCurrentUser(users.find(u => u.id === DEFAULT_CURRENT_USER_ID) || users[0] || null);
      }
    } else if (users.length > 0) { // If no current user but users exist
       setCurrentUser(users.find(u => u.id === DEFAULT_CURRENT_USER_ID) || users[0] || null);
    }
  }, [users, currentUser?.id]);


  const setCurrentUserById = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setCurrentUser(user || null);
  };

  const updateUserRole = (userId: string, newRole: User['role']) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUserById, users, updateUserRole }}>
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
