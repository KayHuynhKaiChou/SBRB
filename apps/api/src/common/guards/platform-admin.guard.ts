import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { EPlatformRole } from '@sbrb/shared-constants';
import type { IJwtPayload } from '@sbrb/shared-types';

/** Guard: allows access only to users with platformRole === EPlatformRole.ADMIN. Supports REST + GraphQL. */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req =
      context.getType<'graphql' | 'http'>() === 'graphql'
        ? GqlExecutionContext.create(context).getContext().req
        : context.switchToHttp().getRequest();

    const user = req?.user as IJwtPayload | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');
    if (user.platformRole !== EPlatformRole.ADMIN) {
      throw new ForbiddenException('Platform admin only');
    }
    return true;
  }
}
