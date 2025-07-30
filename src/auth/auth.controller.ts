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

import { TokenValidationDto } from './dto/token-validation.dto';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('spotify')
  @UseGuards(AuthGuard('spotify'))
  spotifyLogin() {}

  @Get('spotify/callback')
  @UseGuards(AuthGuard('spotify'))
  async spotifyCallback(@Req() req, @Res() res: Response) {
    const user = req.user;
    res.redirect(
      `http://localhost:3000/login-success?access=${user.accessToken}&refresh=${user.refreshToken}`,
    );
  }

  @Post('validate-token')
  async validateToken(@Body() tokenValidationDto: TokenValidationDto) {
    console.log('Validating token:', tokenValidationDto.accessToken);
    const result = await this.authService.validateToken(
      tokenValidationDto.accessToken,
    );
    console.log('Validation result:', result);
    if (result.isValid) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Token válido',
        data: result,
      };
    } else {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: result.error || 'Token inválido',
        data: result,
      };
    }
  }

  @Post('logout')
  async logout(@Body() tokenValidationDto: TokenValidationDto) {
    await this.authService.logout(tokenValidationDto.accessToken);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logout realizado com sucesso',
    };
  }
}
