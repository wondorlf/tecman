"use client"

import Sidebar from "@/components/sidebar";
import { Header } from "@/components/header";
import { MotionWrapper } from "@/components/providers/motion-wrapper";
import { AnimatePresence } from "framer-motion";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        <MotionWrapper key="dashboard-content">
                            {children}
                        </MotionWrapper>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
