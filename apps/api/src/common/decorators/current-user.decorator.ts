import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/** Extract current authenticated user from JWT payload */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    let user: Record<string, unknown>;

    // Support both REST and GraphQL contexts
    if (context.getType() === 'http') {
      user = context.switchToHttp().getRequest().user;
    } else {
      const ctx = GqlExecutionContext.create(context);
      user = ctx.getContext().req?.user;
    }

    return data ? user?.[data] : user;
  },
);
