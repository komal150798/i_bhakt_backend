import { IsString, IsOptional, IsInt, Min, Max, MaxLength, MinLength, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar_url?: string;

  @ApiProperty({ example: 'Mumbai, India', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty({ example: 'iBhakt helped me manifest my dream job!' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'manifestation', enum: ['manifestation', 'career', 'love', 'spiritual', 'karma'] })
  @IsString()
  @IsIn(['manifestation', 'career', 'love', 'spiritual', 'karma'])
  category: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  display_order?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
