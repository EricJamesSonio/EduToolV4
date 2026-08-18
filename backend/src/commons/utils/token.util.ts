// src/commons/utils/token.util.ts
import { JwtService } from '@nestjs/jwt';

export const generateToken = (jwtService: JwtService, payload: any) => {
  return jwtService.sign(payload);
};

export const verifyToken = (jwtService: JwtService, token: string) => {
  return jwtService.verify(token);
};
