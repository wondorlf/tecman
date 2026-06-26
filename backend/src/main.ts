import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { AppModule } from './app.module.js';

// @ts-expect-error - Allow BigInt serialization in JSON (Prisma returns BigInt for BigInt fields)
(BigInt.prototype as Record<string, unknown>).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers (Helmet)
  app.use(helmet());

  // Cookie parser (needed for httpOnly cookies)
  app.use(cookieParser());

  // Session middleware (required by AdminJS for authentication)
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'adminjs-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation — whitelist strips extra fields
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true, // Rechazar campos no definidos en DTOs
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('TecMan API')
    .setDescription('Sistema de Gestión de Activos y Mantenimiento — API REST')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS — Configuración para entornos mixtos (local, red local, dominio)
  // Si usas Next.js como proxy (single-port), el frontend y backend comparten
  // el mismo origen para el navegador, pero el backend necesita aceptar el
  // origen real (IP/dominio) para las respuestas CORS preflight (OPTIONS).
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:2024';
  const frontendPort = process.env.FRONTEND_PORT || '2024';

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origen (curl, server-to-server, misma IP)
      if (!origin) return callback(null, true);

      // Lista explícita de orígenes permitidos
      const allowed = [
        frontendUrl,
        `http://localhost:${frontendPort}`,
        `http://127.0.0.1:${frontendPort}`,
        `http://localhost:${process.env.PORT || '2023'}`,
      ];

      if (allowed.includes(origin)) {
        return callback(null, true);
      }

      // Permitir cualquier IP de red privada (común en entornos corporativos)
      // Rangos: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, ::1 (IPv6 localhost)
      try {
        const url = new URL(origin);
        const host = url.hostname;

        const isPrivate =
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === '::1' ||
          host.startsWith('10.') ||
          host.startsWith('192.168.') ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(host);

        // Solo validamos el puerto si la URL incluye uno explícito
        const portMatches = !url.port || url.port === frontendPort;

        if (isPrivate && portMatches) {
          return callback(null, true);
        }
      } catch {
        // Si no se puede parsear la URL, dejar que falle con el error estándar
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT || 2023;
  await app.listen(port);
  console.log(`🚀 Backend TecMan en: http://localhost:${port}/api`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
  console.log(`🛡️ Panel AdminJS: http://localhost:${port}/admin`);
}
bootstrap();
