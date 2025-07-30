import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SpotifyTokenService {
  constructor(private configService: ConfigService) {}

  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
  } | null> {
    try {
      const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'SPOTIFY_CLIENT_SECRET',
      );

      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);

      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao renovar access token:', error.response?.data);
      return null;
    }
  }
}
