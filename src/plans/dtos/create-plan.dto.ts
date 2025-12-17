import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '../../common/enums/plan-type.enum';

class FeatureDto {
  @ApiProperty({ example: 'Unlimited Karma Entries' })
  name: string;

  @ApiPropertyOptional({ example: 'Record unlimited karma journal entries' })
  description?: string;

  @ApiPropertyOptional({ example: 'bi-check-circle' })
  icon?: string;
}

export class CreatePlanDto {
  @ApiProperty({ enum: PlanType, example: PlanType.REFERRAL })
  @IsEnum(PlanType)
  plan_type: PlanType;

  @ApiProperty({ example: 'Karma Builder' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Build your karma with enhanced features' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Your good karma unlocks more awareness' })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiProperty({ example: 499.00 })
  @IsNumber()
  @Min(0)
  monthly_price: number;

  @ApiPropertyOptional({ example: 4990.00 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  yearly_price?: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @IsOptional()
  billing_cycle_days?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsNumber()
  @IsOptional()
  trial_days?: number;

  @ApiPropertyOptional({ example: 11 })
  @IsNumber()
  @IsOptional()
  referral_count_required?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_popular?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsString()
  @IsOptional()
  badge_color?: string;

  @ApiPropertyOptional({ example: 'bi-star-fill' })
  @IsString()
  @IsOptional()
  badge_icon?: string;

  @ApiPropertyOptional({ type: [FeatureDto] })
  @IsArray()
  @IsOptional()
  features?: FeatureDto[];

  @ApiPropertyOptional({ example: { karma_entries: 100, manifestation_entries: 50 } })
  @IsOptional()
  usage_limits?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

