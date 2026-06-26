import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

export const dynamic = 'force-dynamic';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthInitializer } from '@/components/providers/auth-initializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TecMan | Gestión de Activos y Mantenimiento',
  description:
    'Sistema integral de gestión de inventarios, mantenimiento y control de activos empresariales',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <AuthInitializer />
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
