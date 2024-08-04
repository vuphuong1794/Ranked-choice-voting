import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  //nếu có promise trả về true thì guard sẽ cho ta tiếp tục nếu không thì sẽ block
  //nếu jwt không hợp lệ thì sẽ block và trả ra lỗi

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    //request toi duoc dung la restAPI
    const request = context.switchToHttp().getRequest();
    //kiem tra token
    this.logger.debug(
      `checking for auth auth token on request body`,
      request.body,
    );

    const { accessToken } = request.body;
    try {
      const payload = this.jwtService.verify(accessToken);
      //append user and poll to socket
      request.userID = payload.sub;
      request.pollID = payload.pollID;
      request.name = payload.name;
      return true;
    } catch {
      throw new ForbiddenException(`Invalid authorization token`);
    }
  }
}
