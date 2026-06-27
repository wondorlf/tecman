import { Module } from '@nestjs/common';
import { FixScriptsController } from './fix-scripts.controller.js';

@Module({
  controllers: [FixScriptsController],
})
export class FixScriptsModule {}
