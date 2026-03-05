import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix('api');

    // Validation
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('TecMan API')
        .setDescription('Inventory and Maintenance Management System API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // CORS
    app.enableCors();

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}/api`);
    console.log(`📚 Documentation is available on: http://localhost:${port}/api/docs`);
}
bootstrap();
