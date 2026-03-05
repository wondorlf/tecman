import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Decorator function to specify the roles required to access an endpoint
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
