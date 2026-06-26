import { Module } from '@nestjs/common';
import { ChangeRequestsService } from './change-requests.service.js';
import { ChangeRequestsController } from './change-requests.controller.js';

@Module({
  providers: [ChangeRequestsService],
  controllers: [ChangeRequestsController],
})
export class ChangeRequestsModule {}
