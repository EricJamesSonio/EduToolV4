// backend/src/modules/auth/__TEST__/auth-metadata-preservation.spec.ts
//
// Regression test for the bug where saveRefreshToken/clearRefreshToken
// replaced the whole Profile.metadata JSON blob, silently destroying
// educatorId/studentId (and, for students, levelId/sectionId) on every
// login, logout, or token refresh. See auth.repository.ts for the fix.
//
// NOTE: adjust the DatabaseService mock shape below to match whatever
// pattern your other *.spec.ts files already use for mocking Prisma —
// this file assumes `db.profile` / `db.$transaction` are jest.fn()s, which
// is the most common shape, but wasn't verified against an existing spec
// file since none was available when this was written.

import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from '../auth.repository';
import { DatabaseService } from '@/core/database/database.provider';

describe('AuthRepository — metadata preservation', () => {
  let repository: AuthRepository;
  let profileStore: Record<string, Record<string, any>>;

  function makeDbMock() {
    profileStore = {
      'acct-1': { educatorId: 'EDU-ABC12345' },
    };

    const profile = {
      findUnique: jest.fn(async ({ where: { account_id } }: any) => {
        const metadata = profileStore[account_id];
        return metadata ? { metadata } : null;
      }),
      update: jest.fn(async ({ where: { account_id }, data }: any) => {
        profileStore[account_id] = data.metadata;
        return { account_id, metadata: data.metadata };
      }),
      upsert: jest.fn(async ({ where: { account_id }, update, create }: any) => {
        if (profileStore[account_id]) {
          profileStore[account_id] = update.metadata;
        } else {
          profileStore[account_id] = create.metadata;
        }
        return { account_id, metadata: profileStore[account_id] };
      }),
    };

    return {
      profile,
      // Tests below call methods that internally use $transaction — run the
      // callback against the same mocked client so writes land in profileStore.
      $transaction: jest.fn(async (fn: any) => fn({ profile })),
    };
  }

  beforeEach(async () => {
    const dbMock = makeDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        { provide: DatabaseService, useValue: dbMock },
      ],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
  });

  it('saveRefreshToken preserves educatorId already in metadata', async () => {
    await repository.saveRefreshToken('acct-1', 'hashed-token-1');

    expect(profileStore['acct-1']).toEqual({
      educatorId: 'EDU-ABC12345',
      refreshToken: 'hashed-token-1',
    });
  });

  it('saveRefreshToken called twice (login then token refresh) still preserves educatorId', async () => {
    await repository.saveRefreshToken('acct-1', 'hashed-token-1');
    await repository.saveRefreshToken('acct-1', 'hashed-token-2');

    expect(profileStore['acct-1']).toEqual({
      educatorId: 'EDU-ABC12345',
      refreshToken: 'hashed-token-2',
    });
  });

  it('clearRefreshToken (logout) preserves educatorId and only nulls the token', async () => {
    await repository.saveRefreshToken('acct-1', 'hashed-token-1');
    await repository.clearRefreshToken('acct-1');

    expect(profileStore['acct-1']).toEqual({
      educatorId: 'EDU-ABC12345',
      refreshToken: null,
    });
  });

  it('preserves studentId, levelId, and sectionId the same way', async () => {
    profileStore['acct-2'] = {
      studentId: 'STU-XYZ98765',
      levelId: 'level-1',
      sectionId: 'section-1',
    };

    await repository.saveRefreshToken('acct-2', 'hashed-token');
    expect(profileStore['acct-2']).toEqual({
      studentId: 'STU-XYZ98765',
      levelId: 'level-1',
      sectionId: 'section-1',
      refreshToken: 'hashed-token',
    });

    await repository.clearRefreshToken('acct-2');
    expect(profileStore['acct-2']).toEqual({
      studentId: 'STU-XYZ98765',
      levelId: 'level-1',
      sectionId: 'section-1',
      refreshToken: null,
    });
  });

  it('saveRefreshToken on a brand-new account (no existing profile) still creates it correctly', async () => {
    delete profileStore['acct-3'];

    await repository.saveRefreshToken('acct-3', 'hashed-token');

    expect(profileStore['acct-3']).toEqual({ refreshToken: 'hashed-token' });
  });
});