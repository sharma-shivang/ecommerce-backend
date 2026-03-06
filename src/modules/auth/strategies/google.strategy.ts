import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import * as passport from 'passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID') || 'placeholder-id',
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'placeholder-secret',
            callbackURL: `${configService.get('BACKEND_URL')}/api/auth/google/callback`,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (err: any, user: any) => void,
    ): Promise<any> {
        const { name, emails, photos } = profile;
        const user = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0].value,
            accessToken,
        };
        done(null, user);
    }
}
