import { type } from "arktype";

export const CreateSpellRequestSchema = type({
  name: "string",
  damageAmount: "number",
  category: "string",
});
export type CreateSpellRequest = typeof CreateSpellRequestSchema.infer;

export const SpellResponseSchema = type({
  id: "number",
  name: "string",
  damageAmount: "number",
  category: "string | null",
});
export type SpellResponse = typeof SpellResponseSchema.infer;
