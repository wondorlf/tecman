import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('You do not have the necessary roles to access this resource');
    }

    const hasRole = () => requiredRoles.some((role) => user.role.name === role);

    if (
      hasRole() ||
      user.role.name === 'Administrador' ||
      user.role.name === 'Superadministrador Egan'
    ) {
      return true;
    }

    let permissions: string[] = [];
    try {
      permissions = JSON.parse(user.role.permissions || '[]');
    } catch {
      permissions = [];
    }

    if (permissions.includes('*')) {
      return true;
    }

    const matched = requiredRoles.some((role) => {
      const base = role.toLowerCase().replace(/[^a-z0-9]+/g, ':');
      return permissions.includes(base) || permissions.includes(`*`);
    });

    if (matched) {
      return true;
    }

    throw new ForbiddenException('Forbidden Resource: Role insufficient');
  }
}
