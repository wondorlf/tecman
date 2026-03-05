import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No roles defined, so access is allowed (assuming JwtAuthGuard passed)
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.role || !user.role.name) {
            throw new ForbiddenException('You do not have the necessary roles to access this resource');
        }

        const hasRole = () => requiredRoles.some((role) => user.role.name === role);

        if (hasRole() || user.role.name === 'Administrador' || user.role.name === 'Superadministrador Egan') {
            return true;
        }

        throw new ForbiddenException('Forbidden Resource: Role insufficient');
    }
}
