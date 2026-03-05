"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { ShieldCheck, Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Handle "egan" shortcut
        const loginEmail = email.toLowerCase() === "egan" ? "egan@tecman.com" : email;
        const loginPassword = password;

        try {
            const response = await axios.post("http://127.0.0.1:3001/api/auth/login", {
                email: loginEmail,
                password: loginPassword
            });
            localStorage.setItem("token", response.data.access_token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            toast({
                title: "¡Bienvenido!",
                description: `Sesión iniciada como ${response.data.user.name}`,
            });
            router.push("/dashboard");
        } catch (error: any) {
            toast({
                title: "Error de acceso",
                description: error.response?.data?.message || "Credenciales incorrectas. Por favor verifica tus datos.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-white px-4 relative overflow-hidden">
            {/* Soft background pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#2563eb_1.5px,transparent_1.5px)] [background-size:32px_32px]"></div>

            <Card className="w-full max-w-md z-10 border-slate-200 shadow-[0_20px_50px_rgba(37,99,235,0.1)] overflow-hidden rounded-2xl bg-white">
                <div className="h-1.5 bg-blue-600 w-full" />
                <CardHeader className="pt-10 pb-8 text-center space-y-2">
                    <div className="mx-auto bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-2 border border-blue-100 shadow-sm transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <ShieldCheck className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-4xl font-black tracking-tight text-slate-900">
                            TecMan
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            Enterprise Asset Control
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6 px-10 pb-8">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-bold text-slate-800 ml-1">
                                Correo o Usuario
                            </Label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder="nombre@empresa.com o 'egan'"
                                    className="pl-11 h-12 border-slate-200 border-2 bg-slate-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl text-slate-900"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="password" className="text-sm font-bold text-slate-800">
                                    Contraseña
                                </Label>
                                <button type="button" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline uppercase tracking-tighter">
                                    Recuperar Clave
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-11 h-12 border-slate-200 border-2 bg-slate-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl text-slate-900"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col pt-2 pb-12 px-10">
                        <Button
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 text-base"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Autenticando...
                                </>
                            ) : (
                                "Ingresar al Sistema"
                            )}
                        </Button>
                        <div className="mt-8 flex items-center justify-center space-x-2">
                            <div className="h-px w-8 bg-slate-200" />
                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
                                TecMan Systems
                            </p>
                            <div className="h-px w-8 bg-slate-200" />
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
