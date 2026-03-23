import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class AuthRepository {
  constructor(private db: DatabaseService) {}

  async findByEmail(email: string) {
    return this.db.account.findFirst({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.db.account.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async createAccount(data: {
    email: string;
    password: string;
    full_name: string;
  }) {
    return this.db.account.create({
      data: {
        email: data.email,
        password: data.password,
        role: 'student',
        status: 'active',
        profile: {
          create: {
            full_name: data.full_name,
          },
        },
      },
      include: { profile: true },
    });
  }
}