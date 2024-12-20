import { ConfigService } from '@nestjs/config';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class SocketIOAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIOAdapter.name);
  constructor(
    private app: INestApplicationContext,
    private ConfigService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const clientPort = parseInt(this.ConfigService.get('CLIENT_PORT'));

    const cors = {
      origin: [
        `http://locahost:${clientPort}`,
        new RegExp(`/^http:\/\/192\.168\.1\.([1-9][1-9]\d):${clientPort}$/`),
      ],
    };

    this.logger.log('Configuring SocketIO server with custom CORS options', {
      cors,
    });

    const optionsWithCORS: ServerOptions = {
      ...options,
      cors,
    };

    //we need to return this, even though the signature says it returns void
    return super.createIOServer(port, optionsWithCORS);
  }
}
