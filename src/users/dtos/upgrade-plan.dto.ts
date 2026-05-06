import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Body for assigning an enabled plan to the current user (direct activation; use payment verify for production checkout).
 * Send either database id or plan unique_id from GET /app/subscription/plans.
 */
export class UpgradePlanDto {
  @IsOptional()
  @IsString()
  unique_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plan_id?: number;
}
