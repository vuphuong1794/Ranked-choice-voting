import { BadRequestException, Logger, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WsException,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Namespace, Server, Socket } from 'socket.io';
import { PollsService } from './polls.service';
import { AddNominationData, SocketWithAuth } from './types';
import { WsCatchAllFilter } from 'src/exceptions/ws-catch-all-filter';
import { GatewayAdminGuard } from './gateway-admin-gaurd';
import { NominationDto } from './dtos';

@UsePipes(new ValidationPipe()) // Validate incoming data with the ValidationPipe
@UseFilters(new WsCatchAllFilter()) // Catch all exceptions and emit them to the client
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
  async handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    this.logger.debug(
      `Socket connected with userID: ${client.userID}, pollID: ${client.pollID}, and name: "${client.name}"`,
    );

    this.logger.log(`WS Client with id: ${client.id} connected!`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    const roomName = client.pollID;
    await client.join(roomName);

    // Get count of clients in this poll's room
    // Using optional chaining (?.) and nullish coalescing (??) to safely handle undefined
    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `userID: ${client.userID} joined room with name: ${roomName}`,
    );
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );

    
    const updatedPoll = await this.pollsService.addParticipant({
      pollID: client.pollID,
      userID: client.userID,
      name: client.name,
    });

    // Add participant to the poll in the database
    this.io.to(roomName).emit('poll_updated', updatedPoll);
  }

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { pollID, userID } = client;
    const updatedPoll = await this.pollsService.removeParticipant(
      pollID,
      userID,
    );

    const roomName = client.pollID;

    // Get count of clients in this poll's room
    // Using optional chaining (?.) and nullish coalescing (??) to safely handle undefined
    const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${clientCount}`,
    );

    // updatedPoll could be undefined if the the poll already started
    // in this case, the socket is disconnect, but no the poll state
    if (updatedPoll) {
      this.io.to(pollID).emit('poll_updated', updatedPoll);
    }
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_participant')
  async removeParticipant(@MessageBody('id') id: string, @ConnectedSocket() client: SocketWithAuth) 
  {
    this.logger.debug(`Attempting to remove participant with ID: ${id} from poll with ID: ${client.pollID}`);

    const updatedPoll = await this.pollsService.removeParticipant(client.pollID, id);

    if(updatedPoll) {
      this.io.to(client.pollID).emit('poll_update', updatedPoll);
    }
  }
  
  @SubscribeMessage('nominate')
  async nominate(@MessageBody() nomination: NominationDto, @ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(
      `Attempting to add nomination for user with ID: ${client.userID} to poll with ID: ${client.pollID}\n${nomination.text}`,
    )

    const updatedPoll = await this.pollsService.addNomination({
      pollID: client.pollID,
      userID: client.userID,
      text: nomination.text,
    });

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_nomination')
  async removeNomination(@MessageBody('id') nominationID: string, @ConnectedSocket() client: SocketWithAuth) {
    this.logger.debug(`Attempting to remove nomination with ID: ${nominationID} from poll with ID: ${client.pollID}`);
    
    const updatedPoll = await this.pollsService.removeNomination(client.pollID, nominationID);

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }
}
