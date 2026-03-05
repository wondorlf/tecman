import { Controller, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Post()
    create(@Request() req, @Body() createTicketDto: any) {
        // Assumes req.user is set by JwtAuthGuard
        return this.ticketsService.createTicket(req.user.id, createTicketDto);
    }

    @Patch(':id/resolve')
    resolveTicket(
        @Param('id') id: string,
        @Request() req,
        @Body() body: { resolutionMessage: string }
    ) {
        return this.ticketsService.resolveTicket(id, body.resolutionMessage, req.user.id);
    }
}
