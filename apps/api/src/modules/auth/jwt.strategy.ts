import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface IJwtPayload {
  sub: string;
  email: string;
  businessId?: string;
}

/** Extract JWT from Authorization: Bearer OR access_token cookie */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['access_token'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'fallback-dev-secret'),
    });
  }

  validate(payload: IJwtPayload): IJwtPayload {
    if (!payload?.sub) throw new UnauthorizedException();
    return payload;
  }
}
