import { Module } from '@nestjs/common';
import { SlasService } from './slas.service.js';
import { SlasController } from './slas.controller.js';

@Module({
  providers: [SlasService],
  controllers: [SlasController],
})
export class SlasModule {}
