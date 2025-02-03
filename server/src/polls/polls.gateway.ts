import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Namespace, Server, Socket } from 'socket.io';
import { PollsService } from './polls.service';

@WebSocketGateway({ 
  namespace: 'polls',
  beforeConnect: (client: Socket, next) => {
    const token = client.handshake.auth.token;
    // Validate token here
    if (!token) {
      next(new Error('Authentication error'));
      return;
    }
    next();
  }
})
export class PollsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {}

  // Decorator to get access to the WebSocket server instance
  // io will be a Namespace instance that lets us emit events to all connected clients
  @WebSocketServer() io: Namespace;
  // Hook được gọi sau khi Gateway khởi tạo
  afterInit(): void {
    this.logger.log('WebSocket Gateway hi');
  }

  // Log khi có client kết nối
  handleConnection(client: Socket) {
    const sockets = this.io.sockets;

    this.logger.log(`Client connected: ${client.id}`);
    this.logger.debug(`Total clients: ${sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    const sockets = this.io.sockets;
    
    this.logger.log(`Client disconnected: ${client.id}`);
    this.logger.debug(`Total clients: ${sockets.size}`);
  }
}
