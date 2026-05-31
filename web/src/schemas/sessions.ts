import { type } from "arktype";

export const SessionStatusSchema = type("'WAITING' | 'ACTIVE' | 'FINISHED'");
export type SessionStatus = typeof SessionStatusSchema.infer;

export const CreateSessionRequestSchema = type({
  crystalHealth: "number",
});
export type CreateSessionRequest = typeof CreateSessionRequestSchema.infer;

export const CastSpellDtoSchema = type({
  username: "string",
  spellName: "string",
  spellCategory: "string",
  damage: "number",
  castAtTime: "string",
});

export type CastSpellDto = typeof CastSpellDtoSchema.infer;

export const WizardScoreSchema = type({
  username: "string",
  spellsCast: "number",
  totalDamage: "number",
});

export type WizardScore = typeof WizardScoreSchema.infer;

export const SessionResponseSchema = type({
  sessionCode: "string",
  status: SessionStatusSchema,
  crystalHealth: "number",
  maxCrystalHealth: "number",
  hostAdminUsername: "string",
  players: "string[]",
  recentCasts: CastSpellDtoSchema.array(),
  resultsRevealed: "boolean",
  ranking: WizardScoreSchema.array(),
});
export type SessionResponse = typeof SessionResponseSchema.infer;

export const CastSpellRequestSchema = type({
  spellName: "string",
});
export type CastSpellRequest = typeof CastSpellRequestSchema.infer;

export const CastSpellResponseSchema = type({
  spellName: "string",
  damageDealt: "number",
  remainingCrystalHealth: "number",
  gameStatus: SessionStatusSchema,
});
export type CastSpellResponse = typeof CastSpellResponseSchema.infer;

export const JoinGuestRequestSchema = type({
  displayName: "string",
  matricula: "string",
});
export type JoinGuestRequest = typeof JoinGuestRequestSchema.infer;
