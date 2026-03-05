import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class TicketsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService
    ) { }

    async createTicket(userId: string, data: any) {
        // Generar un código único
        const count = await this.prisma.ticket.count();
        const code = `TCK-${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;

        const ticket = await this.prisma.ticket.create({
            data: {
                ...data,
                code,
                creatorId: userId,
            },
            include: { creator: true }
        });

        // Email notification
        await this.notifications.sendTicketCreatedNotification(ticket.creator.email, ticket.code);

        return ticket;
    }

    async resolveTicket(ticketId: string, resolutionMessage: string, userId: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { asset: true }
        });

        if (!ticket) throw new NotFoundException('Ticket not found');

        // Add closing message
        await this.prisma.ticketMessage.create({
            data: {
                ticketId,
                userId,
                message: `Resolución oficial: ${resolutionMessage}`,
                isInternal: false,
            }
        });

        // Update ticket to resolved
        const resolvedTicket = await this.prisma.ticket.update({
            where: { id: ticketId },
            data: { status: 'RESOLVED', resolvedAt: new Date() }
        });

        // GLPI Feature: Anchor solution to Hoja de Vida if applicable
        if (ticket.assetId) {
            let hoja = await this.prisma.hojaVida.findUnique({ where: { assetId: ticket.assetId } });
            if (!hoja) {
                hoja = await this.prisma.hojaVida.create({ data: { assetId: ticket.assetId } });
            }

            await this.prisma.hojaVidaEvent.create({
                data: {
                    hojaVidaId: hoja.id,
                    type: 'FAILURE',
                    description: `Ticket Resuelto [${ticket.code}]: ${ticket.title}`,
                    data: JSON.stringify({
                        problem: ticket.description,
                        solution: resolutionMessage,
                        resolvedBy: userId
                    })
                }
            });
        }

        return resolvedTicket;
    }
}
