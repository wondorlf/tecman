import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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

  // CORS — solo el frontend (puerto público :3000) necesita acceso
  // En producción, todo el tráfico pasa por el frontend proxy
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origen (curl, server-to-server, etc.)
      if (!origin) return callback(null, true);
      // Solo permitir el frontend y localhost en desarrollo
      const allowed = [
        frontendUrl,
        `http://localhost:${process.env.FRONTEND_PORT || '3000'}`,
      ];
      if (process.env.NODE_ENV !== 'production') {
        allowed.push(`http://localhost:${process.env.PORT || '3001'}`);
      }
      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend TecMan en: http://localhost:${port}/api`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
  console.log(`🛡️ Panel AdminJS: http://localhost:${port}/admin`);
}
bootstrap();
