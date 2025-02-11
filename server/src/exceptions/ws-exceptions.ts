import { WsException } from "@nestjs/websockets";

// custom exception types for WebSocket exceptions
type WsExceptionType = 'BadRequest' | 'Unauthorized' | 'Unknown';

export class WsTypeException extends WsException{
    readonly type: WsExceptionType;
    constructor(type: WsExceptionType, message: string | unknown){
        const error = {
            type,
            message
        }
        super(error); //call the WsException constructor with the error object
        this.type = type; //set the type property
    }
}

export class WsBadRequestException extends WsTypeException{
    constructor(message: string | unknown){
        super('BadRequest', message);
    }
}

export class WsUnauthorizedException extends WsTypeException{
    constructor(message: string | unknown){
        super('Unauthorized', message);
    }
}

export class WsUnknownException extends WsTypeException{
    constructor(message: string | unknown){
        super('Unknown', message);
    }
}

