import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwinGateway } from './twin.gateway';
import { TwinStateService } from './services/twin-state.service';
import { DigitalTwinService } from './services/digital-twin.service';
import { AppTwinController } from './controllers/app-twin.controller';
import { Customer } from '../users/entities/customer.entity';
import { Manifestation } from '../manifestation/entities/manifestation.entity';
import { ManifestationLog } from '../manifestation/entities/manifestation-log.entity';
import { JournalEntry } from '../journal/entities/journal-entry.entity';
import { KarmaEntry } from '../karma/entities/karma-entry.entity';
import { KarmaModule } from '../karma/karma.module';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Manifestation, ManifestationLog, JournalEntry, KarmaEntry]),
    KarmaModule, // For KarmaScoreService
    RepositoriesModule, // For IKarmaRepository
    UsersModule, // For CustomerService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TwinGateway, TwinStateService, DigitalTwinService],
  controllers: [AppTwinController],
  exports: [TwinGateway, TwinStateService, DigitalTwinService],
})
export class TwinModule {}

