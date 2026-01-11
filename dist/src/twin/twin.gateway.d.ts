import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
type Server = any;
type Socket = any;
export declare class TwinGateway {
    private jwtService;
    private configService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(jwtService: JwtService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSubscribe(client: Socket, data: {
        twin?: number;
    }): {
        error: string;
        success?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    };
    sendTwinUpdate(userId: number, data: {
        type: string;
        twin_state?: any;
        karma_score?: number;
        mfp_score?: number;
        message?: string;
        timestamp?: string;
    }): void;
    broadcastTwinState(userId: number, state: {
        energy?: number;
        mood?: string;
        alignment?: number;
        karma_score?: number;
        mfp_score?: number;
    }): void;
    getConnectedClientsCount(userId: number): number;
}
export {};
