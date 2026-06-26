import { Module } from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service.js';
import { ServiceCatalogController } from './service-catalog.controller.js';

@Module({
  providers: [ServiceCatalogService],
  controllers: [ServiceCatalogController],
})
export class ServiceCatalogModule {}
