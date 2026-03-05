import { Module, OnModuleInit } from '@nestjs/common';
import { AdminModule, AbstractLoader } from '@adminjs/nestjs';
import { AdminJS } from 'adminjs';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as PrismaModule from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
class FixedAdminLoader extends AbstractLoader {
    public async register(admin: any, httpAdapter: any, options: any) {
        const app = httpAdapter.getInstance();
        const { default: adminJsExpressjs } = await import('@adminjs/express');

        let router;
        if (options.auth) {
            router = adminJsExpressjs.buildAuthenticatedRouter(
                admin,
                options.auth,
                undefined,
                options.sessionOptions,
                options.formidableOptions
            );
        } else {
            router = adminJsExpressjs.buildRouter(
                admin,
                undefined,
                options.formidableOptions
            );
        }

        app.use(options.adminJsOptions.rootPath, (req, res, next) => {
            return router(req, res, next);
        });

        this.reorderRoutes(app);
    }

    reorderRoutes(app: any) {
        try {
            // Safe access to Express router stack
            const stack = app._router?.stack || (app.router && !Object.getOwnPropertyDescriptor(app, 'router')?.get ? app.router.stack : null);
            if (!stack) return;

            let jsonParser = [];
            let urlencodedParser = [];
            let admin = [];

            const jsonParserIndex = stack.findIndex((layer: any) => layer.name === 'jsonParser');
            if (jsonParserIndex >= 0) jsonParser = stack.splice(jsonParserIndex, 1);

            const urlencodedParserIndex = stack.findIndex((layer: any) => layer.name === 'urlencodedParser');
            if (urlencodedParserIndex >= 0) urlencodedParser = stack.splice(urlencodedParserIndex, 1);

            const adminIndex = stack.findIndex((layer: any) => layer.name === 'admin');
            if (adminIndex >= 0) admin = stack.splice(adminIndex, 1);

            const corsIndex = stack.findIndex((layer: any) => layer.name === 'corsMiddleware');
            const expressInitIndex = stack.findIndex((layer: any) => layer.name === 'expressInit');
            const initIndex = (corsIndex >= 0 ? corsIndex : expressInitIndex) + 1;

            stack.splice(initIndex, 0, ...admin, ...jsonParser, ...urlencodedParser);
        } catch (e) {
            console.warn('⚠️ AdminJS: Could not reorder routes safely:', e.message);
        }
    }
}

@Module({
    imports: [
        AdminModule.createAdminAsync({
            inject: [PrismaService],
            customLoader: FixedAdminLoader,
            useFactory: (prisma: PrismaService) => {
                AdminJS.registerAdapter({ Database, Resource });
                return {
                    adminJsOptions: {
                        rootPath: '/admin',
                        resources: [
                            // Security & Access
                            {
                                resource: { model: getModelByName('User', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Security', icon: 'User' } },
                            },
                            {
                                resource: { model: getModelByName('Role', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Security', icon: 'Shield' } },
                            },
                            {
                                resource: { model: getModelByName('Audit', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Security', icon: 'Activity' } },
                            },

                            // Core Inventory
                            {
                                resource: { model: getModelByName('Asset', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Inventory', icon: 'Package' } },
                            },
                            {
                                resource: { model: getModelByName('Category', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Inventory', icon: 'Tag' } },
                            },
                            {
                                resource: { model: getModelByName('Subcategory', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Inventory', icon: 'Tags' } },
                            },
                            {
                                resource: { model: getModelByName('Location', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Inventory', icon: 'MapPin' } },
                            },
                            {
                                resource: { model: getModelByName('Supplier', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Inventory', icon: 'Truck' } },
                            },
                            {
                                resource: { model: getModelByName('AssetCustomField', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Inventory', icon: 'Box' } },
                            },

                            // Operations & Maintenance
                            {
                                resource: { model: getModelByName('Maintenance', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Operations', icon: 'Tool' } },
                            },
                            {
                                resource: { model: getModelByName('Ticket', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Helpdesk', icon: 'LifeBuoy' } },
                            },
                            {
                                resource: { model: getModelByName('TicketMessage', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Helpdesk', icon: 'MessageSquare' } },
                            },
                            {
                                resource: { model: getModelByName('Alert', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Operations', icon: 'Bell' } },
                            },
                            {
                                resource: { model: getModelByName('Checklist', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Operations', icon: 'CheckSquare' } },
                            },
                            {
                                resource: { model: getModelByName('ChecklistItem', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Operations', icon: 'List' } },
                            },
                            {
                                resource: { model: getModelByName('Evidence', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Operations', icon: 'Image' } },
                            },

                            // Documents & Hojas de Vida
                            {
                                resource: { model: getModelByName('Document', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Documents', icon: 'FileText' } },
                            },
                            {
                                resource: { model: getModelByName('HojaVida', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Documents', icon: 'Book' } },
                            },
                            {
                                resource: { model: getModelByName('HojaVidaEvent', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Documents', icon: 'BookOpen' } },
                            },

                            // Templates & Attributes
                            {
                                resource: { model: getModelByName('FormTemplate', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Settings', icon: 'Layout' } },
                            },
                            {
                                resource: { model: getModelByName('FormTemplateField', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Settings', icon: 'Type' } },
                            },
                            {
                                resource: { model: getModelByName('CategoryAttribute', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Settings', icon: 'Sliders' } },
                            },
                            {
                                resource: { model: getModelByName('AssetAttributeValue', PrismaModule), client: prisma },
                                options: { navigation: { name: 'Settings', icon: 'Database' } },
                            },
                        ],
                        branding: {
                            companyName: 'Egan - GAMA Admin',
                            logo: '/logo.png',
                            softwareBrothers: false,
                        },
                    },
                };
            },
        }),
    ],
})
export class AdminPanelModule implements OnModuleInit {
    onModuleInit() {
        console.log('🚀 AdminJS module initialized');
    }
}
