import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { PollsService } from './polls.service';
import { Namespace, Socket } from 'socket.io';

// Define WebSocket Gateway with 'polls' namespace
// This means clients will connect to 'websocket-url/polls'
@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  // Create a logger instance specific to this gateway
  private readonly logger = new Logger(PollsGateway.name);

  // Inject PollsService through constructor dependency injection
  constructor(private readonly pollService: PollsService) {}

  // Decorator to get access to the WebSocket server instance
  // io will be a Namespace instance that lets us emit events to all connected clients
  @WebSocketServer() 
  io: Namespace;

  // Lifecycle hook that runs when gateway is initialized
  // This happens when the application starts
  afterInit(): void {
    this.logger.log('Websocket gateway initialized');
  }

  // Lifecycle hook that runs when a new client connects
  // The client parameter contains information about the connected client
  // like their socket id, connection details, etc.
  handleConnection(client: Socket) {
    throw new Error('Method not implemented.');
  }

  // Lifecycle hook that runs when a client disconnects
  // Useful for cleanup operations when a client leaves
  handleDisconnect(client: Socket) {
    throw new Error('Method not implemented.');
  }
}