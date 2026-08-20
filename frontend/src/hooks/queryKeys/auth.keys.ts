const authKeys = {
  all: ['auth'] as const,
} as const;

export const authQueryKeys = {
  ...authKeys,
  profile: () => [...authKeys.all, 'profile'] as const,
  me: () => [...authKeys.all, 'me'] as const,
} as const;
