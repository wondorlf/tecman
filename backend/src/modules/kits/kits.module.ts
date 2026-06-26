import { Module } from '@nestjs/common';
import { KitsService } from './kits.service.js';
import { KitsController } from './kits.controller.js';

@Module({
  providers: [KitsService],
  controllers: [KitsController],
})
export class KitsModule {}
