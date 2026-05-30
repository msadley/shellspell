import { CreateSpellRequest } from "../types";
import { SPELL_CATEGORIES } from "../constants/spells";

export function parseSpellBatch(text: string): { 
  spells?: CreateSpellRequest[]; 
  error?: string; 
} {
  const lines = text.split("\n");
  const validSpells: CreateSpellRequest[] = [];
  const allowedCategories = SPELL_CATEGORIES as unknown as string[];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const colonIdx = line.indexOf(":");
    const commaIdx = line.lastIndexOf(",");

    if (colonIdx === -1 || commaIdx === -1 || commaIdx <= colonIdx) {
      return { error: `Linha ${i + 1} inválida: deve ter o formato "nome : dano, categoria".` };
    }

    const name = line.substring(0, colonIdx).trim();
    const damageStr = line.substring(colonIdx + 1, commaIdx).trim();
    let category = line.substring(commaIdx + 1).trim().toLowerCase();

    // Map accented variants to unaccented ones to ensure backend validation passes
    if (category === "rúnico") {
      category = "runico";
    } else if (category === "etéreo") {
      category = "etereo";
    }

    if (!name) {
      return { error: `Linha ${i + 1} inválida: o nome do feitiço está vazio.` };
    }

    const damage = parseInt(damageStr, 10);
    if (isNaN(damage) || damage <= 0) {
      return { error: `Linha ${i + 1} inválida: o dano deve ser um número inteiro maior que 0.` };
    }

    if (!allowedCategories.includes(category)) {
      return { error: `Linha ${i + 1} inválida: categoria "${category}" não permitida. Escolha entre: arcano, runico, etereo, primal, umbral.` };
    }

    validSpells.push({ name, damageAmount: damage, category });
  }

  if (validSpells.length === 0) {
    return { error: "Nenhum feitiço válido encontrado para salvar." };
  }

  return { spells: validSpells };
}
