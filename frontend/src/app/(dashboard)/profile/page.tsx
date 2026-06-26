'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, Mail, Phone, Send, Lock, Save } from 'lucide-react';
import { getAccessToken, setUser, getUser } from '@/lib/api';
import axios from 'axios';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = getAccessToken();
      const response = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getAccessToken();
      await axios.put(
        '/api/users/me',
        {
          name: user.name,
          phone: user.phone,
          telegramChatId: user.telegramChatId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos han sido guardados correctamente.',
      });
      // Update local storage if needed
      const localUser = getUser();
      setUser({ ...localUser, name: user.name });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      return toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
    }
    setLoading(true);

    try {
      const token = getAccessToken();
      await axios.put(
        '/api/users/me',
        {
          password: passwordData.new,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada.' });
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la contraseña.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y preferencias de notificación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu nombre y datos de contacto.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-10"
                      value={user.name}
                      onChange={(e) => setUser({ ...user, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input className="pl-10 bg-slate-50" value={user.email} disabled />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    El correo no puede ser modificado por el usuario.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-10"
                      value={user.phone || ''}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button type="submit" disabled={loading} className="rounded-xl">
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Cambia tu contraseña de acceso.</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="password"
                      className="pl-10"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="password"
                      className="pl-10"
                      value={passwordData.confirm}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirm: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button variant="outline" type="submit" disabled={loading} className="rounded-xl">
                  Actualizar Contraseña
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <Send className="w-5 h-5 mr-2" />
                Telegram
              </CardTitle>
              <CardDescription>Conecta tu cuenta para recibir notificaciones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chat ID</Label>
                <Input
                  placeholder="Ej. 12345678"
                  value={user.telegramChatId || ''}
                  onChange={(e) => setUser({ ...user, telegramChatId: e.target.value })}
                />
              </div>
              <div className="text-[11px] text-blue-600/80 space-y-2">
                <p>1. Busca al bot de la empresa en Telegram.</p>
                <p>
                  2. Envía el comando <b>/start</b> para obtener tu ID.
                </p>
                <p>3. Pega tu ID aquí para vincular tu cuenta.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rol de Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 inline-block uppercase tracking-wider">
                {user.role?.name}
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                Tus permisos actuales te permiten acceder a los módulos de{' '}
                {user.role?.name.toLowerCase()}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
