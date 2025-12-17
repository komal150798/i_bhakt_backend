import { ApiProperty } from '@nestjs/swagger';

export class PlanetPositionDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  sign: string;

  @ApiProperty()
  sign_lord: string;

  @ApiProperty()
  nakshatra: string;

  @ApiProperty()
  nakshatra_lord: string;

  @ApiProperty()
  nakshatra_pada: number;

  @ApiProperty()
  house: number;

  @ApiProperty()
  is_retrograde: boolean;
}

export class HouseDto {
  @ApiProperty()
  house_number: number;

  @ApiProperty()
  sign: string;

  @ApiProperty()
  sign_lord: string;

  @ApiProperty()
  start_degree: number;

  @ApiProperty()
  end_degree: number;
}

export class KundliResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  birth_date: string;

  @ApiProperty()
  birth_time: string;

  @ApiProperty()
  birth_place: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  lagna: {
    sign: string;
    degrees: number;
    lord: string;
  };

  @ApiProperty()
  nakshatra: {
    name: string;
    pada: number;
    lord: string;
  };

  @ApiProperty()
  planets: PlanetPositionDto[];

  @ApiProperty()
  houses: HouseDto[];

  @ApiProperty()
  ayanamsa: number;

  @ApiProperty()
  tithi: string;

  @ApiProperty()
  yoga: string;

  @ApiProperty()
  karana: string;

  @ApiProperty()
  full_data: Record<string, any>;
}


