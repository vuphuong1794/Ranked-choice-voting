import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter } from "@nestjs/common";
import { SocketWithAuth } from "src/polls/types";
import { WsBadRequestException, WsTypeException, WsUnknownException } from "./ws-exceptions";

@Catch() //catch all exceptions happening in the gateway and filter them in ws-exceptions.ts and send them to the client
export class WsCatchAllFilter implements ExceptionFilter {
    /**
     * @param exception - Lỗi xảy ra trong quá trình xử lý WebSocket.
     * @param host - Đối tượng chứa thông tin về kết nối WebSocket.
     */
    catch(exception: Error, host: ArgumentsHost) {
        const socket: SocketWithAuth = host.switchToWs().getClient(); // Lấy đối tượng socket của client đang kết nối

        // Kiểm tra nếu lỗi là BadRequestException (do ValidationPipe hoặc thủ công ném ra)
        if(exception instanceof BadRequestException){
             // Lấy dữ liệu lỗi từ BadRequestException
            const exceptionData = exception.getResponse();

            // Trích xuất thông điệp lỗi từ exceptionData hoặc dùng tên lỗi mặc định
            const exceptionMessage = exceptionData['message'] ?? exceptionData ?? exception.name;

            // Tạo một ngoại lệ WebSocket với kiểu "BadRequest"
            const wsException = new WsBadRequestException(exceptionMessage);

            // Gửi lỗi về phía client thông qua sự kiện 'exception'
            socket.emit('exception', wsException.getError());
            return;  
        }

        if(exception instanceof WsTypeException){
            // Gửi lỗi về phía client thông qua sự kiện 'exception'
            socket.emit('exception', exception.getError());
            return;
        }

        // Nếu lỗi không phải BadRequestException, chuyển nó thành WsUnknownException
        const wsException = new WsUnknownException(exception.message);

        // Gửi lỗi không xác định về phía client
        socket.emit('exception', wsException.getError());
    }
    
}