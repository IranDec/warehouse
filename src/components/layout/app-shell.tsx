
// src/components/layout/app-shell.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Warehouse, Settings, LogOut, UserCog, PanelLeft, Sun, Moon, Bell, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants'; // APP_NAME removed, will use translated version
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
import { useLanguage } from '@/contexts/language-context'; // Import useLanguage


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMobile, openMobile, setOpenMobile, state: sidebarState } = useSidebar();
  const { currentUser, setCurrentUserById, users: availableUsers, addMaterialRequest } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { t, language } = useLanguage(); // Use language context

  const [clientPageTitle, setClientPageTitle] = useState('');
  const [isQuickRequestModalOpen, setIsQuickRequestModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePageTitle = useCallback(() => {
    // Attempt to translate known nav item labels
    for (const item of NAV_ITEMS) {
      // Assuming nav items might have a translation key like `nav.${item.label.toLowerCase().replace(' ', '')}`
      // This is a simplistic approach; a more robust one would involve mapping labels to keys.
      const translationKey = `nav.${item.label.toLowerCase().replace(/\s+/g, '')}`;
      const translatedLabel = t(translationKey, {}); // Provide empty params if none needed
      
      if (item.href === '/' && pathname === '/') return translatedLabel !== translationKey ? translatedLabel : item.label;
      if (item.href !== '/' && pathname.startsWith(item.href)) return translatedLabel !== translationKey ? translatedLabel : item.label;
      
      if (item.children) {
        for (const child of item.children) {
          const childTranslationKey = `nav.${child.label.toLowerCase().replace(/\s+/g, '')}`;
          const translatedChildLabel = t(childTranslationKey, {});
          if (pathname.startsWith(child.href)) return translatedChildLabel !== childTranslationKey ? translatedChildLabel : child.label;
        }
      }
    }
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // Attempt to translate common page titles if they aren't in NAV_ITEMS (e.g., dynamic product pages)
        const pageKey = `page.${lastSegment.toLowerCase()}`;
        const translatedPage = t(pageKey, {});
        if (translatedPage !== pageKey) return translatedPage;
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    }
    return t('app.name'); // Default to translated app name
  }, [pathname, t, language]); // Add language to dependencies

  useEffect(() => {
    setClientPageTitle(calculatePageTitle());
  }, [calculatePageTitle, language]); // Also update title when language changes

  const handleQuickMaterialRequestSubmit = (
    data: Omit<MaterialRequest, 'id' | 'submissionDate' | 'status' | 'requesterId' | 'requesterName' | 'departmentCategory'>
  ) => {
    if (currentUser) { 
      addMaterialRequest(data);
      setIsQuickRequestModalOpen(false);
    } else {
      toast({
        title: "Error",
        description: "No user logged in to submit request.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className={cn("flex min-h-screen w-full bg-background", {"overflow-hidden": isMobile && openMobile})}>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r bg-card md:bg-sidebar">
        <SidebarHeader className="flex items-center justify-between p-2 py-3 h-[57px]">
          <Button variant="ghost" className="h-auto p-2 group-data-[collapsible=icon]:p-1.5" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Warehouse className="h-7 w-7 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 transition-all" />
              <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">{t('app.name')}</span>
            </Link>
          </Button>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              // Simplistic translation key generation, adapt as needed
              const translationKey = `nav.${item.label.toLowerCase().replace(/\s+/g, '')}`;
              const displayLabel = t(translationKey) !== translationKey ? t(translationKey) : item.label;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                    tooltip={{ children: displayLabel, side: 'right', align: 'center' }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{displayLabel}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t min-h-[56px]">
            {/* Footer content moved to header dropdown */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <header className="sticky top-0 z-30 flex h-[57px] items-center gap-1 border-b bg-background/80 backdrop-blur-sm px-4">
            <SidebarTrigger className="md:hidden -ml-2"/> 
            <SidebarTrigger className="hidden md:flex"/> 
            <h1 className="text-xl font-semibold ml-2 flex-1 truncate">
              {clientPageTitle ? clientPageTitle : <span className="opacity-0 select-none">{t('app.name')}</span>}
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
                title={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
              >
                {mounted ? (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : <Moon className="h-5 w-5 opacity-50" /> }
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
                      <span>{t('settings.page.title')}</span>
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
             <span dangerouslySetInnerHTML={{ __html: t('footer.text') }} />
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
