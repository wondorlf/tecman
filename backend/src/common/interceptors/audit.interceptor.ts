import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, user, ip } = request;
        const userAgent = request.get('user-agent');

        return next.handle().pipe(
            tap(async (data) => {
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && user) {
                    try {
                        await this.prisma.audit.create({
                            data: {
                                userId: user.id,
                                action: method,
                                entity: url.split('/')[2] || 'unknown',
                                entityId: data?.id || body?.id,
                                changes: body,
                                ip,
                                userAgent,
                            },
                        });
                    } catch (error) {
                        console.error('Audit log failed:', error);
                    }
                }
            }),
        );
    }
}
