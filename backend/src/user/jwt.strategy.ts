import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from Bearer token in Authorization header
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'), // Secret key from ConfigService
    });
  }

  async validate(payload: { user_id: string; username: string }) {
    return { userId: payload.user_id, username: payload.username };
  }
}
