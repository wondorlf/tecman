import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import { AnimatePresence } from "framer-motion";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Egan - GAMA | Gestión de Inventario y Mantenimiento",
    description: "Sistema integral de gestión de activos y mantenimiento preventivo",
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
                    </QueryProvider>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
