import { create } from 'zustand';
import client from '../api/client';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  alias: string | null;
  sessionCode: string | null;
  setAuth: (token: string, username: string, role: string, alias: string, sessionCode?: string | null) => void;
  logout: (code?: string | null) => void;
  clearAuth: (code?: string | null) => void;
  sync: (pathname: string) => void;
}

const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
const initialToken = isAdminRoute ? localStorage.getItem('admin_token') : localStorage.getItem('player_token');
if (typeof window !== 'undefined') {
  if (initialToken) {
    localStorage.setItem('active_token', initialToken);
  } else {
    localStorage.removeItem('active_token');
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  username: isAdminRoute ? localStorage.getItem('admin_username') : localStorage.getItem('player_username'),
  role: isAdminRoute ? localStorage.getItem('admin_role') : localStorage.getItem('player_role'),
  alias: isAdminRoute ? localStorage.getItem('admin_alias') : localStorage.getItem('player_alias'),
  sessionCode: isAdminRoute ? null : localStorage.getItem('player_sessionCode'),

  setAuth: (token, username, role, alias, sessionCode = null) => {
    if (role === 'ADMIN') {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_username', username);
      localStorage.setItem('admin_role', role);
      localStorage.setItem('admin_alias', alias);
    } else {
      localStorage.setItem('player_token', token);
      localStorage.setItem('player_username', username);
      localStorage.setItem('player_role', role);
      localStorage.setItem('player_alias', alias);
      if (sessionCode) {
        localStorage.setItem('player_sessionCode', sessionCode);
      } else {
        localStorage.removeItem('player_sessionCode');
      }
    }
    localStorage.setItem('active_token', token);
    set({ token, username, role, alias, sessionCode });
  },

  clearAuth: () => {
    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (isAdmin) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_username');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_alias');
    } else {
      localStorage.removeItem('player_token');
      localStorage.removeItem('player_username');
      localStorage.removeItem('player_role');
      localStorage.removeItem('player_alias');
      localStorage.removeItem('player_sessionCode');
    }
    localStorage.removeItem('active_token');

    set({
      token: null,
      username: null,
      role: null,
      alias: null,
      sessionCode: null,
    });
  },

  logout: () => {
    // Clear cookie on server
    client.post('/auth/logout').catch(() => {});
    useAuthStore.getState().clearAuth();
  },

  sync: (pathname) => {
    const isAdmin = pathname.startsWith('/admin');
    const token = isAdmin ? localStorage.getItem('admin_token') : localStorage.getItem('player_token');
    const username = isAdmin ? localStorage.getItem('admin_username') : localStorage.getItem('player_username');
    const role = isAdmin ? localStorage.getItem('admin_role') : localStorage.getItem('player_role');
    const alias = isAdmin ? localStorage.getItem('admin_alias') : localStorage.getItem('player_alias');
    const sessionCode = isAdmin ? null : localStorage.getItem('player_sessionCode');

    if (token) {
      localStorage.setItem('active_token', token);
    } else {
      localStorage.removeItem('active_token');
    }

    set({ token, username, role, alias, sessionCode });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth-failure', () => {
    if (useAuthStore.getState().username !== null) {
      useAuthStore.getState().clearAuth();
    }
  });
}
