'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, Palette, Globe, MessageSquare, Save, Upload } from 'lucide-react';
import { getAccessToken } from '@/lib/api';
import axios from 'axios';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = getAccessToken();
      const response = await axios.get('/api/tenants/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getAccessToken();
      await axios.patch(`/api/tenants/settings/${settings.id}`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han aplicado correctamente.',
      });
      // Notify sidebar and other components to refresh branding
      window.dispatchEvent(new CustomEvent('tenant-updated'));
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  if (!settings)
    return (
      <div className="p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground">
          Administra la identidad visual y las integraciones de TecMan.
        </p>
      </div>

      <form onSubmit={handleUpdate}>
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger
              value="branding"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Palette className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger
              value="portal"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Globe className="w-4 h-4 mr-2" />
              Portal de Soporte
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Integraciones
            </TabsTrigger>
            <TabsTrigger
              value="ldap"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Globe className="w-4 h-4 mr-2" />
              Directorio Activo (LDAP)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identidad Visual</CardTitle>
                <CardDescription>
                  Personaliza los colores y logotipos de tu instancia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nombre de la Plataforma</Label>
                    <Input
                      value={settings.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logotipo de la Plataforma</Label>
                    <div className="flex gap-2">
                      <Input
                        value={settings.logoUrl || ''}
                        onChange={(e) => handleChange('logoUrl', e.target.value)}
                        placeholder="https://... o sube un archivo"
                        className="flex-1"
                      />
                      <Label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        Subir
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            // Validate client-side
                            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            const allowedExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
                            if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext || '')) {
                              toast({ title: 'Formato no soportado', description: 'Solo JPG, PNG, WebP, GIF y SVG.', variant: 'destructive' });
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              toast({ title: 'Archivo muy grande', description: `Máximo 5 MB. Este archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB.`, variant: 'destructive' });
                              return;
                            }
                            const fd = new FormData();
                            fd.append('file', file);
                            try {
                              const res = await axios.post('/api/storage/public-upload', fd);
                              handleChange('logoUrl', res.data.url);
                              toast({ title: 'Logo subido exitosamente' });
                            } catch (err: any) {
                              const msg = err?.response?.data?.message || 'Error al subir logo';
                              toast({ title: 'Error', description: msg, variant: 'destructive' });
                            }
                          }}
                        />
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={settings.primaryColor}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={settings.secondaryColor}
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Vista previa del logo */}
                {settings.logoUrl && (
                  <div className="pt-4 border-t border-slate-100">
                    <Label className="text-xs font-semibold text-slate-600 mb-2 block">
                      Vista previa del logo
                    </Label>
                    <img
                      src={settings.logoUrl}
                      alt="Logo preview"
                      className="h-10 object-contain rounded-lg border border-slate-200 p-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Datos de la Empresa para PDFs e Informes ── */}
            <Card>
              <CardHeader>
                <CardTitle>Datos de la Empresa</CardTitle>
                <CardDescription>
                  Estos datos aparecerán en los PDFs de Hoja de Vida, reportes e informes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Razón Social</Label>
                    <Input
                      value={settings.companyName || ''}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="Ej. Mi Empresa S.A.S."
                    />
                    <p className="text-[10px] text-slate-400">
                      Nombre legal de la empresa para facturación e informes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>NIT / RUT / Documento</Label>
                    <Input
                      value={settings.companyDocument || ''}
                      onChange={(e) => handleChange('companyDocument', e.target.value)}
                      placeholder="Ej. 900.000.000-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo de la Empresa</Label>
                    <div className="flex gap-2">
                      <Input
                        value={settings.companyLogoUrl || ''}
                        onChange={(e) => handleChange('companyLogoUrl', e.target.value)}
                        placeholder="https://... o sube un archivo"
                        className="flex-1"
                      />
                      <Label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        Subir
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            // Validate client-side
                            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            const allowedExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
                            if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext || '')) {
                              toast({ title: 'Formato no soportado', description: 'Solo JPG, PNG, WebP, GIF y SVG.', variant: 'destructive' });
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              toast({ title: 'Archivo muy grande', description: `Máximo 5 MB. Este archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB.`, variant: 'destructive' });
                              return;
                            }
                            const fd = new FormData();
                            fd.append('file', file);
                            try {
                              const res = await axios.post('/api/storage/public-upload', fd);
                              handleChange('companyLogoUrl', res.data.url);
                              toast({ title: 'Logo subido exitosamente' });
                            } catch (err: any) {
                              const msg = err?.response?.data?.message || 'Error al subir logo';
                              toast({ title: 'Error', description: msg, variant: 'destructive' });
                            }
                          }}
                        />
                      </Label>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Este logo aparecerá en los PDFs generados
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      value={settings.companyAddress || ''}
                      onChange={(e) => handleChange('companyAddress', e.target.value)}
                      placeholder="Ej. Cra 50 #10-20, Bogotá"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={settings.companyPhone || ''}
                      onChange={(e) => handleChange('companyPhone', e.target.value)}
                      placeholder="Ej. +57 601 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Corporativo</Label>
                    <Input
                      type="email"
                      value={settings.companyEmail || ''}
                      onChange={(e) => handleChange('companyEmail', e.target.value)}
                      placeholder="Ej. contacto@miempresa.com"
                    />
                  </div>
                </div>

                {/* Vista previa del logo empresa */}
                {settings.companyLogoUrl && (
                  <div className="pt-4 border-t border-slate-100">
                    <Label className="text-xs font-semibold text-slate-600 mb-2 block">
                      Vista previa del logo para PDF
                    </Label>
                    <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
                      <img
                        src={settings.companyLogoUrl}
                        alt="Company logo preview"
                        className="h-12 object-contain rounded-lg border border-slate-200 p-1 bg-white"
                      />
                      <div className="text-xs text-slate-400">
                        <p className="font-semibold text-slate-700">
                          {settings.companyName || 'Nombre de empresa'}
                        </p>
                        <p>{settings.companyDocument || 'NIT'}</p>
                        <p>{settings.companyAddress || 'Dirección'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portal Público de Soporte</CardTitle>
                <CardDescription>
                  Configura lo que verán tus usuarios finales al solicitar soporte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Título del Portal</Label>
                  <Input
                    value={settings.supportPortalTitle}
                    onChange={(e) => handleChange('supportPortalTitle', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo / Instrucciones</Label>
                  <Input
                    value={settings.supportPortalSubtitle}
                    onChange={(e) => handleChange('supportPortalSubtitle', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Fondo (Background)</Label>
                  <Input
                    value={settings.supportPortalBackgroundUrl || ''}
                    onChange={(e) => handleChange('supportPortalBackgroundUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            {/* ── Discovery Agent ── */}
            <Card>
              <CardHeader>
                <CardTitle>Discovery Agent</CardTitle>
                <CardDescription>
                  API Key para autenticar los agentes de discovery de hardware.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Discovery API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={settings.discoveryApiKey || ''}
                      onChange={(e) => handleChange('discoveryApiKey', e.target.value)}
                      placeholder="Deja vacío para usar el valor de DISCOVERY_API_KEY en .env"
                      className="font-mono text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Los agentes de discovery usan esta clave en el header <code className="bg-slate-100 px-1 rounded">X-API-Key</code>.
                    Si está vacía, se usará el valor de la variable de entorno <code className="bg-slate-100 px-1 rounded">DISCOVERY_API_KEY</code>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    className="rounded-xl h-8 text-xs"
                    onClick={async () => {
                      const key = crypto.randomUUID ? crypto.randomUUID() : 
                        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                          const r = (Math.random() * 16) | 0;
                          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
                        });
                      handleChange('discoveryApiKey', key);
                    }}
                  >
                    Generar clave segura
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Telegram Bot</CardTitle>
                <CardDescription>
                  Configura las notificaciones automáticas vía Telegram.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="telegram-notifications" className="flex flex-col space-y-1">
                    <span>Habilitar Notificaciones</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Envía alertas y avisos de tickets por Telegram.
                    </span>
                  </Label>
                  <Switch
                    id="telegram-notifications"
                    checked={settings.telegramNotificationsEnabled}
                    onCheckedChange={(val) => handleChange('telegramNotificationsEnabled', val)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bot Token (HTTP API)</Label>
                  <Input
                    type="password"
                    value={settings.telegramBotToken || ''}
                    onChange={(e) => handleChange('telegramBotToken', e.target.value)}
                    placeholder="123456789:ABCDefGhIjKlMnOpQrStUvWxYz"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Consigue tu token hablando con @BotFather en Telegram.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Chat ID de Administración (Global)</Label>
                  <Input
                    value={settings.telegramChatId || ''}
                    onChange={(e) => handleChange('telegramChatId', e.target.value)}
                    placeholder="Ej. -100123456789"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    ID del grupo o canal donde se recibirán todos los tickets nuevos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ldap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Active Directory / LDAP</CardTitle>
                <CardDescription>
                  Sincroniza usuarios y equipos desde tu servidor de dominio Windows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="ldap-enabled" className="flex flex-col space-y-1">
                    <span>Habilitar Sincronización LDAP</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Permite importar usuarios y equipos del dominio.
                    </span>
                  </Label>
                  <Switch
                    id="ldap-enabled"
                    checked={settings.ldapEnabled}
                    onCheckedChange={(val) => handleChange('ldapEnabled', val)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>URL del Servidor LDAP</Label>
                    <Input
                      placeholder="ldap://192.168.1.10:389"
                      value={settings.ldapUrl || ''}
                      onChange={(e) => handleChange('ldapUrl', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base DN</Label>
                    <Input
                      placeholder="DC=empresa,DC=local"
                      value={settings.ldapBaseDn || ''}
                      onChange={(e) => handleChange('ldapBaseDn', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usuario de Enlace (Bind DN)</Label>
                    <Input
                      placeholder="CN=Admin,CN=Users,DC=empresa,DC=local"
                      value={settings.ldapBindDn || ''}
                      onChange={(e) => handleChange('ldapBindDn', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña de Enlace</Label>
                    <Input
                      type="password"
                      value={settings.ldapBindPassword || ''}
                      onChange={(e) => handleChange('ldapBindPassword', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Filtro de Usuarios</Label>
                    <Input
                      value={settings.ldapUserFilter || ''}
                      onChange={(e) => handleChange('ldapUserFilter', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Filtro de Grupos/Equipos</Label>
                    <Input
                      value={settings.ldapGroupFilter || ''}
                      onChange={(e) => handleChange('ldapGroupFilter', e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-4">
                  <Button
                    variant="outline"
                    type="button"
                    className="rounded-xl"
                    onClick={async () => {
                      try {
                        const token = getAccessToken();
                        await axios.post(
                          '/api/ldap/test',
                          {},
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        toast({ title: 'Conexión LDAP Exitosa' });
                      } catch (e) {
                        toast({ title: 'Error de Conexión', variant: 'destructive' });
                      }
                    }}
                  >
                    Probar Conexión
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    className="rounded-xl"
                    onClick={async () => {
                      try {
                        const token = getAccessToken();
                        toast({ title: 'Sincronización iniciada...' });
                        const resUsers = await axios.post(
                          '/api/ldap/sync/users',
                          {},
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        const resComps = await axios.post(
                          '/api/ldap/sync/computers',
                          {},
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        toast({
                          title: 'Sincronización Completada',
                          description: `Se importaron ${resUsers.data.count} usuarios y ${resComps.data.count} equipos.`,
                        });
                      } catch (e) {
                        toast({ title: 'Error al sincronizar', variant: 'destructive' });
                      }
                    }}
                  >
                    Sincronizar Ahora
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={loading} size="lg" className="rounded-xl">
            {loading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
