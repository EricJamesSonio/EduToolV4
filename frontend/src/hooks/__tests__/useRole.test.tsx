import { renderHook, act } from '@testing-library/react';
import { useRole, useRoleGuard } from '../useRole';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseRouter = jest.requireMock('next/navigation').useRouter as jest.Mock;

describe('useRole', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns role and isRegistrar from user', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin', isRegistrar: true }, isLoading: false });
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe('admin');
    expect(result.current.isRegistrar).toBe(true);
  });

  it('returns null role when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBeNull();
    expect(result.current.isRegistrar).toBe(false);
  });

  it('returns false for isRegistrar when undefined', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'educator' }, isLoading: false });
    const { result } = renderHook(() => useRole());
    expect(result.current.isRegistrar).toBe(false);
  });
});

describe('useRoleGuard', () => {
  let mockReplace: jest.Mock;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReplace = jest.fn();
    mockUseRouter.mockReturnValue({ replace: mockReplace });
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('returns loading when isLoading true', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    const { result } = renderHook(() => useRoleGuard(['admin']));
    expect(result.current.status).toBe('loading');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns allowed when user has allowed role', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' }, isLoading: false });
    const { result } = renderHook(() => useRoleGuard(['admin']));
    expect(result.current.status).toBe('allowed');
  });

  it('redirects to /login when not allowed', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'student' }, isLoading: false });
    renderHook(() => useRoleGuard(['admin']));
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('redirects when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    renderHook(() => useRoleGuard(['admin']));
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('returns redirecting status when not allowed', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'student' }, isLoading: false });
    const { result } = renderHook(() => useRoleGuard(['admin']));
    // After redirect, status should be redirecting (or loading if redirectedRef true)
    expect(['redirecting', 'loading']).toContain(result.current.status);
  });

  it('does not redirect twice (redirectedRef guard)', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'student' }, isLoading: false });
    const { rerender } = renderHook(() => useRoleGuard(['admin']));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    rerender();
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('adds pageshow listener and cleans up', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' }, isLoading: false });
    const { unmount } = renderHook(() => useRoleGuard(['admin']));
    expect(addEventListenerSpy).toHaveBeenCalledWith('pageshow', expect.any(Function));
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pageshow', expect.any(Function));
  });

  it('pageshow handler checks persisted and calls store', () => {
    const store = require('@/store/auth.store').useAuthStore;
    const originalGetState = store.getState;
    const mockGetState = jest.fn().mockReturnValue({ user: null });
    store.getState = mockGetState;

    mockUseAuth.mockReturnValue({ user: { role: 'admin' }, isLoading: false });
    renderHook(() => useRoleGuard(['admin']));

    const handler = addEventListenerSpy.mock.calls.find(c => c[0] === 'pageshow')?.[1];
    expect(handler).toBeDefined();
    // Should check persisted and call getState when persisted true
    handler({ persisted: true } as any);
    expect(mockGetState).toHaveBeenCalled();

    const callsBefore = mockGetState.mock.calls.length;
    handler({ persisted: false } as any);
    // When not persisted, handler returns early before calling getState? Actually it returns if !e.persisted
    expect(mockGetState.mock.calls.length).toBe(callsBefore);

    store.getState = originalGetState;
  });

  it('allows multiple roles', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'educator' }, isLoading: false });
    const { result } = renderHook(() => useRoleGuard(['admin', 'educator']));
    expect(result.current.status).toBe('allowed');
  });
});
