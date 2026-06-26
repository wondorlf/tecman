import { Module } from '@nestjs/common';
import { TagsService } from './tags.service.js';
import { TagsController } from './tags.controller.js';

@Module({
  providers: [TagsService],
  controllers: [TagsController],
})
export class TagsModule {}
