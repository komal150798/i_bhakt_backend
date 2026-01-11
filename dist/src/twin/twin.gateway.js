"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TwinGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwinGateway = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let TwinGateway = TwinGateway_1 = class TwinGateway {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(TwinGateway_1.name);
        this.connectedClients = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.query.token?.toString() ||
                client.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET') || 'your-secret-key',
            });
            const userId = payload.sub;
            if (!userId) {
                this.logger.warn(`Client ${client.id} connected with invalid token`);
                client.disconnect();
                return;
            }
            this.connectedClients.set(client.id, { userId, socket: client });
            client.join(`twin:${userId}`);
            this.logger.log(`Client ${client.id} connected for user ${userId}`);
            this.sendTwinUpdate(userId, {
                type: 'connected',
                message: 'Digital Twin connected',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error(`Connection error for client ${client.id}:`, error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            this.logger.log(`Client ${client.id} disconnected for user ${clientInfo.userId}`);
            this.connectedClients.delete(client.id);
        }
    }
    handleSubscribe(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo) {
            return { error: 'Not authenticated' };
        }
        const twinUserId = data.twin || clientInfo.userId;
        client.join(`twin:${twinUserId}`);
        this.logger.log(`Client ${client.id} subscribed to twin ${twinUserId}`);
        return {
            success: true,
            message: `Subscribed to twin ${twinUserId}`,
        };
    }
    sendTwinUpdate(userId, data) {
        this.logger.log(`Twin update for user ${userId}: ${data.type}`);
    }
    broadcastTwinState(userId, state) {
        this.sendTwinUpdate(userId, {
            type: 'twin_state',
            twin_state: state,
            karma_score: state.karma_score,
            mfp_score: state.mfp_score,
        });
    }
    getConnectedClientsCount(userId) {
        let count = 0;
        this.connectedClients.forEach((clientInfo) => {
            if (clientInfo.userId === userId) {
                count++;
            }
        });
        return count;
    }
};
exports.TwinGateway = TwinGateway;
exports.TwinGateway = TwinGateway = TwinGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], TwinGateway);
//# sourceMappingURL=twin.gateway.js.map