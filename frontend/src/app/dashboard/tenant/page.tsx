'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import { PageHeader, LoadingSpinner } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Palette, Settings, Globe, MessageCircle, ShieldCheck, Save, Upload } from 'lucide-react';
import axios from 'axios';

export default function TenantPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const r = await tenantsApi.getSettings();
      return r.data as any;
    },
  });

  const [form, setForm] = useState<any>(null);

  // Initialize form when tenant data loads
  if (tenant && !form) {
    setForm({
      name: tenant.name || 'TecMan',
      logoUrl: tenant.logoUrl || '',
      primaryColor: tenant.primaryColor || '#16a34a',
      secondaryColor: tenant.secondaryColor || '#0f172a',
      supportPortalTitle: tenant.supportPortalTitle || '',
      supportPortalSubtitle: tenant.supportPortalSubtitle || '',
      supportPortalBackgroundUrl: tenant.supportPortalBackgroundUrl || '',

      // Telegram
      telegramBotToken: tenant.telegramBotToken || '',
      telegramChatId: tenant.telegramChatId || '',
      telegramNotificationsEnabled: tenant.telegramNotificationsEnabled || false,

      // LDAP
      ldapEnabled: tenant.ldapEnabled || false,
      ldapUrl: tenant.ldapUrl || '',
      ldapBindDn: tenant.ldapBindDn || '',
      ldapBindPassword: tenant.ldapBindPassword || '',
      ldapBaseDn: tenant.ldapBaseDn || '',
      ldapUserFilter: tenant.ldapUserFilter || '(&(objectClass=user)(objectCategory=person))',
      ldapGroupFilter: tenant.ldapGroupFilter || '(objectClass=group)',
    });
  }

  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!tenant?.id || !form) return;
    setSaving(true);
    try {
      await tenantsApi.updateSettings(tenant.id, form);
      toast({ title: 'Configuración guardada exitosamente' });
      qc.invalidateQueries({ queryKey: ['tenant-settings'] });
      // Notify sidebar and other components to refresh branding immediately
      window.dispatchEvent(new CustomEvent('tenant-updated'));
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.response?.data?.message || 'No se pudo guardar',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!form) return <LoadingSpinner label="Preparando formulario..." />;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Configuración del Sistema"
        subtitle="Personalización de marca, notificaciones e integraciones"
      />

      <Tabs defaultValue="branding">
        <TabsList className="mb-4">
          <TabsTrigger value="branding">
            <Palette size={13} className="mr-1.5" />
            Marca
          </TabsTrigger>
          <TabsTrigger value="telegram">
            <MessageCircle size={13} className="mr-1.5" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value="ldap">
            <Globe size={13} className="mr-1.5" />
            LDAP / AD
          </TabsTrigger>
        </TabsList>

        {/* ── Branding Tab ── */}
        <TabsContent value="branding">
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Palette size={16} /> Personalización de Marca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Nombre del sistema</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => f('name', e.target.value)}
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Logo de la plataforma</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.logoUrl}
                      onChange={(e) => f('logoUrl', e.target.value)}
                      placeholder="https://... o sube un archivo"
                      className="h-9 rounded-xl text-sm flex-1"
                    />
                    <Label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-colors shrink-0 h-9">
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
                            f('logoUrl', res.data.url);
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
              </div>

                {/* Preview del logo */}
                {form.logoUrl && (
                  <div className="pt-2 border-t border-slate-100">
                    <Label className="text-xs font-semibold text-slate-500 mb-2 block">
                      Vista previa del logo
                    </Label>
                    <img
                      src={form.logoUrl}
                      alt="Logo preview"
                      className="h-10 object-contain rounded-lg border border-slate-200 p-1 bg-white"
                    />
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Color primario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => f('primaryColor', e.target.value)}
                      className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-1"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={(e) => f('primaryColor', e.target.value)}
                      className="h-9 rounded-xl text-sm flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Color secundario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => f('secondaryColor', e.target.value)}
                      className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-1"
                    />
                    <Input
                      value={form.secondaryColor}
                      onChange={(e) => f('secondaryColor', e.target.value)}
                      className="h-9 rounded-xl text-sm flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Título del portal de soporte
                </Label>
                <Input
                  value={form.supportPortalTitle}
                  onChange={(e) => f('supportPortalTitle', e.target.value)}
                  placeholder="Mesa de Ayuda TI"
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Subtítulo del portal de soporte
                </Label>
                <Textarea
                  value={form.supportPortalSubtitle}
                  onChange={(e) => f('supportPortalSubtitle', e.target.value)}
                  rows={2}
                  className="text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  URL imagen de fondo del portal
                </Label>
                <Input
                  value={form.supportPortalBackgroundUrl}
                  onChange={(e) => f('supportPortalBackgroundUrl', e.target.value)}
                  placeholder="https://..."
                  className="h-9 rounded-xl text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Telegram Tab ── */}
        <TabsContent value="telegram">
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MessageCircle size={16} /> Notificaciones por Telegram
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.telegramNotificationsEnabled}
                  onCheckedChange={(v) => f('telegramNotificationsEnabled', v)}
                />
                <Label className="text-xs font-semibold text-slate-600 cursor-pointer">
                  Notificaciones habilitadas
                </Label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Token del Bot (BotFather)
                </Label>
                <Input
                  value={form.telegramBotToken}
                  onChange={(e) => f('telegramBotToken', e.target.value)}
                  type="password"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="h-9 rounded-xl text-sm font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Crea un bot en{' '}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @BotFather
                  </a>{' '}
                  y pega el token aquí.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Chat ID del grupo/admin
                </Label>
                <Input
                  value={form.telegramChatId}
                  onChange={(e) => f('telegramChatId', e.target.value)}
                  placeholder="-1001234567890"
                  className="h-9 rounded-xl text-sm font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  ID del grupo donde se enviarán notificaciones de nuevos tickets.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LDAP Tab ── */}
        <TabsContent value="ldap">
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Globe size={16} /> Integración LDAP / Active Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.ldapEnabled} onCheckedChange={(v) => f('ldapEnabled', v)} />
                <Label className="text-xs font-semibold text-slate-600 cursor-pointer">
                  LDAP habilitado
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">
                    URL del servidor LDAP
                  </Label>
                  <Input
                    value={form.ldapUrl}
                    onChange={(e) => f('ldapUrl', e.target.value)}
                    placeholder="ldap://192.168.1.10:389"
                    className="h-9 rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Base DN</Label>
                  <Input
                    value={form.ldapBaseDn}
                    onChange={(e) => f('ldapBaseDn', e.target.value)}
                    placeholder="dc=empresa,dc=local"
                    className="h-9 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Bind DN</Label>
                  <Input
                    value={form.ldapBindDn}
                    onChange={(e) => f('ldapBindDn', e.target.value)}
                    placeholder="cn=admin,dc=empresa,dc=local"
                    className="h-9 rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Bind Password</Label>
                  <Input
                    value={form.ldapBindPassword}
                    onChange={(e) => f('ldapBindPassword', e.target.value)}
                    type="password"
                    className="h-9 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Filtro de usuarios</Label>
                  <Input
                    value={form.ldapUserFilter}
                    onChange={(e) => f('ldapUserFilter', e.target.value)}
                    className="h-9 rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Filtro de grupos</Label>
                  <Input
                    value={form.ldapGroupFilter}
                    onChange={(e) => f('ldapGroupFilter', e.target.value)}
                    className="h-9 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 text-sm gap-2"
        >
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
}
