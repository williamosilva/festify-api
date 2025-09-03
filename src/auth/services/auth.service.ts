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
      const isAccessTokenValid =
        await this.spotifyTokenService.validateAccessToken(accessToken);

      if (isAccessTokenValid) {
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

      const user = await this.userModel.findOne({ accessToken });

      if (!user) {
        return {
          isValid: false,
          error: 'User not found',
        };
      }

      const newTokens = await this.spotifyTokenService.refreshAccessToken(
        user.refreshToken,
      );

      if (!newTokens) {
        return {
          isValid: false,
          error: 'Invalid refresh token',
        };
      }

      user.accessToken = newTokens.access_token;
      if (newTokens.refresh_token) {
        user.refreshToken = newTokens.refresh_token;
      }
      await user.save();

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
      console.error('Error validating token:', error);
      return {
        isValid: false,
        error: 'Internal server error',
      };
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
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
      console.error('Error logging out:', error);
    }
  }
}
