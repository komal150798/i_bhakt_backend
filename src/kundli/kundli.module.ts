import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Kundli } from './entities/kundli.entity';
import { KundliPlanet } from './entities/kundli-planet.entity';
import { KundliHouse } from './entities/kundli-house.entity';
import { PlanetMaster } from './entities/planet-master.entity';
import { NakshatraMaster } from './entities/nakshatra-master.entity';
import { AyanamsaMaster } from './entities/ayanamsa-master.entity';
import { CacheModule } from '../cache/cache.module';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';
import { AstrologyModule } from '../astrology/astrology.module';
import { KundliService } from './services/kundli.service';
import { KundliController } from './controllers/kundli.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Kundli,
      KundliPlanet,
      KundliHouse,
      PlanetMaster,
      NakshatraMaster,
      AyanamsaMaster,
    ]),
    HttpModule,
    CacheModule,
    RepositoriesModule,
    AstrologyModule,
  ],
  controllers: [KundliController],
  providers: [KundliService],
  exports: [KundliService],
})
export class KundliModule {}


