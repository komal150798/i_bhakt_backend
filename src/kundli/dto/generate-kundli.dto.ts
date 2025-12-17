import { IsString, IsDateString, IsNotEmpty, IsOptional, IsNumber, Min, Max, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateKundliDto {
  @ApiProperty({ description: 'Full name of the person', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Date of birth (YYYY-MM-DD)', example: '1990-01-15' })
  @IsDateString()
  @IsNotEmpty()
  birth_date: string;

  @ApiProperty({ description: 'Time of birth (HH:MM:SS)', example: '10:30:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'birth_time must be in HH:MM:SS format',
  })
  birth_time: string;

  @ApiProperty({ description: 'Place of birth (city name)', example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  birth_place: string;

  @ApiPropertyOptional({ description: 'Latitude (optional, will be fetched if not provided)', example: 19.0760 })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (optional, will be fetched if not provided)', example: 72.8777 })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Timezone (optional, will be fetched if not provided)', example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Ayanamsa type (1=Lahiri, 2=Raman, 3=KP, 4=Sayana)', example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(4)
  ayanamsa?: number;
}

