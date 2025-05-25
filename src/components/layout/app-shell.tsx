
// src/components/layout/app-shell.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Warehouse, Settings, LogOut, UserCog, PanelLeft, Sun, Moon, Bell, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME, NAV_ITEMS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from "next-themes";
import { useToast } from '@/hooks/use-toast';
import { NewMaterialRequestModal } from '@/components/material-requests/new-request-modal';
import type { MaterialRequest } from '@/lib/types';


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMobile, openMobile } = useSidebar(); 
  const { currentUser, setCurrentUserById, users: availableUsers, addMaterialRequest } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [clientPageTitle, setClientPageTitle] = useState('');
  const [isQuickRequestModalOpen, setIsQuickRequestModalOpen] = useState(false);

  const calculatePageTitle = useCallback(() => {
    for (const item of NAV_ITEMS) {
      if (item.href === '/' && pathname === '/') return item.label;
      if (item.href !== '/' && pathname.startsWith(item.href)) return item.label;
      if (item.children) {
        for (const child of item.children) {
          if (pathname.startsWith(child.href)) return child.label;
        }
      }
    }
    const segments = pathname.split('/').filter(Boolean);
    return segments.length > 0 
      ? segments[segments.length - 1].charAt(0).toUpperCase() + segments[segments.length - 1].slice(1) 
      : APP_NAME;
  }, [pathname]);

  useEffect(() => {
    setClientPageTitle(calculatePageTitle());
  }, [calculatePageTitle]);

  const handleQuickMaterialRequestSubmit = (
    data: Omit<MaterialRequest, 'id' | 'submissionDate' | 'status' | 'requesterId' | 'requesterName' | 'departmentCategory'>
  ) => {
    addMaterialRequest(data); // This will use currentUser from AuthContext
    setIsQuickRequestModalOpen(false);
  };


  return (
    <div className={cn("flex min-h-screen w-full bg-background", {"overflow-hidden": isMobile && openMobile})}>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r bg-card md:bg-sidebar">
        <SidebarHeader className="flex items-center justify-between p-2 py-3 h-[57px]">
          <Button variant="ghost" className="h-auto p-2 group-data-[collapsible=icon]:p-1.5" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Warehouse className="h-7 w-7 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 transition-all" />
              <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">{APP_NAME}</span>
            </Link>
          </Button>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        {/* Footer content moved to header dropdown */}
        <SidebarFooter className="p-2 border-t min-h-[56px]"> 
            {/* Placeholder to maintain layout if needed, or can be removed if header dropdown is sufficient */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <header className="sticky top-0 z-30 flex h-[57px] items-center gap-1 border-b bg-background/80 backdrop-blur-sm px-4">
            <SidebarTrigger className="md:hidden -ml-2"/> {/* Mobile toggle */}
            <SidebarTrigger className="hidden md:flex"/> {/* Desktop toggle */}
            <h1 className="text-xl font-semibold ml-2 flex-1 truncate">
              {clientPageTitle ? clientPageTitle : <span className="opacity-0 select-none">{APP_NAME}</span>}
            </h1>

            <div className="flex items-center gap-2 ml-auto">
              {currentUser?.role === 'DepartmentEmployee' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsQuickRequestModalOpen(true)}
                  title="New Material Request"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span className="sr-only">New Material Request</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => toast({ title: "Notifications", description: "Notifications panel would open here (Not Implemented)." })}
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="sr-only">View notifications</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser?.avatarFallback || 'WE'}`} alt={currentUser?.name || "User Avatar"} data-ai-hint="user avatar" />
                      <AvatarFallback>{currentUser?.avatarFallback || 'WE'}</AvatarFallback>
                    </Avatar>
                     <span className="sr-only">Open user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-56 z-40">
                  <DropdownMenuLabel>
                    {currentUser?.name || 'My Account'}
                    <p className="text-xs text-muted-foreground font-normal">{currentUser?.role || 'Role not set'}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <UserCog className="mr-2 h-4 w-4" />
                      <span>Switch User (Dev)</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup 
                          value={currentUser?.id} 
                          onValueChange={(value) => setCurrentUserById(value)}
                        >
                          {availableUsers.map(user => (
                            <DropdownMenuRadioItem key={user.id} value={user.id}>
                              {user.name} ({user.role})
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out (Not Implemented)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <footer className="p-4 text-center text-xs text-muted-foreground border-t bg-background">
            This is a test version. For the production version, please contact <a href="https://adschi.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AdsChi.com</a>.
          </footer>
        </div>
      </SidebarInset>
      {currentUser && (
        <NewMaterialRequestModal
          isOpen={isQuickRequestModalOpen}
          onClose={() => setIsQuickRequestModalOpen(false)}
          onSubmit={handleQuickMaterialRequestSubmit}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
