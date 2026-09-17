import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../strategies/jwt.strategy';
export declare class AuthJwtService {
    private jwtService;
    private configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    private sign;
    generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn?: string): string;
    generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn?: string): string;
    verifyToken(token: string): JwtPayload | null;
}
