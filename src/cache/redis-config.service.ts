import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService {
  constructor(private configService: ConfigService) {}

  get host(): string {
    return this.configService.get<string>('redis.host', 'localhost');
  }

  get port(): number {
    return this.configService.get<number>('redis.port', 6379);
  }

  get password(): string | undefined {
    return this.configService.get<string>('redis.password');
  }

  get db(): number {
    return this.configService.get<number>('redis.db', 0);
  }

  get ttl(): number {
    return this.configService.get<number>('redis.ttl', 3600);
  }

  get keyPrefix(): string {
    return this.configService.get<string>('redis.keyPrefix', 'ibhakt:');
  }
}







