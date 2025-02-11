import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import {Server, ServerOptions } from 'socket.io';
import { SocketWithAuth } from './polls/types';

// Custom adapter for Socket.IO to pass a dynamic port to the WebSocket gateway.
export class SocketIOAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIOAdapter.name);
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app); // Call the base IoAdapter constructor
  }

  createIOServer(port: number, options?: ServerOptions) {
    const clientPort = parseInt(this.configService.get('CLIENT_PORT'));

    const cors = {
      origin: [
        `http://localhost:${clientPort}`,
        new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`),
      ],
    };

    this.logger.log('Configuring SocketIO server with custom CORS options', {
      cors,
    });

    const optionsWithCORS: ServerOptions = {
      ...options, // Spread existing options to retain other configurations
      cors, // Add the custom CORS options
    };

    const jwtService = this.app.get(JwtService);

    //create the server with the dynamic port and new options.
    const server:Server = super.createIOServer(port, optionsWithCORS);

    server.of('polls').use(createTokenMiddleware(jwtService, this.logger));

    return server;
  }
}

const createTokenMiddleware = 
  (JwtService: JwtService, logger: Logger) => (socket: SocketWithAuth, next) => {
    //for postman testing support, fallback to token header
    const token = socket.handshake.auth.token || socket.handshake.headers['token'];

    logger.debug(`validating auth token before connection ${token}`);

    try{
      const payload = JwtService.verify(token);
      socket.userID = payload.sub;
      socket.pollID = payload.pollID;
      socket.name = payload.name;
      next();
    } catch {
      next(new Error('FORBIDDEN'));
    }
  }

