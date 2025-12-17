import { Module } from '@nestjs/common';
import { SwissEphemerisService } from './services/swiss-ephemeris.service';

@Module({
  providers: [SwissEphemerisService],
  exports: [SwissEphemerisService],
})
export class AstrologyModule {}

