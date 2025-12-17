import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthController } from './controllers/admin/admin-auth.controller';
import { WebAuthController } from './controllers/web/web-auth.controller';
import { AppAuthController } from './controllers/app/app-auth.controller';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthService } from './services/admin-auth.service';
import { OtpService } from './services/otp.service';
import { AuthJwtService } from './services/jwt.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { Customer } from '../users/entities/customer.entity';
import { AdminUser } from '../users/entities/admin-user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { CustomerToken } from './entities/customer-token.entity';
import { AdminToken } from './entities/admin-token.entity';
import { AdminRbacModule } from '../admin-rbac/admin-rbac.module';
import { AdmRole } from '../admin-rbac/entities/adm-role.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production-min-32-chars',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Customer, AdminUser, RefreshToken, CustomerToken, AdminToken, AdmRole]),
    AdminRbacModule,
  ],
  controllers: [
    AdminAuthController,
    WebAuthController,
    AppAuthController,
    AuthController,
  ],
  providers: [AuthService, AdminAuthService, OtpService, AuthJwtService, JwtStrategy],
  exports: [AuthService, AdminAuthService, AuthJwtService],
})
export class AuthModule {}

