import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LagnaDto {
  @ApiProperty()
  @IsString()
  sign: string;

  @ApiProperty()
  @IsNumber()
  degrees: number;

  @ApiProperty()
  @IsString()
  lord: string;
}

class NakshatraDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  pada: number;

  @ApiProperty()
  @IsString()
  lord: string;
}

class PlanetDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  sign: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sign_lord?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  house?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nakshatra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nakshatra_lord?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  nakshatra_pada?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_retrograde?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;
}

class HouseDto {
  @ApiProperty()
  @IsNumber()
  house_number: number;

  @ApiProperty()
  @IsString()
  sign: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sign_lord?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  start_degree?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  end_degree?: number;
}

class MahadashaDto {
  @ApiProperty()
  @IsString()
  lord: string;

  @ApiProperty()
  @IsString()
  start: string;

  @ApiProperty()
  @IsString()
  end: string;

  @ApiProperty()
  @IsNumber()
  duration_years: number;
}

class DetailedTimelineEntryDto {
  @ApiProperty()
  @IsString()
  mahadasha: string;

  @ApiProperty()
  @IsString()
  antardasha: string;

  @ApiProperty()
  @IsString()
  pratyantar: string;

  @ApiProperty()
  @IsString()
  start_date: string;

  @ApiProperty()
  @IsString()
  end_date: string;

  @ApiProperty()
  @IsNumber()
  duration_years: number;
}

class VimshottariDashaDto {
  @ApiPropertyOptional({ type: [MahadashaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MahadashaDto)
  mahadasha?: MahadashaDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  current_mahadasha?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  current_antardasha?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  current_pratyantar?: string;

  @ApiPropertyOptional({ type: [DetailedTimelineEntryDto], description: 'Detailed Dasha timeline with Mahadasha, Antardasha, and Pratyantar' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailedTimelineEntryDto)
  detailed_timeline?: DetailedTimelineEntryDto[];
}

class DashaTimelineDto {
  @ApiPropertyOptional({ type: VimshottariDashaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VimshottariDashaDto)
  vimshottari?: VimshottariDashaDto;
}

export class GenerateKundliPdfDto {
  @ApiProperty({ description: 'Name of the person' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Birth date in YYYY-MM-DD format' })
  @IsString()
  @IsNotEmpty()
  birth_date: string;

  @ApiProperty({ description: 'Birth time in HH:mm:ss format' })
  @IsString()
  @IsNotEmpty()
  birth_time: string;

  @ApiProperty({ description: 'Birth place' })
  @IsString()
  @IsNotEmpty()
  birth_place: string;

  @ApiPropertyOptional({ description: 'Latitude of birth place' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude of birth place' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Timezone of birth place' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ type: LagnaDto, description: 'Lagna (Ascendant) details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LagnaDto)
  lagna?: LagnaDto;

  @ApiPropertyOptional({ type: NakshatraDto, description: 'Nakshatra details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NakshatraDto)
  nakshatra?: NakshatraDto;

  @ApiPropertyOptional({ type: [PlanetDto], description: 'Planetary positions' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanetDto)
  planets?: PlanetDto[];

  @ApiPropertyOptional({ type: [HouseDto], description: 'House details' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HouseDto)
  houses?: HouseDto[];

  @ApiPropertyOptional({ description: 'Ayanamsa value' })
  @IsOptional()
  @IsNumber()
  ayanamsa?: number;

  @ApiPropertyOptional({ description: 'Tithi' })
  @IsOptional()
  @IsString()
  tithi?: string;

  @ApiPropertyOptional({ description: 'Yoga' })
  @IsOptional()
  @IsString()
  yoga?: string;

  @ApiPropertyOptional({ description: 'Karana' })
  @IsOptional()
  @IsString()
  karana?: string;

  @ApiPropertyOptional({ type: DashaTimelineDto, description: 'Dasha timeline data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DashaTimelineDto)
  dasha_timeline?: DashaTimelineDto;

  @ApiPropertyOptional({ description: 'Full kundli data object (optional, used if individual fields not provided)' })
  @IsOptional()
  full_data?: Record<string, any>;
}
