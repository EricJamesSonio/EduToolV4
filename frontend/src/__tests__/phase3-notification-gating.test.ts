import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { notificationApi } from '@/api/student/notification.api';
import {
  useNotificationSummary,
  useNotificationFeed,
} from '@/hooks/useNotifications';
import { useNotificationStore } from '@/store/notification.store';
import { useAuthStore } from '@/store/auth.store';
import { SUMMARY_ROWS } from '@/components/shared/notification/constants';

let getSummary: jest.Mock;
let getAll: jest.Mock;

function createWrapper(): React.FC<{ children: React.ReactNode }> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe('Phase 3: Notification Summary Gating', () => {
  beforeEach(() => {
    getSummary = jest.spyOn(
      notificationApi,
      'getSummary',
    ) as unknown as jest.Mock;
    getAll = jest.spyOn(notificationApi, 'getAll') as unknown as jest.Mock;

    getSummary.mockClear();
    getAll.mockClear();

    getSummary.mockResolvedValue({ unreadCount: 3, byType: {} } as never);
    getAll.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
    } as never);

    useNotificationStore.getState().setNotifications([]);
    useAuthStore.setState({ accessToken: 'test-token' } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('summary polls by default when a token exists', async () => {
    const { result } = renderHook(() => useNotificationSummary(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getSummary).toHaveBeenCalledTimes(1);
    expect(result.current.data?.unreadCount).toBe(3);
  });

  test('summary does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useNotificationSummary(false), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getSummary).not.toHaveBeenCalled();
  });

  test('summary does not fetch without an access token', async () => {
    useAuthStore.setState({ accessToken: null } as never);
    const { result } = renderHook(() => useNotificationSummary(), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getSummary).not.toHaveBeenCalled();
  });

  test('feed does not fetch while the dropdown is closed', async () => {
    const { result } = renderHook(() => useNotificationFeed(false), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getAll).not.toHaveBeenCalled();
  });

  test('feed fetches when the dropdown is open', async () => {
    const { result } = renderHook(() => useNotificationFeed(true), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  test('feed starts fetching once the dropdown opens', async () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useNotificationFeed(open),
      { wrapper: createWrapper(), initialProps: { open: false } },
    );
    expect(getAll).not.toHaveBeenCalled();
    rerender({ open: true });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  test('summary polls regardless of the feed gating', async () => {
    const wrapper = createWrapper();
    const { result: feed } = renderHook(() => useNotificationFeed(false), {
      wrapper,
    });
    const { result: summary } = renderHook(() => useNotificationSummary(), {
      wrapper,
    });
    await waitFor(() => expect(summary.current.data).toBeDefined());
    expect(feed.current.fetchStatus).toBe('idle');
    expect(getSummary).toHaveBeenCalledTimes(1);
    expect(getAll).not.toHaveBeenCalled();
  });

  test('SUMMARY_ROWS exposes rows keyed by notification type', () => {
    expect(Array.isArray(SUMMARY_ROWS)).toBe(true);
    expect(SUMMARY_ROWS.length).toBeGreaterThan(0);
    for (const row of SUMMARY_ROWS) {
      expect(typeof row.type).toBe('string');
    }
  });
});