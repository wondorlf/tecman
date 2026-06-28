'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Search, Image as ImageIcon, CheckCircle2, Monitor, Camera, X, Upload } from 'lucide-react';
import axios from 'axios';
import { PublicLayout } from '@/components/shared/PublicLayout';
import PublicChatbot from '@/components/public-chatbot';

function SupportPortalContent() {
  const [activeTab, setActiveTab] = useState<'new' | 'tracking'>('new');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [successCode, setSuccessCode] = useState<string | null>(null);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Agent/Domain states
  const [macAddress, setMacAddress] = useState<string | null>(null);
  const [reportedUser, setReportedUser] = useState<string | null>(null);

  // Tracking states
  const [searchCode, setSearchCode] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<any>(null);

  useEffect(() => {
    fetchBranding();
    const mac = searchParams?.get('mac') ?? null;
    const user = searchParams?.get('user') ?? null;
    if (mac) setMacAddress(mac);
    if (user) {
      setReportedUser(user);
      if (!name) setName(user);
    }
  }, [searchParams]);

  const fetchBranding = async () => {
    try {
      const response = await axios.get('/api/tenants/public');
      setBranding(response.data);
    } catch (error) {
      console.error('Error fetching branding:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'Solo se permiten imágenes (JPG, PNG, WebP, GIF)', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'La imagen no debe superar 5MB', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !description) {
      toast({ title: 'Completa los campos obligatorios', variant: 'destructive' });
      return;
    }
    if (!/^\d{7,10}$/.test(phone.replace(/[^\d]/g, ''))) {
      toast({ title: 'El celular debe tener entre 7 y 10 dígitos', variant: 'destructive' });
      return;
    }

    setLoading(true);
    let imageUrl = '';

    // Upload image first if selected
    if (selectedFile) {
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await axios.post('/api/storage/public-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data.url;
      } catch (uploadError: any) {
        toast({
          title: 'Error al subir imagen',
          description: uploadError.response?.data?.message || 'Intenta de nuevo',
          variant: 'destructive',
        });
        setLoading(false);
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    try {
      const response = await axios.post('/api/tickets/public', {
        title: `Solicitud de ${name}`,
        description:
          `Contacto: ${phone}\nCargo: ${position}\n\nFalla: ${description}` +
          (imageUrl ? `\n\n📷 Imagen adjunta: ${window.location.origin}${imageUrl}` : ''),
        category: category || 'OTHER',
        reportedUser: reportedUser,
        macAddress: macAddress,
        creatorName: name,
        creatorPhone: phone,
      });
      setSuccessCode(response.data.code);
      toast({
        title: 'Ticket generado',
        description: `Tu ticket ${response.data.code} ha sido creado correctamente.`,
      });
      handleRemoveFile();
      setName(reportedUser || '');
      setPhone('');
      setPosition('');
      setCategory('');
      setDescription('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo generar el ticket. Por favor intenta más tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode) return;
    setLoading(true);
    setTrackedTicket(null);
    try {
      const response = await axios.get(`/api/tickets/public/track/${searchCode}`);
      setTrackedTicket(response.data);
    } catch (error: any) {
      toast({
        title: 'No encontrado',
        description: 'No encontramos un ticket con ese código.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = branding?.primaryColor || '#16a34a';

  // ── Success screen ─────────────────────────────────────────────────────────
  if (successCode) {
    return (
      <PublicLayout showBack backLabel="Inicio" maxWidth="max-w-lg">      <div className="flex items-center justify-center min-h-[60vh] sm:min-h-[70vh] px-2">
          <Card className="w-full p-5 sm:p-8 text-center space-y-4 sm:space-y-6 border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.07)] rounded-2xl sm:rounded-3xl">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 px-2">¡Ticket Generado con Éxito!</h2>
              <p className="text-slate-500 text-sm sm:text-base">
                Guarda este código para hacer seguimiento a tu solicitud:
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-2xl text-xl sm:text-3xl font-mono font-bold text-slate-800 tracking-wider break-all">
                {successCode}
              </div>
            </div>
            <Button
              id="success-new-ticket"
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold rounded-xl"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setSuccessCode(null)}
            >
              Generar otro ticket
            </Button>
            <Button
              id="success-track"
              variant="ghost"
              className="w-full text-sm sm:text-base"
              onClick={() => {
                setSuccessCode(null);
                setActiveTab('tracking');
              }}
            >
              Hacer seguimiento
            </Button>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <PublicLayout showBack backLabel="Inicio" maxWidth="max-w-4xl">
      <div className="pt-6 sm:pt-12 pb-6 w-full max-w-full">
        {/* Page header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-10 space-y-2 sm:space-y-3 px-2">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight px-2">
              {branding?.supportPortalTitle || 'Mesa de Ayuda TI'}
            </h1>
            <p className="text-slate-500 mt-1.5 sm:mt-2 text-sm sm:text-base max-w-lg mx-auto px-4">
              {branding?.supportPortalSubtitle ||
                'Sistema de seguimiento y mantenimiento de activos físicos'}
            </p>
          </div>
        </div>

        {/* Agent info banner */}
        {macAddress && (
          <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-100 p-2.5 sm:p-3 rounded-xl flex items-center justify-between text-blue-700 animate-in fade-in slide-in-from-top-2 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <div className="text-[11px] sm:text-xs min-w-0">
                <p className="font-bold truncate">Equipo Detectado</p>
                <p className="font-mono truncate text-[10px] sm:text-xs">
                  {macAddress} {reportedUser ? `(${reportedUser})` : ''}
                </p>
              </div>
            </div>
            <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-1.5 sm:px-2 py-0.5 rounded shrink-0">
              Vinculación Automática
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-slate-100/50 p-1 rounded-xl sm:rounded-2xl flex w-full max-w-sm sm:max-w-md shadow-inner border border-slate-200">
            <button
              id="tab-new"
              onClick={() => setActiveTab('new')}
              className={`flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all text-xs sm:text-sm ${
                activeTab === 'new'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Nuevo Ticket</span>
            </button>
            <button
              id="tab-tracking"
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all text-xs sm:text-sm ${
                activeTab === 'tracking'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Seguimiento</span>
            </button>
          </div>
        </div>

        {/* Content card */}
        <Card className="mx-auto max-w-3xl border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-2xl sm:rounded-3xl overflow-hidden w-full">
          <CardContent className="p-5 sm:p-8 md:p-12">
            {activeTab === 'new' ? (
              <form onSubmit={handleCreateTicket} className="space-y-5 sm:space-y-8">
                <div className="space-y-1.5 sm:space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Solicitar Soporte</h2>
                  <p className="text-slate-500 text-sm sm:text-base">
                    Complete el formulario para generar un nuevo ticket de atención.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-bold text-slate-700">Nombre Completo</Label>
                    <Input
                      id="support-name"
                      placeholder="Ej. Juan Pérez"
                      className="h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-bold text-slate-700">Celular</Label>
                    <Input
                      id="support-phone"
                      placeholder="Ej. 300 123 4567"
                      className="h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-bold text-slate-700">Cargo / Dependencia</Label>
                    <Input
                      id="support-position"
                      placeholder="Ej. Enfermería"
                      className="h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-bold text-slate-700">
                      Categoría de la Solicitud
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger
                        id="support-category"
                        className="h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-sm"
                      >
                        <SelectValue placeholder="Soporte Técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HARDWARE">Hardware</SelectItem>
                        <SelectItem value="SOFTWARE">Software</SelectItem>
                        <SelectItem value="NETWORK">Red / Conectividad</SelectItem>
                        <SelectItem value="ACCESS">Accesos / Usuarios</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-slate-700">Requerimiento o Falla</Label>
                  <Textarea
                    id="support-description"
                    placeholder="Describa detalladamente el problema que presenta..."
                    className="min-h-[100px] sm:min-h-[120px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all resize-none text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-slate-700">
                    Adjuntar Imagen / Tomar Foto (Opcional)
                  </Label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium group-hover:text-blue-600 transition-colors">
                        Tomar foto o seleccionar archivo
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400">JPG, PNG, WebP — hasta 5MB</p>
                    </button>
                  ) : (
                    <div className="relative border-2 border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/30">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-36 sm:h-48 object-cover"
                        />
                      )}
                      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                          <span className="text-[10px] sm:text-xs text-slate-600 font-medium truncate max-w-[120px] sm:max-w-[200px]">
                            {selectedFile.name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 shrink-0">
                            ({(selectedFile.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {uploadingFile && (
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-blue-600">
                      <Loader2 className="animate-spin" size={11} />
                      Subiendo imagen...
                    </div>
                  )}
                </div>

                <Button
                  id="support-submit"
                  type="submit"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-black uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generar Ticket'}
                </Button>
              </form>
            ) : (
              <div className="space-y-5 sm:space-y-8">
                <div className="space-y-1.5 sm:space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Seguimiento de Ticket</h2>
                  <p className="text-slate-500 text-sm sm:text-base">
                    Ingresa el código de tu ticket para conocer su estado actual.
                  </p>
                </div>

                <form onSubmit={handleTrackTicket} className="flex flex-col md:flex-row gap-3 sm:gap-4">
                  <Input
                    id="track-code"
                    placeholder="Ej. TKT-0001"
                    className="h-12 sm:h-14 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-lg sm:text-xl font-mono uppercase text-center md:text-left"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    required
                  />
                  <Button
                    id="track-submit"
                    type="submit"
                    className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-base"
                    style={{ backgroundColor: primaryColor }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Consultar'}
                  </Button>
                </form>

                {trackedTicket && (
                  <div className="mt-6 sm:mt-8 border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-50 p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{trackedTicket.code}</h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                          {new Date(trackedTicket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest shrink-0 ${
                          trackedTicket.status === 'OPEN'
                            ? 'bg-blue-100 text-blue-700'
                            : trackedTicket.status === 'RESOLVED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {trackedTicket.status}
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      <div>
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em]">
                          Asunto
                        </Label>
                        <p className="font-semibold text-slate-800 text-sm sm:text-base">{trackedTicket.title}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em]">
                          Descripción
                        </Label>
                        <p className="text-slate-600 whitespace-pre-wrap text-xs sm:text-sm break-words">
                          {trackedTicket.description}
                        </p>
                      </div>
                      {trackedTicket.asset && (
                        <div className="pt-3 sm:pt-4 border-t border-slate-100">
                          <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em]">
                            Equipo Asociado
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-slate-700 truncate">
                              {trackedTicket.asset.name} ({trackedTicket.asset.code})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PublicChatbot />
    </PublicLayout>
  );
}

export default function SupportPortal() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={28} />
        </div>
      }
    >
      <SupportPortalContent />
    </Suspense>
  );
}
