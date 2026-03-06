import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('forgot-password')
    forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @HttpCode(HttpStatus.OK)
    @Post('reset-password')
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req: express.Request) {
        // Initiates the Google OAuth2 flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: any, @Res() res: express.Response) {
        const result = await this.authService.validateGoogleUser(req.user);
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';

        // Redirect to frontend with tokens
        return res.redirect(`${frontendUrl}/login?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
    }
}
