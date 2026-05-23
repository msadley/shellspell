export type UserRole = 'ADMIN' | 'PLAYER';
export type SessionStatus = 'WAITING' | 'ACTIVE' | 'FINISHED';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

export interface SessionResponse {
  sessionCode: string;
  status: SessionStatus;
  dragonHealth: number;
  hostAdminUsername: string;
}

export interface CastSpellResponse {
  spellName: string;
  damageDealt: number;
  remainingDragonHealth: number;
  gameStatus: SessionStatus;
}
