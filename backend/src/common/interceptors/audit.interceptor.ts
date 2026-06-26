import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service.js';

// Fields that should never be stored in audit logs (security)
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'pin'];

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = { ...obj };
  for (const key of SENSITIVE_FIELDS) {
    if (key in clean) clean[key] = '[REDACTED]';
  }
  return clean;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip } = request;
    const userAgent = request.get('user-agent');

    return next.handle().pipe(
      tap(async (data) => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && user) {
          try {
            const safeBody = sanitize(body);
            await this.prisma.audit.create({
              data: {
                userId: user.id,
                action: method,
                entity: url.split('/')[2] || 'unknown',
                entityId: data?.id || body?.id,
                changes: JSON.stringify(safeBody),
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
