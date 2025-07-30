import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { TokenValidationDto } from './dto/token-validation.dto';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('spotify')
  @UseGuards(AuthGuard('spotify'))
  spotifyLogin() {}

  @Get('spotify/callback')
  @UseGuards(AuthGuard('spotify'))
  async spotifyCallback(@Req() req, @Res() res: Response) {
    const user = req.user;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    res.redirect(
      `${frontendUrl}/login-success?access=${user.accessToken}&refresh=${user.refreshToken}`,
    );
  }

  @Post('validate-token')
  async validateToken(@Body() tokenValidationDto: TokenValidationDto) {
    const result = await this.authService.validateToken(
      tokenValidationDto.accessToken,
    );

    if (result.isValid) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Token is valid',
        data: result,
      };
    } else {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: result.error || 'Invalid token',
        data: result,
      };
    }
  }

  @Post('logout')
  async logout(@Body() tokenValidationDto: TokenValidationDto) {
    await this.authService.logout(tokenValidationDto.accessToken);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logout successful',
    };
  }
}
