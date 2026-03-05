"use client"

import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Panel de Control</h2>
            <div className="flex items-center space-x-4">
                <ModeToggle />
                <UserNav />
            </div>
        </header>
    );
}
