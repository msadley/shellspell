import client from "./client";
import {
  SpellResponse,
  SpellResponseSchema,
  CreateSpellRequest,
} from "../schemas/spells";
import { validateResponse } from "../utils/apiHelper";

export async function getSpells(): Promise<SpellResponse[]> {
  const res = await client.get("/spells");
  const arraySchema = SpellResponseSchema.array();
  return validateResponse(arraySchema, res.data, "getSpells");
}

export async function createSpell(data: CreateSpellRequest): Promise<SpellResponse> {
  const res = await client.post("/spells", data);
  return validateResponse(SpellResponseSchema, res.data, "createSpell");
}

export async function deleteSpell(id: number): Promise<void> {
  await client.delete(`/spells/${id}`);
}

export async function createSpellsBatch(data: CreateSpellRequest[]): Promise<SpellResponse[]> {
  const res = await client.post("/spells/batch", data);
  const arraySchema = SpellResponseSchema.array();
  return validateResponse(arraySchema, res.data, "createSpellsBatch");
}
