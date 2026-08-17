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
import { JwtService } from '@nestjs/jwt';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { RegisterDto, VerifyOtpDto, ResendOtpDto } from './dto/register.dto';
import {
  SendAdminRequestOtpDto,
  VerifyAdminRequestOtpDto,
  SubmitAdminRequestDto,
} from './dto/admin-request.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { AdminRequestSessionGuard } from './admin-request-session.guard';
import { AdminRequestSession } from './admin-request-session.decorator';
import type { AdminRequestSessionClaims } from './entity/admin-request-session.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto);

    // Set refresh token as HTTP-only cookie — NOT accessible to JS.
    // sameSite is 'none' in production because the frontend and backend live on
    // different Render subdomains (cross-site); 'none' is silently rejected by
    // browsers unless `secure: true`, which the helper sets in production.
    res.cookie('refreshToken', tokens.refreshToken, {
      ...this.getCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Only return access token in body (refresh token is cookie-only)
    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      req.cookies?.refreshToken ?? this.getCookie(req, 'refreshToken');
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refresh(refreshToken);

    // Set new refresh token as HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      ...this.getCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

  private getCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd, // 'none' cookies are rejected by browsers without secure:true
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // ALWAYS clear the refresh token cookie — even if access token is expired.
    // clearCookie MUST use the exact same sameSite/secure/path as the cookie
    // was set with, or the browser won't recognize it and won't delete it.
    res.clearCookie('refreshToken', this.getCookieOptions());

    // Also try to clear the server-side refresh token hash
    const refreshToken =
      req.cookies?.refreshToken ?? this.getCookie(req, 'refreshToken');
    if (refreshToken) {
      try {
        const payload = this.jwtService.decode(refreshToken);
        if (payload?.sub) {
          await this.authService.logout(payload.sub);
        }
      } catch {
        // Cookie is already cleared — that's sufficient
      }
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser('id') accountId: string) {
    return this.authService.getMe(accountId);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  // ─── Admin Request (public applicant side) ──────────────────────────────

  @Post('admin-request/otp')
  @HttpCode(HttpStatus.OK)
  async sendAdminRequestOtp(@Body() dto: SendAdminRequestOtpDto) {
    return this.authService.sendAdminRequestOtp(dto);
  }

  @Post('admin-request/verify')
  @HttpCode(HttpStatus.OK)
  async verifyAdminRequestOtp(@Body() dto: VerifyAdminRequestOtpDto) {
    return this.authService.verifyAdminRequestOtp(dto);
  }

  @Get('admin-request/me')
  @UseGuards(AdminRequestSessionGuard)
  async getAdminRequestMe(
    @AdminRequestSession() session: AdminRequestSessionClaims,
  ) {
    return this.authService.getAdminRequestMe(session);
  }

  @Post('admin-request/submit')
  @UseGuards(AdminRequestSessionGuard)
  @HttpCode(HttpStatus.OK)
  async submitAdminRequest(
    @AdminRequestSession() session: AdminRequestSessionClaims,
    @Body() dto: SubmitAdminRequestDto,
  ) {
    return this.authService.submitAdminRequest(session, dto);
  }
}
