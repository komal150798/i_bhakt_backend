import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwinGateway } from './twin.gateway';
import { TwinStateService } from './services/twin-state.service';
import { AppTwinController } from './controllers/app-twin.controller';
import { Customer } from '../users/entities/customer.entity';
import { ManifestationLog } from '../manifestation/entities/manifestation-log.entity';
import { KarmaModule } from '../karma/karma.module';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, ManifestationLog]),
    KarmaModule, // For KarmaScoreService
    RepositoriesModule, // For IKarmaRepository
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TwinGateway, TwinStateService],
  controllers: [AppTwinController],
  exports: [TwinGateway, TwinStateService],
})
export class TwinModule {}

