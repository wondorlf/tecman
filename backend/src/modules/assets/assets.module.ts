import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { AssetsController } from './assets.controller.js';

@Module({
    providers: [AssetsService],
    controllers: [AssetsController],
})
export class AssetsModule { }
