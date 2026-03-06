import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    constructor(
        private mailerService: MailerService,
        private configService: ConfigService,
    ) { }

    async sendPasswordResetEmail(email: string, token: string) {
        const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'ElevateX - Reset Your Password',
            template: './password-reset', // name of the template without extension
            context: {
                resetLink,
            },
        });
    }
}
