import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { sseManager } from "../utils/sseManager";
import {
  getSession,
  getSessions,
  createSession,
  joinSession,
  startSession,
  castSpell,
  deleteSession,
  joinGuest,
} from "../api/sessions";
import { CreateSessionRequest } from "../types";

// Fetch session state by code (SSE version)
export function useSession(code: string | undefined) {
  const queryClient = useQueryClient();
  const username = useAuthStore((state) => state.username);

  const query = useQuery({
    queryKey: ["session", code],
    queryFn: async () => {
      if (!code) throw new Error("No session code provided");
      return getSession(code);
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (!code || !username) return;

    const onUpdate = (updatedSession: any) => {
      queryClient.setQueryData(["session", code], updatedSession);
    };

    const onDeleted = () => {
      queryClient.setQueryData(["session", code], null);
    };

    const unsubscribe = sseManager.subscribe(code, onUpdate, onDeleted);
    return () => {
      unsubscribe();
    };
  }, [code, username, queryClient]);

  return query;
}

// Single-purpose mutation: Join Session
export function useJoinSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinSession(code),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["session", data.sessionCode],
      });
    },
  });
}

// Unified Guest Session Join
export function useJoinGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, displayName }: { code: string; displayName: string }) => joinGuest(code, displayName),
    onSuccess: (data, variables) => {
      useAuthStore.getState().setAuth(data.token, data.username, data.role, variables.displayName, variables.code);
      queryClient.invalidateQueries({
        queryKey: ["session", variables.code],
      });
    },
  });
}

// Single-purpose mutation: Create Session
export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSessionRequest) => createSession(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["session", data.sessionCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["sessions"],
      });
    },
  });
}

// Start Session (Change status from WAITING to ACTIVE)
export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => startSession(code),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["session", data.sessionCode],
      });
    },
  });
}

// Cast Spell mutation
export function useCastSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      spellName,
    }: {
      code: string;
      spellName: string;
    }) => castSpell(code, spellName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["session", variables.code] });
    },
  });
}

// Fetch all game sessions (ADMIN only, SSE-driven updates)
export function useSessions() {
  const queryClient = useQueryClient();
  const username = useAuthStore((state) => state.username);

  const query = useQuery({
    queryKey: ["sessions"],
    queryFn: () => getSessions(),
    enabled: !!username,
  });

  useEffect(() => {
    if (!username) return;

    const onUpdate = (updatedSessions: any) => {
      queryClient.setQueryData(["sessions"], updatedSessions);
    };

    const onDeleted = () => {
      // Deleted logic handled via list broadcasts
    };

    const unsubscribe = sseManager.subscribe("all_sessions", onUpdate, onDeleted);
    return () => {
      unsubscribe();
    };
  }, [username, queryClient]);

  return query;
}

// Delete a game session (ADMIN only)
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => deleteSession(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
