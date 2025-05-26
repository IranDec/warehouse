
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from '@/components/layout/app-shell';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from "next-themes";
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context'; // Import LanguageProvider

export const metadata: Metadata = {
  title: 'Warehouse Edge', // This will be static or handled by Next.js metadata features later
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider> {/* Wrap AuthProvider with LanguageProvider */}
            <AuthProvider>
              <SidebarProvider defaultOpen={true}>
                <AppShell>{children}</AppShell>
              </SidebarProvider>
            </AuthProvider>
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
