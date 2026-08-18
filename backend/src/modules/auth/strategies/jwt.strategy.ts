// @/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../auth.repository';
import { TokenPayload } from '../entity/auth.entity';
import { AccountStatus } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: TokenPayload) {
    const account = await this.authRepository.findAccountById(payload.sub);

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    if (account.status === AccountStatus.suspended) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (
      account.status === AccountStatus.dropped ||
      account.status === AccountStatus.transferred ||
      account.status === AccountStatus.graduated
    ) {
      throw new UnauthorizedException('Account is no longer active');
    }

    // This becomes req.user in all downstream guards/controllers
    return {
      id: account.id,
      org_id: account.org_id,
      role: account.role,
      is_registrar: account.is_registrar,
      email: account.email,
      status: account.status,
      fullName: account.profile?.full_name,
      profileImage: account.profile?.profile_image,
    };
  }
}
