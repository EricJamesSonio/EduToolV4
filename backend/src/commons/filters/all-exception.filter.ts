import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    console.error(exception);

    // Multer (file upload) errors → friendly 400 instead of a generic 500
    if (exception?.name === 'MulterError' && exception?.code === 'LIMIT_FILE_SIZE') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'File is too large. Please upload an image under 2MB.',
      });
    }
    if (exception?.name === 'MulterError') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'File upload failed. Please try again.',
      });
    }

    // If it's an HttpException (401, 403, 404, etc.), preserve its status/message
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return response.status(status).json(
        typeof body === 'object'
          ? { success: false, statusCode: status, ...body }
          : { success: false, statusCode: status, message: body },
      );
    }

    // Only true unknowns get 500
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}