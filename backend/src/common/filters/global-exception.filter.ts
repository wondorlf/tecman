import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ── Prisma unique constraint violation (P2002) ───────────────────────────
    // Si no se capturó en el servicio, este es el último filtro para dar un
    // mensaje amigable y evitar el 500 genérico.
    if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      (exception as Record<string, unknown>).code === 'P2002'
    ) {
      const prismaErr = exception as Record<string, unknown>;
      const rawTarget = prismaErr.meta && typeof prismaErr.meta === 'object'
        ? (prismaErr.meta as Record<string, unknown>).target
        : undefined;
      const target = Array.isArray(rawTarget) ? (rawTarget as string[]) : [];

      const field = target.length > 0 ? target.join(', ') : 'un campo único';
      const conflictException = new ConflictException(
        `Ya existe un registro con el mismo valor en: ${field}. Verifica que los datos no estén duplicados.`,
      );

      const status = conflictException.getStatus();
      const message = conflictException.getResponse();

      this.logger.warn(
        `[${request.method}] ${request.url} - Prisma unique constraint violation: ${prismaErr.message}`,
      );

      const formattedResponse =
        typeof message === 'string' ? { message } : (message as Record<string, unknown>);

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...formattedResponse,
      });
      return;
    }

    // ── HTTP exceptions (incluye ConflictException lanzado desde servicios) ───
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();

      if (status >= 500) {
        this.logger.error(
          `[${request.method}] ${request.url} - Status: ${status} - Error: ${exception.message}`,
        );
        if (exception.stack) this.logger.error(exception.stack);
      } else {
        this.logger.warn(
          `[${request.method}] ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`,
        );
      }

      const formattedResponse =
        typeof message === 'string' ? { message } : (message as Record<string, unknown>);

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...formattedResponse,
      });
      return;
    }

    // ── Unknown / Internal errors ────────────────────────────────────────────
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${exception instanceof Error ? exception.message : 'Unknown object'}`,
    );
    if (exception instanceof Error && exception.stack) {
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Internal server error',
    });
  }
}

