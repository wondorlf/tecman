import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('You do not have the necessary roles to access this resource');
    }

    // Administrador / Superadministrador Egan always pass
    if (user.role.name === 'Administrador' || user.role.name === 'Superadministrador Egan') {
      return true;
    }

    const permissionReq = this.reflector.getAllAndOverride<PermissionRequirement>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (permissionReq) {
      return this.checkGranularPermission(user.role, permissionReq.module, permissionReq.action);
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (requiredRoles.some((role) => user.role.name === role)) {
      return true;
    }

    throw new ForbiddenException('Forbidden Resource: Role insufficient');
  }

  private checkGranularPermission(role: any, module: string, action: string): boolean {
    let perms: Record<string, any> = {};
    try {
      perms = JSON.parse(role.permissions || '{}');
    } catch {
      return false;
    }

    if (perms.admin === true) return true;

    const modPerms = perms[module];
    if (!modPerms) return false;

    if (modPerms[action] === true) return true;
    if (modPerms['*'] === true) return true;

    return false;
  }
}
