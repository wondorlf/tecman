import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RolesGuard } from './common/guards/roles.guard.js';

// Common
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';

// Core modules
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AssetsModule } from './modules/assets/assets.module.js';
import { MaintenanceModule } from './modules/maintenance/maintenance.module.js';
import { ChecklistsModule } from './modules/checklists/checklists.module.js';
import { CustodiesModule } from './modules/custodies/custodies.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';
import { KitsModule } from './modules/kits/kits.module.js';
import { TagsModule } from './modules/tags/tags.module.js';
import { DiscoveryModule } from './modules/discovery/discovery.module.js';
import { SlasModule } from './modules/slas/slas.module.js';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module.js';
import { ChangeRequestsModule } from './modules/change-requests/change-requests.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { AlertsModule } from './modules/alerts/alerts.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';
import { SuppliersModule } from './modules/suppliers/suppliers.module.js';

// Common
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';

import { AdminPanelModule } from './modules/admin/admin-panel.module.js';

import { StorageModule } from './modules/storage/storage.module.js';
import { TicketsModule } from './modules/tickets/tickets.module.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { LdapModule } from './modules/ldap/ldap.module.js';
import { KnowledgeModule } from './modules/knowledge/knowledge.module.js';
import { AgentsModule } from './modules/agents/agents.module.js';
import { FixScriptsModule } from './modules/fix-scripts/fix-scripts.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';

import { existsSync } from 'fs';

// Determinar las rutas correctas dependiendo de si se ejecuta desde la raíz o desde /backend
const isRootCwd = existsSync(join(process.cwd(), 'backend'));
const rootEnvPath = isRootCwd ? join(process.cwd(), '.env') : join(process.cwd(), '..', '.env');
const frontendOutPath = isRootCwd
  ? join(process.cwd(), 'frontend', 'out')
  : join(process.cwd(), '..', 'frontend', 'out');

@Module({
  imports: [
    // Configuration - Only use root .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [rootEnvPath],
    }),

    // Rate limiting — defaults: 60 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    // Scheduler (cron jobs)
    ScheduleModule.forRoot(),

    ServeStaticModule.forRoot({
      rootPath: frontendOutPath,
      exclude: ['/api/*path', '/admin/*path'],
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    AssetsModule,
    MaintenanceModule,
    ChecklistsModule,
    DocumentsModule,
    AlertsModule,
    CustodiesModule,
    BookingsModule,
    KitsModule,
    TagsModule,
    DiscoveryModule,
    SlasModule,
    ServiceCatalogModule,
    ChangeRequestsModule,
    DashboardModule,
    CategoriesModule,
    LocationsModule,
    SuppliersModule,
    AdminPanelModule,
    StorageModule,
    NotificationsModule,
    TicketsModule,
    TenantsModule,
    LdapModule,
    KnowledgeModule,
    AgentsModule,
    FixScriptsModule,
    AnalyticsModule,
  ],
  providers: [
    // Global JWT guard — must be first
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Roles guard — runs after JWT validates the token
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global Throttler guard — rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global audit interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
