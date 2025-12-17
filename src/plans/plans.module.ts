import { Module } from '@nestjs/common';
import { PlansService } from './services/plans.service';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';
import { RedisModule } from '../infrastructure/cache/redis.module';

@Module({
  imports: [RepositoriesModule, RedisModule],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}

