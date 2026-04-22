import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRazorpayOrderDto {
  @ApiProperty({ description: 'Plan unique_id (UUID) from GET /home/plans or app/subscription/plans' })
  @IsUUID()
  plan_unique_id: string;

  @ApiPropertyOptional({ enum: ['yearly', 'monthly'], default: 'yearly' })
  @IsOptional()
  @IsEnum(['yearly', 'monthly'] as const)
  billing?: 'yearly' | 'monthly';
}
