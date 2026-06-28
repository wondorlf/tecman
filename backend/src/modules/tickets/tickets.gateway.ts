import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || '2024'}`]
        : [
            process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || '2024'}`,
            `http://localhost:${process.env.PORT || '2023'}`,
          ],
    credentials: true,
  },
  namespace: '/ws/tickets',
  // Sin trailing slash para que Engine.IO acepte /socket.io y /socket.io/
  // Next.js elimina el trailing slash al hacer rewrite del proxy.
  path: '/socket.io',
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TicketsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract JWT token from auth handshake
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Cliente ${client.id} intentó conectar sin token`);
        client.emit('error', { message: 'Token de autenticación requerido' });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token as string);
      client.userId = payload.sub || payload.id;
      client.userName = payload.name || payload.username;

      // Join a room for this user's ID (for private notifications)
      if (client.userId) {
        client.join(`user:${client.userId}`);
      }

      this.logger.log(`🧷 Cliente WebSocket conectado: ${client.userName || client.id}`);
    } catch (err) {
      this.logger.warn(`Cliente ${client.id} rechazado: token inválido`);
      client.emit('error', { message: 'Token de autenticación inválido' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`🔌 Cliente WebSocket desconectado: ${client.userName || client.id}`);
  }

  /**
   * Emitir a todos los clientes autenticados que se creó un nuevo ticket.
   */
  emitTicketCreated(ticket: any) {
    const event = {
      type: 'ticket.created',
      ticket: {
        id: ticket.id,
        code: ticket.code,
        title: ticket.title,
        priority: ticket.priority,
        category: ticket.category,
        status: ticket.status,
        creatorName: ticket.creator?.name || 'Usuario',
        createdAt: ticket.createdAt,
      },
      timestamp: new Date().toISOString(),
    };

    this.server.emit('ticket.created', event);
    this.logger.log(`📢 Evento ticket.created emitido: ${ticket.code}`);
  }

  /**
   * Emitir solo al usuario asignado que su ticket tiene un nuevo mensaje.
   */
  emitNewMessage(ticketId: string, message: any, assigneeId?: string) {
    const event = {
      type: 'ticket.message',
      ticketId,
      message: {
        id: message.id,
        text: message.message?.substring(0, 100),
        userName: message.user?.name || 'Usuario',
        createdAt: message.createdAt,
      },
      timestamp: new Date().toISOString(),
    };

    // Emit to all (for the detail view)
    this.server.emit('ticket.message', { ...event, ticketId });

    // If there's an assignee, emit to their private room
    if (assigneeId) {
      this.server.to(`user:${assigneeId}`).emit('ticket.assigned', {
        type: 'ticket.assigned',
        ticketId,
        message: event.message,
        timestamp: event.timestamp,
      });
    }

    this.logger.log(`📢 Evento ticket.message emitido para: ${ticketId}`);
  }
}
