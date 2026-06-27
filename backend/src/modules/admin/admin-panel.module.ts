import { Module, OnModuleInit, Injectable } from '@nestjs/common';
import { AdminModule, AbstractLoader } from '@adminjs/nestjs';
import { AdminJS, ComponentLoader } from 'adminjs';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as PrismaModule from '@prisma/client';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';

@Injectable()
class FixedAdminLoader extends AbstractLoader {
  public async register(admin: any, httpAdapter: any, options: any) {
    const app = httpAdapter.getInstance();
    const { default: adminJsExpressjs } = await import('@adminjs/express');

    // Serve logo from frontend/public/images for AdminJS branding
    const logoPath = path.join(process.cwd(), '..', 'frontend', 'public', 'images', 'egan-logo.png');
    app.get('/images/egan-logo.png', (req: any, res: any) => {
      if (existsSync(logoPath)) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(readFileSync(logoPath));
      } else {
        res.status(404).send('Logo not found');
      }
    });

    let router;
    if (options.auth) {
      router = adminJsExpressjs.buildAuthenticatedRouter(
        admin,
        options.auth,
        undefined,
        options.sessionOptions,
        options.formidableOptions,
      );
    } else {
      router = adminJsExpressjs.buildRouter(admin, undefined, options.formidableOptions);
    }

    app.use(options.adminJsOptions.rootPath, (req, res, next) => {
      return router(req, res, next);
    });

    this.reorderRoutes(app);
  }

  reorderRoutes(app: any) {
    try {
      const stack =
        app._router?.stack ||
        (app.router && !Object.getOwnPropertyDescriptor(app, 'router')?.get
          ? app.router.stack
          : null);
      if (!stack) return;

      // Encontrar la capa de AdminJS (normalmente la última añadida que coincida con /admin)
      const adminIndex = stack.length - 1;
      const adminLayer = stack[adminIndex];

      if (!adminLayer || (adminLayer.name !== 'router' && adminLayer.name !== '<anonymous>')) {
        return; // Si no estamos seguros de que es AdminJS, no tocamos nada
      }

      // Encontrar el jsonParser
      const jsonParserIndex = stack.findIndex((layer: any) => layer.name === 'jsonParser');

      if (jsonParserIndex >= 0) {
        // Mover AdminJS ANTES del jsonParser para que formidable pueda procesar los archivos
        stack.splice(adminIndex, 1);
        stack.splice(jsonParserIndex, 0, adminLayer);
      }
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

        // Custom component for logo upload
        const componentLoader = new ComponentLoader();
        const LogoUpload = componentLoader.add(
          'LogoUpload',
          path.join(process.cwd(), '.adminjs', 'components', 'LogoUpload'),
        );

        return {
          adminJsOptions: {
            componentLoader,
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
                resource: {
                  model: getModelByName('AssetCustomField', PrismaModule),
                  client: prisma,
                },
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
                resource: {
                  model: getModelByName('FormTemplateField', PrismaModule),
                  client: prisma,
                },
                options: { navigation: { name: 'Settings', icon: 'Type' } },
              },
              {
                resource: {
                  model: getModelByName('CategoryAttribute', PrismaModule),
                  client: prisma,
                },
                options: { navigation: { name: 'Settings', icon: 'Sliders' } },
              },
              {
                resource: {
                  model: getModelByName('AssetAttributeValue', PrismaModule),
                  client: prisma,
                },
                options: { navigation: { name: 'Settings', icon: 'Database' } },
              },
              // Tenant Config — Branding & Settings
              {
                resource: { model: getModelByName('Tenant', PrismaModule), client: prisma },
                options: {
                  navigation: { name: 'Settings', icon: 'Settings' },
                  properties: {
                    // Logo fields with custom upload component
                    logoUrl: {
                      components: {
                        edit: LogoUpload,
                      },
                      isVisible: { list: true, filter: false, show: true, edit: true },
                    },
                    companyLogoUrl: {
                      components: {
                        edit: LogoUpload,
                      },
                      isVisible: { list: true, filter: false, show: true, edit: true },
                    },
                    // Sensitive fields hidden from list
                    discoveryApiKey: {
                      isVisible: { list: false, filter: false, show: true, edit: true },
                    },
                    telegramBotToken: {
                      isVisible: { list: false, filter: false, show: true, edit: true },
                    },
                    ldapBindPassword: {
                      isVisible: { list: false, filter: false, show: true, edit: true },
                    },
                  },
                  // Sort properties for better UX in the edit form
                  sort: {
                    direction: 'asc',
                    sortBy: 'name',
                  },
                },
              },
            ],
            branding: {
              companyName: 'Egan - GAMA Admin',
              logo: '/images/egan-logo.png',
              softwareBrothers: false,
            },
          },
          auth: {
            authenticate: async (email, password) => {
              try {
                const user = await prisma.user.findFirst({
                  where: {
                    OR: [{ email: email }, { username: email }],
                  },
                  include: { role: true },
                });

                if (!user || !user.role) return null;

                const isAdmin =
                  user.role.name === 'Administrador' ||
                  user.role.name === 'Superadministrador' ||
                  user.role.permissions?.includes('"admin":true');

                if (!isAdmin) return null;

                const bcrypt = await import('bcrypt');
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) return null;

                return {
                  email: user.email,
                  title: user.name,
                  role: user.role.name,
                };
              } catch (err) {
                console.error('[AdminJS] Auth error:', err);
                return null;
              }
            },
            cookiePassword: process.env.JWT_SECRET || 'some-secret-password-used-to-secure-cookie',
            cookieName: 'adminjs',
          },
          sessionOptions: {
            secret: process.env.JWT_SECRET || 'adminjs-session-secret',
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
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
