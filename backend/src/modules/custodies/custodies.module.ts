import { Module } from '@nestjs/common';
import { CustodiesService } from './custodies.service.js';
import { CustodiesController } from './custodies.controller.js';

@Module({
  providers: [CustodiesService],
  controllers: [CustodiesController],
})
export class CustodiesModule {}
