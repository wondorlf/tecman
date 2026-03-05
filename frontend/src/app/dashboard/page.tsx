"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, Bell, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function DashboardPage() {
    const { data: stats = {
        assetsCount: 0,
        pendingMaint: 0,
        activeAlerts: 0,
        usersCount: 0,
    }, isLoading, error } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:3001/api/dashboard/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        }
    });

    const cards = [
        { title: "Total Activos", value: stats.assetsCount, icon: Package, color: "text-blue-600" },
        { title: "Mantenimientos Pendientes", value: stats.pendingMaint, icon: Wrench, color: "text-yellow-600" },
        { title: "Alertas Activas", value: stats.activeAlerts, icon: Bell, color: "text-red-600" },
        { title: "Usuarios", value: stats.usersCount, icon: Users, color: "text-green-600" },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <card.icon className={card.color} size={20} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Resumen de Activos</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Gráfico de activos por estado (próximamente)
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Alertas Recientes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center text-muted-foreground">
                        Lista de alertas (próximamente)
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
