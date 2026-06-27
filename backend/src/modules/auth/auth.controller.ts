import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Response } from 'express';

import { IsNotEmpty, IsString } from 'class-validator';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const result = await this.authService.login(user);

    // Set refresh token as httpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refresh_token, COOKIE_OPTIONS);

    // Return access token + user in body; refresh_token goes only in cookie
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refrescar token de acceso usando cookie httpOnly' })
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('No hay sesión activa. Inicia sesión nuevamente.');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    // Rotar la cookie con el nuevo refresh token
    res.cookie(REFRESH_TOKEN_COOKIE, result.refresh_token, COOKIE_OPTIONS);

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión (invalidar refresh tokens y limpiar cookie)' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    // Limpiar cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });

    if (req.user?.id) {
      return this.authService.logout(req.user.id);
    }

    return { message: 'Sesión cerrada exitosamente' };
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Obtener usuario autenticado' })
  async me(@Req() req: any) {
    return this.authService.me(req.user.id);
  }
}
