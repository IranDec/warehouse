// src/components/layout/app-shell.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Warehouse, Settings, LogOut, UserCog, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME, NAV_ITEMS, MOCK_USERS } from '@/lib/constants';
import type { NavItem } from '@/lib/types';
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
import React from 'react';
import { useAuth } from '@/contexts/auth-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMobile, openMobile } = useSidebar(); 
  const { currentUser, setCurrentUserById, users: availableUsers } = useAuth();

  const getPageTitle = () => {
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
    return segments.length > 0 ? segments[segments.length - 1].charAt(0).toUpperCase() + segments[segments.length - 1].slice(1) : APP_NAME;
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
        <SidebarFooter className="p-2 border-t">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
                <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
                  <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser?.avatarFallback || 'WE'}`} alt={currentUser?.name || "User Avatar"} data-ai-hint="user avatar" />
                  <AvatarFallback>{currentUser?.avatarFallback || 'WE'}</AvatarFallback>
                </Avatar>
                <span className="group-data-[collapsible=icon]:hidden">{currentUser?.name || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-56">
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
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background/80 backdrop-blur-sm px-4">
            <SidebarTrigger className="md:hidden -ml-2"/>
            <h1 className="text-xl font-semibold">
              {getPageTitle()}
            </h1>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
