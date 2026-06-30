import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionRequirement {
  module: string;
  action: string;
}

export const Permissions = (module: string, action: string) =>
  SetMetadata(PERMISSIONS_KEY, { module, action } as PermissionRequirement);
