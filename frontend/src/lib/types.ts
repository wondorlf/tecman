// ── Enums ─────────────────────────────────────────────────────────────────────
export type AssetStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'DISPOSED' | 'RESERVED';
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
export type MaintenanceStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertType = 'MAINTENANCE_DUE' | 'WARRANTY_EXPIRY' | 'LIFECYCLE_END' | 'CUSTOM';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_USER' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'ACCESS' | 'OTHER';
export type DocumentType =
  | 'MANUAL'
  | 'CERTIFICATE'
  | 'WARRANTY'
  | 'INVOICE'
  | 'TECHNICAL_SHEET'
  | 'TUTORIAL'
  | 'IMAGE'
  | 'VIDEO'
  | 'MAINTENANCE'
  | 'OTHER';
export type EventType =
  | 'CREATED'
  | 'STATUS_CHANGE'
  | 'MAINTENANCE'
  | 'FAILURE'
  | 'AUDIT'
  | 'LOCATION_CHANGE'
  | 'DOCUMENT_ADDED'
  | 'CUSTOM';

// ── Models ────────────────────────────────────────────────────────────────────
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  active: boolean;
  role: Role;
  roleId: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  children?: Category[];
  _count?: { assets: number };
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Location {
  id: string;
  name: string;
  code?: string;
  address?: string;
  floor?: string;
  room?: string;
  parentId?: string;
  children?: Location[];
}

export interface Supplier {
  id: string;
  name: string;
  taxId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus;
  acquisitionDate?: string;
  acquisitionCost?: number;
  warrantyExpiry?: string;
  expectedLifeCycle?: number;
  usageHours: number;
  usageCycles: number;
  qrCode: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  categoryId: string;
  subcategory?: Subcategory;
  location: Location;
  locationId: string;
  supplier?: Supplier;
  discoveredDevice?: {
    id: string;
    hostname: string;
    macAddress: string;
    ipAddress?: string;
    os?: string;
    lastSeenAt: string;
  };
}

export interface HojaVidaEvent {
  id: string;
  type: EventType;
  description: string;
  data?: string;
  createdAt: string;
}

export interface Evidence {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'SIGNATURE';
  path: string;
  filename: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  code: string;
  assetId: string;
  type: MaintenanceType;
  priority: Priority;
  status: MaintenanceStatus;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  description?: string;
  diagnosis?: string;
  solution?: string;
  cost?: number;
  createdAt: string;
  asset?: Pick<Asset, 'id' | 'code' | 'name'>;
  technician?: Pick<User, 'id' | 'name'>;
  checklist?: Checklist;
  evidence?: Evidence[];
}

export interface ChecklistItem {
  id: string;
  order: number;
  label: string;
  description?: string;
  type: string;
  required: boolean;
  options?: string;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  maintenanceType?: MaintenanceType;
  active: boolean;
  items: ChecklistItem[];
}

export interface Alert {
  id: string;
  assetId: string;
  type: AlertType;
  priority: Priority;
  title: string;
  message: string;
  dueDate?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  asset?: Pick<Asset, 'id' | 'code' | 'name'>;
  assignee?: Pick<User, 'id' | 'name'>;
}

export interface TicketMessage {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user: Pick<User, 'id' | 'name'>;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  creator?: Pick<User, 'id' | 'name' | 'email'> & { phone?: string; username?: string };
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
  asset?: Pick<Asset, 'id' | 'code' | 'name'>;
  messages?: TicketMessage[];
  // Solución formal
  solution?: string;
  // CSAT post-resolución
  csatScore?: number;
  csatComment?: string;
  csatAnsweredAt?: string;
  // Creador del portal público
  reportedUser?: string;
  creatorName?: string;
  creatorPhone?: string;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  path: string;
  filename: string;
  mimeType: string;
  size: number;
  version: number;
  assetId?: string;
  isPublic?: boolean;
  createdAt: string;
}

// ── FASE 2: CUSTODIAS, RESERVAS, KITS, TAGS ───────────────────────────────────

export interface Custody {
  id: string;
  assetId: string;
  userId: string;
  assignedAt: string;
  returnedAt: string | null;
  notes: string | null;
  asset?: Asset;
  user?: User;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_OUT' | 'RETURNED' | 'CANCELLED';

export interface Booking {
  id: string;
  assetId: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  asset?: Asset;
  user?: User;
}

export interface Kit {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  parentAsset?: Asset | null;
  items?: KitItem[];
  _count?: { items: number };
}

export interface KitItem {
  id: string;
  kitId: string;
  assetId: string;
  addedAt: string;
  asset?: Asset;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  _count?: { assets: number };
}

// ── FASE 3: ITSM (SLA, SERVICE CATALOG, RFC, DISCOVERY) ──────────────────────

export interface Sla {
  id: string;
  name: string;
  description: string | null;
  resolutionHours: number;
  responseHours: number;
  active: boolean;
}

export interface ServiceCatalog {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string; // "REQUEST" | "INCIDENT"
  active: boolean;
}

export interface ChangeRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  justification: string;
  riskLevel: string; // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  status: string; // "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "IMPLEMENTED"
  scheduledStart: string | null;
  scheduledEnd: string | null;
  requesterId: string;
  ticketId: string | null;
  createdAt: string;
  requester?: User;
}

export interface DiscoveredDevice {
  id: string;
  macAddress: string;
  hostname: string;
  ipAddress: string | null;
  os: string | null;
  cpuModel: string | null;
  cpuCores: number | null;
  ramTotalBytes: number | null;
  diskTotalBytes: number | null;
  diskUsedBytes: number | null;
  lastSeenAt: string;
  createdAt: string;
  assetId: string | null;
}

export interface DashboardStats {
  assetsCount: number;
  pendingMaint: number;
  activeAlerts: number;
  usersCount: number;
  assetsByStatus?: { status: string; _count: { status: number } }[];
  maintenanceByType?: { type: string; _count: { type: number } }[];
}

// ── Respuesta paginada del backend ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Resultado de importación XLSX ─────────────────────────────────────────────
export interface ImportResult {
  created: number;
  errors: string[];
}

// ── Label helpers ─────────────────────────────────────────────────────────────
export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVE: 'Activo',
  MAINTENANCE: 'En mantenimiento',
  INACTIVE: 'Inactivo',
  DISPOSED: 'Dado de baja',
  RESERVED: 'Reservado',
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PREDICTIVE: 'Predictivo',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PENDING: 'Pendiente',
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  MAINTENANCE_DUE: 'Mantenimiento pendiente',
  WARRANTY_EXPIRY: 'Garantía por vencer',
  LIFECYCLE_END: 'Fin de vida útil',
  CUSTOM: 'Personalizada',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En proceso',
  WAITING_ON_USER: 'Esperando usuario',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  NETWORK: 'Red',
  ACCESS: 'Acceso',
  OTHER: 'Otro',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  MANUAL: 'Manual',
  CERTIFICATE: 'Certificado',
  WARRANTY: 'Garantía',
  INVOICE: 'Factura',
  TECHNICAL_SHEET: 'Ficha técnica',
  TUTORIAL: 'Tutorial',
  IMAGE: 'Imagen',
  VIDEO: 'Video',
  MAINTENANCE: 'Mantenimiento',
  OTHER: 'Otro',
};

// ── Additional Models ────────────────────────────────────────────────────────
export interface TenantSettings {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  companyLogoUrl: string | null;
  companyDocument: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  supportPortalTitle: string;
  supportPortalSubtitle: string;
  supportPortalBackgroundUrl: string | null;
  ldapEnabled: boolean;
  maxUploadSize: number;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  difficulty: string;
  estimatedMinutes: number;
  views: number;
  helpful: number;
  categoryId: string;
  category?: KnowledgeCategory;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMetrics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  lastSyncAt: string | null;
}

export interface DiscoveryStats {
  total: number;
  newToday: number;
  matched: number;
  unmatched: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string;
  _count?: { users: number };
  createdAt?: string;
  updatedAt?: string;
}
