import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSpells,
  createSpell,
  deleteSpell,
  createSpellsBatch,
} from "../api/spells";
import { CreateSpellRequest } from "../types";

// Fetch all spells in the grimoire (ADMIN and/or authorized views only)
export function useSpells(enabled = true) {
  return useQuery({
    queryKey: ["spells"],
    queryFn: () => getSpells(),
    enabled,
  });
}

// Create a new spell (ADMIN only)
export function useCreateSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSpellRequest) => createSpell(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spells"] });
    },
  });
}

// Create spells in batch (ADMIN only)
export function useCreateSpellsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSpellRequest[]) => createSpellsBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spells"] });
    },
  });
}

// Delete a spell (ADMIN only)
export function useDeleteSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSpell(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spells"] });
    },
  });
}
