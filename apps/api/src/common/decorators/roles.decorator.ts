import { SetMetadata } from '@nestjs/common';
import type { BusinessRole } from '@sbrb/shared-types';

export const ROLES_KEY = 'roles';
/** Require specific BusinessRole(s) — use with RolesGuard */
export const Roles = (...roles: BusinessRole[]) => SetMetadata(ROLES_KEY, roles);
