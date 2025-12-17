import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CMSPage } from './entities/cms-page.entity';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CMSPage]),
    CacheModule,
  ],
  providers: [],
  exports: [],
})
export class CmsModule {}







