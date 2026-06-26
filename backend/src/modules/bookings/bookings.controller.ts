import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service.js';
import { BookingStatus } from '@prisma/client';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar reservas' })
  findAll(@Query() query: Record<string, string>) {
    return this.bookingsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  create(
    @Body()
    data: {
      assetId: string;
      userId: string;
      startDate: string;
      endDate: string;
      notes?: string;
    },
  ) {
    return this.bookingsService.create(data);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Actualizar el estado de una reserva' })
  updateStatus(@Param('id') id: string, @Body() data: { status: BookingStatus }) {
    return this.bookingsService.updateStatus(id, data.status);
  }
}
