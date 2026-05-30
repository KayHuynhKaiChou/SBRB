import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PlatformAdminGuard } from '../platform-admin.guard';

/** Full coverage deferred to Phase 6 — skeleton covers the three key cases. */
describe('PlatformAdminGuard', () => {
  let guard: PlatformAdminGuard;

  beforeEach(() => {
    guard = new PlatformAdminGuard();
  });

  function buildHttpContext(user: unknown): ExecutionContext {
    return {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  function buildGqlContext(user: unknown): ExecutionContext {
    const ctx = {
      getType: () => 'graphql',
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user } }),
    } as unknown as GqlExecutionContext);
    return ctx;
  }

  it('allows access for platform admin', () => {
    const ctx = buildHttpContext({ sub: 'u1', email: 'admin@test.com', platformRole: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access for non-admin user', () => {
    const ctx = buildHttpContext({ sub: 'u2', email: 'user@test.com', platformRole: null });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies access when user is missing', () => {
    const ctx = buildHttpContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows access for admin via GraphQL context', () => {
    const ctx = buildGqlContext({ sub: 'u3', email: 'admin@test.com', platformRole: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
