import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from '@/components/layout/app-shell';
import { SidebarProvider } from '@/components/ui/sidebar';

// The GeistSans and GeistMono imports are objects, not functions to be called.
// Their .variable property provides the class name to set the CSS variables.

export const metadata: Metadata = {
  title: 'Warehouse Edge',
  description: 'Advanced Warehouse Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning={true}>
        <SidebarProvider defaultOpen>
          <AppShell>{children}</AppShell>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
