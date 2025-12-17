// TODO: Install @nestjs/websockets and socket.io packages
// npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
// 
// Then uncomment the imports and decorators below

// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   ConnectedSocket,
//   MessageBody,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Temporary type definitions until packages are installed
type Server = any;
type Socket = any;

// @WebSocketGateway({
//   namespace: '/realtime',
//   cors: {
//     origin: '*', // Configure properly in production
//     credentials: true,
//   },
// })
@Injectable()
export class TwinGateway {
  // @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TwinGateway.name);
  private connectedClients = new Map<string, { userId: number; socket: Socket }>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Handle client connection
   * Authenticates via JWT token in query or headers
   */
  async handleConnection(client: Socket) {
    try {
      // Get token from query or auth header
      const token =
        client.handshake.query.token?.toString() ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });

      const userId = payload.sub;
      if (!userId) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect();
        return;
      }

      // Store client connection
      this.connectedClients.set(client.id, { userId, socket: client });

      // Join user-specific room
      client.join(`twin:${userId}`);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      // Send initial twin state
      this.sendTwinUpdate(userId, {
        type: 'connected',
        message: 'Digital Twin connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      this.logger.log(`Client ${client.id} disconnected for user ${clientInfo.userId}`);
      this.connectedClients.delete(client.id);
    }
  }

  /**
   * Subscribe to twin updates
   * Client sends: { event: 'subscribe', twin: userId }
   */
  // @SubscribeMessage('subscribe')
  // TODO: Uncomment after installing websocket packages
  handleSubscribe(
    // @ConnectedSocket() 
    client: Socket,
    // @MessageBody() 
    data: { twin?: number },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      return { error: 'Not authenticated' };
    }

    const twinUserId = data.twin || clientInfo.userId;
    
    // Join twin room
    client.join(`twin:${twinUserId}`);

    this.logger.log(`Client ${client.id} subscribed to twin ${twinUserId}`);

    return {
      success: true,
      message: `Subscribed to twin ${twinUserId}`,
    };
  }

  /**
   * Send twin state update to a specific user
   */
  sendTwinUpdate(userId: number, data: {
    type: string;
    twin_state?: any;
    karma_score?: number;
    mfp_score?: number;
    message?: string;
    timestamp?: string;
  }) {
    // TODO: Uncomment after installing websocket packages
    // this.server.to(`twin:${userId}`).emit('twin_update', {
    //   ...data,
    //   timestamp: data.timestamp || new Date().toISOString(),
    // });
    this.logger.log(`Twin update for user ${userId}: ${data.type}`);
  }

  /**
   * Broadcast twin state update (for all connected clients of a user)
   */
  broadcastTwinState(userId: number, state: {
    energy?: number;
    mood?: string;
    alignment?: number;
    karma_score?: number;
    mfp_score?: number;
  }) {
    this.sendTwinUpdate(userId, {
      type: 'twin_state',
      twin_state: state,
      karma_score: state.karma_score,
      mfp_score: state.mfp_score,
    });
  }

  /**
   * Get connected clients count for a user
   */
  getConnectedClientsCount(userId: number): number {
    let count = 0;
    this.connectedClients.forEach((clientInfo) => {
      if (clientInfo.userId === userId) {
        count++;
      }
    });
    return count;
  }
}
