import { Module } from '@nestjs/common';
import { DiscoveryService } from './discovery.service.js';
import { DiscoveryController } from './discovery.controller.js';

@Module({
  providers: [DiscoveryService],
  controllers: [DiscoveryController],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
