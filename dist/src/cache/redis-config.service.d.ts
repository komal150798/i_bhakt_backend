import { ConfigService } from '@nestjs/config';
export declare class RedisConfigService {
    private configService;
    constructor(configService: ConfigService);
    get host(): string;
    get port(): number;
    get password(): string | undefined;
    get db(): number;
    get ttl(): number;
    get keyPrefix(): string;
}
