import { Module } from '@nestjs/common';
import { ChecklistsService } from './checklists.service.js';
import { ChecklistsController } from './checklists.controller.js';

@Module({
  providers: [ChecklistsService],
  controllers: [ChecklistsController],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
