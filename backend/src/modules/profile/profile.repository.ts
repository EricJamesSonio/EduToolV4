import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class ProfileRepository {
  constructor(private readonly db: DatabaseService) {}

  async updatePersonalEmail(accountId: string, personalEmail: string | null) {
    return this.db.profile.update({
      where: { account_id: accountId },
      data:  { personal_email: personalEmail },
    })
  }

  async findByAccountId(accountId: string) {
    return this.db.profile.findUnique({
      where: { account_id: accountId },
    })
  }
}