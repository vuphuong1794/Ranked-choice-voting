import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WsException,
} from '@nestjs/websockets';
import { Namespace, Server, Socket } from 'socket.io';
import { PollsService } from './polls.service';
import { SocketWithAuth } from './types';
import { WsBadRequestException } from 'src/exceptions/ws-exceptions';

@UsePipes(new ValidationPipe()) // Validate incoming data with the ValidationPipe
@WebSocketGateway({ 
  namespace: 'polls',
  // beforeConnect: (client: Socket, next) => {
  //   const token = client.handshake.auth.token;
  //   // Validate token here
  //   if (!token) {
  //     next(new Error('Authentication error'));
  //     return;
  //   }
  //   next();
  // }
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
  handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets;
    this.logger.debug(`Socket connected with userID: ${client.userID}, pollID: ${client.pollID}, and name: "${client.name}"`);
    
    this.logger.log(`WS Client connected: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    this.io.emit('hello',`from ${client.id}`);
  }

  handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;
    this.logger.debug(`Socket disconnected with userID: ${client.userID}, pollID: ${client.pollID}, and name: "${client.name}"`);
    
    this.logger.log(`WS Client disconnected: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
  }


  // Decorator để xử lý event từ client
  //lắng nghe (subscribe) các sự kiện (event) từ WebSocket client
  @SubscribeMessage('test')
  async test() {
    throw new WsBadRequestException('Invalid empty data');
  }
}
