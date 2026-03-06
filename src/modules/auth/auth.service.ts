import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService,
    ) { }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // We return success even if user doesn't exist for security reasons (prevent email enumeration)
            return { message: 'If an account with that email exists, a reset link has been sent.' };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await this.usersService.update(String(user._id), {
            resetPasswordToken: token,
            resetPasswordExpires: expires,
        });

        await this.mailService.sendPasswordResetEmail(email, token);

        return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        // Need a way to find user by token in UsersService
        // I'll add findByResetToken to UsersService first or use userModel directly here if accessible
        // Since AuthService has access to UsersService, it's better to add it there.
        // Actually, I'll just use the userModel in UsersService to find.
        const user = await this.usersService.findByResetToken(token);

        if (!user || user.resetPasswordExpires! < new Date()) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(String(user._id), {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });

        return { message: 'Password has been reset successfully' };
    }

    async validateGoogleUser(googleUser: any) {
        const user = await this.usersService.findOrCreate(googleUser);
        const tokens = await this.generateTokens(String(user._id), user.role);
        await this.updateRefreshToken(String(user._id), tokens.refreshToken);
        return {
            ...tokens,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        };
    }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });

        const tokens = await this.generateTokens(String(user._id), user.role);
        await this.updateRefreshToken(String(user._id), tokens.refreshToken);

        return tokens;
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.generateTokens(String(user._id), user.role);
        await this.updateRefreshToken(String(user._id), tokens.refreshToken);

        return tokens;
    }

    async logout(userId: string) {
        return this.usersService.updateRefreshToken(userId, null);
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied');
        }

        const refreshTokenMatches = await bcrypt.compare(
            refreshToken,
            user.refreshToken,
        );
        if (!refreshTokenMatches) {
            throw new UnauthorizedException('Access denied');
        }

        const tokens = await this.generateTokens(String(user._id), user.role);
        await this.updateRefreshToken(String(user._id), tokens.refreshToken);

        return tokens;
    }

    private async generateTokens(userId: string, role: string) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                { sub: userId, role },
                {
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: '3h',
                },
            ),
            this.jwtService.signAsync(
                { sub: userId, role },
                {
                    secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                    expiresIn: '7d',
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private async updateRefreshToken(userId: string, refreshToken: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
    }
}
