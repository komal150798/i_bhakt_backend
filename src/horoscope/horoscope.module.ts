import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AstrologyModule } from '../astrology/astrology.module';
import { HoroscopeService } from './services/horoscope.service';
import { HoroscopeController } from './controllers/horoscope.controller';
import { Customer } from '../users/entities/customer.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Customer]),
    AstrologyModule,
  ],
  controllers: [HoroscopeController],
  providers: [HoroscopeService],
  exports: [HoroscopeService],
})
export class HoroscopeModule {}

