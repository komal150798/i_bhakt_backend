import { IsOptional, IsString, IsDateString, IsNumber, Min, Max, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ description: 'Full name (will be split into first_name and last_name - first word becomes first_name, rest becomes last_name)' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({ description: 'Time of birth (HH:MM:SS)' })
  @IsOptional()
  @IsString()
  time_of_birth?: string;

  @ApiPropertyOptional({ description: 'Place of birth' })
  @IsOptional()
  @IsString()
  place_name?: string;

  @ApiPropertyOptional({ description: 'Latitude of birth place', minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude of birth place', minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Timezone (e.g., Asia/Kolkata)' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({ description: 'Avatar image (alternative to avatar_url)' })
  @IsOptional()
  @IsString()
  avatar_img?: string;

  @ApiPropertyOptional({ description: 'Life role' })
  @IsOptional()
  @IsString()
  life_role?: string;

  @ApiPropertyOptional({ description: 'Relationship status' })
  @IsOptional()
  @IsString()
  relationship_status?: string;

  @ApiPropertyOptional({ description: 'Interests (array of strings)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}





