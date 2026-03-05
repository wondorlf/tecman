"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    Wrench,
    ClipboardList,
    Bell,
    Settings,
    Users,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Activos", icon: Package, href: "/dashboard/assets" },
    { name: "Mantenimiento", icon: Wrench, href: "/dashboard/maintenance" },
    { name: "Listas de Chequeo", icon: ClipboardList, href: "/dashboard/checklists" },
    { name: "Alertas", icon: Bell, href: "/dashboard/alerts" },
    { name: "Usuarios", icon: Users, href: "/dashboard/users" },
    { name: "Configuración", icon: Settings, href: "/dashboard/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex items-center justify-between">
                {!collapsed && <span className="text-xl font-bold text-primary">TecMan</span>}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center p-3 rounded-lg transition-colors",
                                active
                                    ? "bg-primary text-primary-foreground"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary"
                            )}
                        >
                            <item.icon size={20} className={cn(!collapsed && "mr-3")} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
