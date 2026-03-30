// @/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login  @Public()
   * Accepts email + password, returns access & refresh tokens.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/refresh  @Public()
   * Accepts a refresh token, issues a new token pair.
   * We still require the user to be identified; the refresh token
   * is validated inside the service against the stored hash.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * POST /auth/logout
   * Clears the stored refresh token — invalidates the session.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async logout(@CurrentUser('id') accountId: string) {
    await this.authService.logout(accountId);
  }

  /**
   * GET /auth/me
   * Returns the current authenticated account's profile.
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser('id') accountId: string) {
    return this.authService.getMe(accountId);
  }
}