import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SpotifyStrategy } from './strategies/spotify.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { SpotifyTokenService } from './services/spotify-token.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [SpotifyStrategy, AuthService, SpotifyTokenService],
  exports: [AuthService],
})
export class AuthModule {}
