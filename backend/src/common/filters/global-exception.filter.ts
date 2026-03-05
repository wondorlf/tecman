import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        // Log the error securely (don't send stack traces to client)
        if (status >= 500) {
            this.logger.error(
                `[${request.method}] ${request.url} - Status: ${status} - Error: ${exception instanceof Error ? exception.message : 'Unknown object'}`
            );
            if (exception instanceof Error && exception.stack) {
                this.logger.debug(exception.stack);
            }
        } else {
            this.logger.warn(`[${request.method}] ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`);
        }

        const formattedResponse = typeof message === 'string' ? { message } : (message as any);

        // Enviar respuesta segura
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            ...formattedResponse,
        });
    }
}
