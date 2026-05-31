import { useEffect, useState, useRef } from "react";
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
  revealResults,
} from "../api/sessions";
import { CreateSessionRequest } from "../types";

// Fetch session state by code (SSE version)
export function useSession(code: string | undefined) {
  const queryClient = useQueryClient();
  const username = useAuthStore((state) => state.username);
  const [isCancelled, setIsCancelled] = useState(false);
  const hasLoadedRef = useRef(false);

  const query = useQuery({
    queryKey: ["session", code],
    queryFn: async () => {
      if (!code) throw new Error("No session code provided");
      return getSession(code);
    },
    enabled: !!code,
  });

  // Track if we ever successfully retrieved data
  if (query.data && !hasLoadedRef.current) {
    hasLoadedRef.current = true;
  }

  // Reset cancellation state when code changes
  useEffect(() => {
    setIsCancelled(false);
    hasLoadedRef.current = false;
  }, [code]);

  // Handle SSE updates and deletions
  useEffect(() => {
    if (!code || !username) return;

    const onUpdate = (updatedSession: any) => {
      queryClient.setQueryData(["session", code], updatedSession);
    };

    const onDeleted = () => {
      queryClient.setQueryData(["session", code], null);
      setIsCancelled(true);
    };

    const unsubscribe = sseManager.subscribe(code, onUpdate, onDeleted);
    return () => {
      unsubscribe();
    };
  }, [code, username, queryClient]);

  // Handle fallback HTTP query failure (404 status indicates deletion/cancellation if it loaded successfully before)
  const error = query.error as any;
  const is404 = error && error.response && error.response.status === 404;
  useEffect(() => {
    if (is404 && hasLoadedRef.current) {
      setIsCancelled(true);
    }
  }, [is404]);

  return { ...query, isCancelled };
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
    mutationFn: ({ code, displayName, matricula }: { code: string; displayName: string; matricula: string }) => joinGuest(code, displayName, matricula),
    onSuccess: (data, variables) => {
      useAuthStore.getState().setAuth(data.token, data.username, data.role, variables.displayName, variables.code);
      localStorage.setItem("player_matricula", variables.matricula);
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

// Reveal session results (ADMIN only)
export function useRevealResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => revealResults(code),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["session", data.sessionCode],
      });
    },
  });
}
