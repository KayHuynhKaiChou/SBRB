import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { BusinessRole } from '@sbrb/shared-types';

const ROLE_HIERARCHY: Record<BusinessRole, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
};

/** Guard: checks BusinessRole from JWT claims (requires JwtAuthGuard first) */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<BusinessRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Unauthorized');

    const userRoleLevel = ROLE_HIERARCHY[user.role as BusinessRole] ?? 0;
    const minRequired = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r]));

    if (userRoleLevel < minRequired) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
