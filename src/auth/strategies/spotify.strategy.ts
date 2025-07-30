import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-spotify';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { SpotifyProfile } from '../interfaces/spotify-profile.interface';

@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('SPOTIFY_CLIENT_ID'),
      clientSecret: configService.get<string>('SPOTIFY_CLIENT_SECRET'),
      callbackURL: configService.get<string>('CALLBACK_URL'),
      scope: [
        'user-read-email',
        'user-read-private',
        'user-top-read', // ADICIONE ESTE SCOPE - é obrigatório para acessar top artists/tracks
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: SpotifyProfile,
    done: (error: any, user?: any) => void,
  ) {
    const user = await this.authService.findOrCreateUser(
      profile,
      accessToken,
      refreshToken,
    );
    done(null, user);
  }
}
