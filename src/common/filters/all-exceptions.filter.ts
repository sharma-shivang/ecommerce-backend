import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        let message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        // Handle class-validator messages specifically, formatting standard nestjs constraint error formats.
        if (typeof message === 'object' && message !== null) {
            message = (message as any).message || message;
        }

        // Log to console to capture stack traces from backend
        console.error('SERVER EXCEPTION CAUGHT:', exception);

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message,
            error: exception instanceof Error ? exception.message : 'Unknown exception',
            stack: exception instanceof Error ? exception.stack : undefined
        });
    }
}
