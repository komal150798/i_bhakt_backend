import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class AuthJwtService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Signs a token with a unique `jti` claim.
   *
   * Without this, two tokens issued for the same user inside the same second
   * are byte-identical: the payload held only sub/email/phone/role/type, and
   * `iat` has one-second resolution. `cst_tokens.token` is UNIQUE, so the
   * second insert failed and the request returned 500.
   *
   * It is trivially reproducible - register, then immediately log in - which
   * means a real user who signs in twice in quick succession, or double-taps
   * the button, hits it. `jti` is the standard JWT claim for exactly this
   * (RFC 7519 section 4.1.7) and also gives each session a stable identifier
   * for future per-token revocation.
   */
  private sign(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
    expiresIn: string,
  ): string {
    return this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      { expiresIn },
    );
  }

  generateAccessToken(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
    expiresIn?: string,
  ): string {
    return this.sign(
      payload,
      expiresIn || this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
    );
  }

  generateRefreshToken(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
    expiresIn?: string,
  ): string {
    return this.sign(
      payload,
      expiresIn || this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
    );
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      return null;
    }
  }
}
