import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Docker/the containerized env talks to the DB over TLS but the remote
    // chain is self-signed for the managed Postgres. Opt-in (via env) to
    // skip chain verification only there, leaving local dev untouched.
    const skipVerify =
      process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false';

    let connectionString = process.env.DATABASE_URL;
    let ssl: { rejectUnauthorized: boolean } | undefined;

    if (skipVerify) {
      ssl = { rejectUnauthorized: false };

      // pg treats `sslmode=require` as an alias for `verify-full` and lets it
      // override any explicit ssl option. Strip it so the ssl option below is
      // honored (TLS still used, only chain verification skipped at runtime).
      const queryIndex = connectionString.lastIndexOf('?');
      if (queryIndex !== -1) {
        const params = new URLSearchParams(connectionString.slice(queryIndex + 1));
        params.delete('sslmode');
        const query = params.toString();
        connectionString = connectionString.slice(0, queryIndex) + (query ? `?${query}` : '');
      }
    }

    const pool = new Pool({
      connectionString,
      ...(ssl ? { ssl } : {}),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}