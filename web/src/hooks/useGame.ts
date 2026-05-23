import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { SessionResponse, CastSpellResponse, AuthResponse } from '../types';

// Fetch session state by code
export function useSession(code: string | undefined) {
  return useQuery({
    queryKey: ['session', code],
    queryFn: async () => {
      if (!code) throw new Error('No session code provided');
      const res = await client.get<SessionResponse>(`/sessions/${code}`);
      return res.data;
    },
    enabled: !!code,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 1 second if the game is waiting or currently active
      if (data && (data.status === 'WAITING' || data.status === 'ACTIVE')) {
        return 1000;
      }
      return false;
    },
  });
}

// Guest login and join room mutation
export function useRegisterAndJoin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, code }: { username: string; code: string }) => {
      // 1. Generate guest credentials
      const rand = Math.floor(1000 + Math.random() * 9000);
      const guestUsername = `${username.trim().replace(/\s+/g, '')}_${rand}`;
      const email = `${guestUsername.toLowerCase()}@guest.shellspell.com`;
      const password = `guestPassword_${rand}`;

      // 2. Auto-Register
      await client.post('/auth/register', { username: guestUsername, email, password });

      // 3. Login and fetch JWT
      const loginRes = await client.post<AuthResponse>('/auth/login', { username: guestUsername, password });
      const { token, role } = loginRes.data;

      // 4. Save session context
      localStorage.setItem('token', token);
      localStorage.setItem('username', guestUsername);
      localStorage.setItem('role', role);
      localStorage.setItem('alias', username);

      // 5. Join Session
      const joinRes = await client.post<SessionResponse>(`/sessions/${code}/join`);
      return joinRes.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session', data.sessionCode] });
    },
  });
}

// Host Admin registration, login, session creation and self-join
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, dragonHealth }: { username: string; dragonHealth: number }) => {
      // 1. Generate admin credentials (must contain "admin" in username to get ADMIN role)
      const rand = Math.floor(1000 + Math.random() * 9000);
      const adminUsername = `admin_${username.trim().replace(/\s+/g, '')}_${rand}`;
      const email = `${adminUsername.toLowerCase()}@admin.shellspell.com`;
      const password = `adminPassword_${rand}`;

      // 2. Auto-Register
      await client.post('/auth/register', { username: adminUsername, email, password });

      // 3. Login
      const loginRes = await client.post<AuthResponse>('/auth/login', { username: adminUsername, password });
      const { token, role } = loginRes.data;

      // 4. Save session context
      localStorage.setItem('token', token);
      localStorage.setItem('username', adminUsername);
      localStorage.setItem('role', role);
      localStorage.setItem('alias', username);

      // 5. Create Session
      const createRes = await client.post<SessionResponse>('/sessions', { dragonHealth });
      const { sessionCode } = createRes.data;

      // 6. Join Session
      await client.post<SessionResponse>(`/sessions/${sessionCode}/join`);
      return sessionCode;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ['session', code] });
    },
  });
}

// Start Session (Change status from WAITING to ACTIVE)
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const res = await client.patch<SessionResponse>(`/sessions/${code}/start`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session', data.sessionCode] });
    },
  });
}

// Cast Spell mutation
export function useCastSpell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, spellName }: { code: string; spellName: string }) => {
      const res = await client.post<CastSpellResponse>(`/sessions/${code}/spells`, { spellName });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session', variables.code] });
    },
  });
}
