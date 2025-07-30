import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenResponse } from '../interfaces/token-response.interface';
import { SpotifyProfile } from '../interfaces/spotify-profile.interface';
import { User } from '../schemas/user.schema';
import { SpotifyTokenService } from './spotify-token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private spotifyTokenService: SpotifyTokenService,
  ) {}

  async findOrCreateUser(
    profile: SpotifyProfile,
    accessToken: string,
    refreshToken: string,
  ): Promise<User> {
    let user = await this.userModel.findOne({ spotifyId: profile.id });

    if (!user) {
      user = new this.userModel({
        spotifyId: profile.id,
        displayName: profile.displayName,
        accessToken,
        refreshToken,
        email: profile.emails?.[0]?.value,
        profileImageUrl: profile.photos?.[0]?.value,
      });
      await user.save();
    } else {
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();
    }

    return user;
  }

  async validateToken(accessToken: string): Promise<TokenResponse> {
    try {
      // 1. Verifica se o access token é válido
      const isAccessTokenValid =
        await this.spotifyTokenService.validateAccessToken(accessToken);

      if (isAccessTokenValid) {
        // Token válido, busca o usuário
        const user = await this.userModel.findOne({ accessToken });

        if (user) {
          return {
            isValid: true,
            user: {
              id: user.id,
              spotifyId: user.spotifyId,
              displayName: user.displayName,
              email: user.email,
              profileImageUrl: user.profileImageUrl,
            },
          };
        }
      }

      // 2. Access token inválido, busca usuário pelo token para pegar o refresh token
      const user = await this.userModel.findOne({ accessToken });

      if (!user) {
        return {
          isValid: false,
          error: 'Usuário não encontrado',
        };
      }

      // 3. Tenta renovar o access token usando o refresh token
      const newTokens = await this.spotifyTokenService.refreshAccessToken(
        user.refreshToken,
      );

      if (!newTokens) {
        return {
          isValid: false,
          error: 'Refresh token inválido',
        };
      }

      // 4. Atualiza os tokens no banco de dados
      user.accessToken = newTokens.access_token;
      if (newTokens.refresh_token) {
        user.refreshToken = newTokens.refresh_token;
      }
      await user.save();

      // 5. Retorna o novo access token
      return {
        isValid: true,
        newAccessToken: newTokens.access_token,
        user: {
          id: user.id,
          spotifyId: user.spotifyId,
          displayName: user.displayName,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
        },
      };
    } catch (error) {
      console.error('Erro na validação do token:', error);
      return {
        isValid: false,
        error: 'Erro interno do servidor',
      };
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      // Remove os tokens do usuário no banco
      await this.userModel.updateOne(
        { accessToken },
        {
          $unset: {
            accessToken: 1,
            refreshToken: 1,
          },
        },
      );
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}
