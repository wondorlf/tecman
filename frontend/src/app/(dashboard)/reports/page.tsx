"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import * as xlsx from "xlsx";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Mock Data for graphical demonstration
const ticketData = [
    { name: 'Hardware', tickets: 40 },
    { name: 'Red', tickets: 30 },
    { name: 'Software', tickets: 20 },
    { name: 'Accesos', tickets: 27 },
    { name: 'Otros', tickets: 18 },
];

const maintenanceStatusData = [
    { name: 'Completados', value: 400 },
    { name: 'Pendientes', value: 300 },
    { name: 'En Progreso', value: 300 },
    { name: 'Cancelados', value: 200 },
];

export default function ReportsDashboard() {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    const handleExportExcel = () => {
        try {
            setIsExporting(true);

            // Generate dummy table data for the export
            const exportData = [
                { ID: "TCK-1029", Categoria: "Hardware", Estado: "Abierto", Prioridad: "Alta", CreadoPor: "John Doe", Fecha: new Date().toLocaleDateString() },
                { ID: "TCK-1030", Categoria: "Red", Estado: "En Progreso", Prioridad: "Media", CreadoPor: "Jane Smith", Fecha: new Date().toLocaleDateString() },
                { ID: "TCK-1031", Categoria: "Software", Estado: "Resuelto", Prioridad: "Baja", CreadoPor: "Admin", Fecha: new Date().toLocaleDateString() },
            ];

            const worksheet = xlsx.utils.json_to_sheet(exportData);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, "Reporte_EganGama");

            // Generate excel file and prompt download
            xlsx.writeFile(workbook, `Reporte_Egan_GAMA_${new Date().getTime()}.xlsx`);

            toast({
                title: "Reporte Exportado",
                description: "El reporte en formato Excel se ha descargado correctamente.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error de Exportación",
                description: "Hubo un problema al tratar de generar el archivo Excel.",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h2>
                <div className="flex items-center space-x-2">
                    <Button onClick={handleExportExcel} disabled={isExporting}>
                        <Download className="mr-2 h-4 w-4" />
                        {isExporting ? "Exportando..." : "Exportar a Excel"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Mantenimientos Activos
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+24</div>
                        <p className="text-xs text-muted-foreground">
                            +19% desde el último mes
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tickets Resueltos
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground">
                            +201 la semana pasada
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tiempo Medio (Resolución)</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12.5h</div>
                        <p className="text-xs text-muted-foreground">
                            -2 horas frente al mes anterior
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Eficacia Operativa
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">94.2%</div>
                        <p className="text-xs text-muted-foreground">
                            Basado en encuestas de cierre
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Historial de Tickets por Categoría</CardTitle>
                        <CardDescription>
                            Evolución de soporte y tickets técnicos abiertos este mes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ticketData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="tickets" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Estado de Mantenimientos</CardTitle>
                        <CardDescription>
                            Distribución global del estado de operaciones programadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={maintenanceStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {maintenanceStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
