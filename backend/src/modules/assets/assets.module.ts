import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { AssetsController } from './assets.controller.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [TenantsModule],
  providers: [AssetsService],
  controllers: [AssetsController],
})
export class AssetsModule {}
