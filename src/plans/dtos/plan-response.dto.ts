import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from '../../common/enums/plan-type.enum';

export class PlanResponseDto {
  @ApiProperty()
  unique_id: string;

  @ApiProperty({ enum: PlanType })
  plan_type: PlanType;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  tagline: string | null;

  @ApiProperty()
  monthly_price: number;

  @ApiProperty({ nullable: true })
  yearly_price: number | null;

  @ApiProperty()
  currency: string;

  @ApiProperty({ nullable: true })
  billing_cycle_days: number | null;

  @ApiProperty({ nullable: true })
  trial_days: number | null;

  @ApiProperty({ nullable: true })
  referral_count_required: number | null;

  @ApiProperty()
  is_popular: boolean;

  @ApiProperty()
  is_featured: boolean;

  @ApiProperty()
  sort_order: number;

  @ApiProperty({ nullable: true })
  badge_color: string | null;

  @ApiProperty({ nullable: true })
  badge_icon: string | null;

  @ApiProperty({ nullable: true })
  features: Array<{ name: string; description?: string; icon?: string }> | null;

  @ApiProperty({ nullable: true })
  usage_limits: Record<string, number> | null;

  @ApiProperty({ nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ type: [String] })
  modules: string[]; // Module slugs

  @ApiProperty()
  added_date: Date;

  @ApiProperty()
  modify_date: Date;
}







