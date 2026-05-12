// @/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * POST /auth/login  @Public()
   * Accepts email + password, returns access & refresh tokens.
   * Sets refresh token as HttpOnly cookie.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    console.log('>>> LOGIN ROUTE HIT');
    const tokens = await this.authService.login(dto);

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Return only access token in response body
    return {
      accessToken: tokens.accessToken,
    };
  }

  /**
   * POST /auth/refresh  @Public()
   * Accepts a refresh token from cookie, issues a new token pair.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken ?? this.getCookie(req, 'refreshToken');
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refresh(refreshToken);

    // Set new refresh token as HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Return only access token in response body
    return {
      accessToken: tokens.accessToken,
    };
  }

  private getCookie(req: Request, name: string): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;

    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

    if (!match) return undefined;
    return decodeURIComponent(match.slice(name.length + 1));
  }

  /**
   * POST /auth/logout
   * Clears the stored refresh token — invalidates the session.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async logout(@CurrentUser('id') accountId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(accountId);

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/',
    });
  }

  /**
   * GET /auth/me
   * Returns the current authenticated account's profile.
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser('id') accountId: string) {
    console.log('>>> ME ROUTE HIT');
    return this.authService.getMe(accountId);
  }
}
