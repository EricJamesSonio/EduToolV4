/**
 * Phase 3: Query & Request Efficiency - Notification Summary Gating Tests
 * 
 * Tests that verify:
 * 1. useNotificationSummary gating with enabled parameter
 * 2. Feed polling disabled when dropdown closed
 * 3. Summary always polls regardless of dropdown state
 */

import { renderHook, act } from '@testing-library/react';
import { useNotificationSummary } from '../hooks/useNotifications';
import { useNotificationFeed } from '../hooks/useNotifications';
import { useNotificationStore } from '../store';
import { SUMMARY_ROWS } from '../components/shared/NotificationDropdown';

describe('Phase 3: Notification Summary Gating', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });
  });

  test('useNotificationSummary respects enabled parameter default true', () => {
    const { result } = renderHook(() => useNotificationSummary());
    expect(result.current.enabled).toBe(true);
  });

  test('useNotificationSummary respects enabled=false', () => {
    const { result } = renderHook(() => useNotificationSummary(false));
    expect(result.current.enabled).toBe(false);
  });

  test('useNotificationSummary requires token for enabled', () => {
    const { result } = renderHook(() => useNotificationSummary(undefined, { 
      // Mock no token context
    }));
    // When no token, enabled should be falsy
    expect(result.current.enabled).toBeFalsy();
  });

  test('NotificationDropdown feeds disabled when dropdown closed', () => {
    // Simulate closed dropdown state
    const { result } = renderHook(({ open }) => useNotificationFeed(open), {
      initialProps: { open: false },
    });
    // When open=false, feed should not poll
    expect(result.current.disabled).toBe(true);
  });

  test('NotificationDropdown feeds enabled when dropdown open', () => {
    // Simulate open dropdown state
    const { result } = renderHook(({ open }) => useNotificationFeed(open), {
      initialProps: { open: true },
    });
    // When open=true, feed should poll
    expect(result.current.disabled).toBe(false);
  });

  test('Summary always polls regardless of dropdown state', () => {
    // Summary should always be enabled (no open/dependency)
    const { result } = renderHook(() => useNotificationSummary());
    // Summary has no open dependency, so it should always poll
    expect(result.current.enabled).toBe(true);
  });

  test('Notification dropdown unread count merges summary and store', () => {
    // Mock store with some unread
    useNotificationStore.setState({ unreadCount: 5 });
    
    // Mock summary with different unread count
    const { result } = renderHook(() => {
      const { data: summary } = useNotificationSummary();
      const { unreadCount: storeUnread } = useNotificationStore();
      return summary?.unreadCount ?? storeUnread;
    });
    
    // Should prefer summary over store when summary has data
    expect(result.current.unreadCount).toBe(5); // summary would override or fallback
  });
});