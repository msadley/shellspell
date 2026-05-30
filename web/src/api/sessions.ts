import client from "./client";
import {
  SessionResponse,
  SessionResponseSchema,
  CastSpellResponse,
  CastSpellResponseSchema,
  CreateSessionRequest,
} from "../schemas/sessions";
import {
  AuthResponse,
  AuthResponseSchema,
} from "../schemas/auth";
import { validateResponse } from "../utils/apiHelper";

export async function getSession(code: string): Promise<SessionResponse> {
  const res = await client.get(`/sessions/${code}`);
  return validateResponse(SessionResponseSchema, res.data, "getSession");
}

export async function getSessions(): Promise<SessionResponse[]> {
  const res = await client.get("/sessions");
  const arraySchema = SessionResponseSchema.array();
  return validateResponse(arraySchema, res.data, "getSessions");
}

export async function createSession(data: CreateSessionRequest): Promise<SessionResponse> {
  const res = await client.post("/sessions", data);
  return validateResponse(SessionResponseSchema, res.data, "createSession");
}

export async function joinSession(code: string): Promise<SessionResponse> {
  const res = await client.post(`/sessions/${code}/join`);
  return validateResponse(SessionResponseSchema, res.data, "joinSession");
}

export async function startSession(code: string): Promise<SessionResponse> {
  const res = await client.patch(`/sessions/${code}/start`);
  return validateResponse(SessionResponseSchema, res.data, "startSession");
}

export async function castSpell(code: string, spellName: string): Promise<CastSpellResponse> {
  const res = await client.post(`/sessions/${code}/spells`, { spellName });
  return validateResponse(CastSpellResponseSchema, res.data, "castSpell");
}

export async function deleteSession(code: string): Promise<void> {
  await client.delete(`/sessions/${code}`);
}

export async function joinGuest(code: string, displayName: string): Promise<AuthResponse> {
  const res = await client.post(`/sessions/${code}/join-guest`, { displayName });
  return validateResponse(AuthResponseSchema, res.data, "joinGuest");
}
