import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MahadashaDto {
  @ApiProperty()
  lord: string;

  @ApiProperty()
  start: string;

  @ApiProperty()
  end: string;

  @ApiProperty()
  duration_years: number;

  @ApiProperty()
  duration_days: number;

  @ApiProperty()
  is_balance: boolean;

  @ApiPropertyOptional()
  is_shadow_planet?: boolean;
}

export class DetailedDashaPeriodDto {
  @ApiProperty()
  mahadasha: string;

  @ApiProperty()
  antardasha: string;

  @ApiProperty()
  pratyantar: string;

  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;

  @ApiProperty()
  duration_years: number;

  @ApiProperty()
  duration_days: number;

  @ApiPropertyOptional()
  is_shadow_planet?: boolean;
}

export class VimshottariDashaDto {
  @ApiProperty({ description: 'Birth Dasha Lord (determined from Moon Nakshatra)' })
  birth_dasha_lord: string;

  @ApiProperty({ description: 'Balance years remaining in birth Mahadasha' })
  balance_years: number;

  @ApiProperty({ description: 'Balance days remaining in birth Mahadasha' })
  balance_days: number;

  @ApiPropertyOptional({ type: [MahadashaDto] })
  mahadasha?: MahadashaDto[];

  @ApiPropertyOptional()
  current_mahadasha?: string;

  @ApiPropertyOptional()
  current_antardasha?: string;

  @ApiPropertyOptional()
  current_pratyantar?: string;

  @ApiPropertyOptional({ type: [DetailedDashaPeriodDto], description: 'Full detailed timeline with Mahadasha, Antardasha, and Pratyantar' })
  detailed_timeline?: DetailedDashaPeriodDto[];
}

export class DashaTimelineDto {
  @ApiPropertyOptional({ type: VimshottariDashaDto })
  vimshottari?: VimshottariDashaDto;
}

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

  @ApiPropertyOptional({ type: DashaTimelineDto, description: 'Vimshottari Dasha timeline with current periods' })
  dasha_timeline?: DashaTimelineDto;

  @ApiProperty()
  full_data: Record<string, any>;
}


