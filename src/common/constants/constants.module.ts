import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConstant } from './entities/app-constant.entity';
import { ConstantsService } from './constants.service';
import { CacheModule } from '../../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppConstant]),
    CacheModule, // For Redis caching
  ],
  providers: [ConstantsService],
  exports: [ConstantsService, TypeOrmModule], // Export for use in other modules
})
export class ConstantsModule {}

