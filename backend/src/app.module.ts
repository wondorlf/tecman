import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

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

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Serve frontend static files
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), '..', 'frontend', 'out'),
            exclude: ['/api*', '/admin*'],
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
        DashboardModule,
        CategoriesModule,
        LocationsModule,
        SuppliersModule,
        AdminPanelModule,
        StorageModule,
        NotificationsModule,
    ],
    providers: [
        // Global JWT guard
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
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
export class AppModule { }
