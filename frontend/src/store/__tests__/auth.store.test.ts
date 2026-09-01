import { useAuthStore } from '../auth.store';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset to initial
    useAuthStore.setState({ user: null, accessToken: null, isLoading: true });
  });

  it('has initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('persists auth state so a refresh keeps the logged-in session', () => {
    const user = { id: '1', role: 'admin', org_id: 'org-1', email: 'a@b.com' } as any;
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setAccessToken('token-123');

    const snapshot = JSON.parse(localStorage.getItem('auth-store') ?? '{}');
    expect(snapshot.state.user).toEqual(user);
    expect(snapshot.state.accessToken).toBe('token-123');
  });

  it('setUser updates user', () => {
    const user = { id: '1', role: 'admin', org_id: 'org-1', email: 'a@b.com' } as any;
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('setAccessToken updates token', () => {
    useAuthStore.getState().setAccessToken('token-123');
    expect(useAuthStore.getState().accessToken).toBe('token-123');
    useAuthStore.getState().setAccessToken(null);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('setLoading toggles isLoading', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('clearAuth resets user and token and sets isLoading false', () => {
    useAuthStore.setState({ user: { id: '1' } as any, accessToken: 'tok', isLoading: true });
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('setUser null clears user', () => {
    useAuthStore.getState().setUser({ id: '1' } as any);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('multiple updates are independent', () => {
    const user1 = { id: '1' } as any;
    const user2 = { id: '2' } as any;
    useAuthStore.getState().setUser(user1);
    useAuthStore.getState().setAccessToken('tok1');
    useAuthStore.getState().setUser(user2);
    expect(useAuthStore.getState().user).toEqual(user2);
    expect(useAuthStore.getState().accessToken).toBe('tok1');
  });
});
