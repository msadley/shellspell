export const SPELL_CATEGORIES = [
  "arcano",
  "runico",
  "etereo",
  "primal",
  "umbral",
] as const;

export type SpellCategory = (typeof SPELL_CATEGORIES)[number];

export const SPELL_CATEGORY_COLORS: Record<SpellCategory, string> = {
  arcano: "#B57EDC",
  runico: "#00F5D4",
  primal: "#FF6B35",
  etereo: "#70D6FF",
  umbral: "#3A3A40",
};
