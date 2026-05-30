import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Stack,
  CircularProgress,
  Box,
} from "@mui/joy";
import { useJoinGuest } from "../hooks/useSession";
import { getSession } from "../api/sessions";
import { useUIStore } from "../store/useUIStore";
import { useAuthStore } from "../store/useAuthStore";
import HomeLayout from "../components/HomeLayout";

export default function Home() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { setErrorMsg } = useUIStore();
  const { username, role, sessionCode: activeSessionCode } = useAuthStore();

  // Redirect guest player to their active session lobby/battle screen
  useEffect(() => {
    if (username && role === "PLAYER" && activeSessionCode) {
      setIsRedirecting(true);
      getSession(activeSessionCode)
        .then((session) => {
          if (session.status === "ACTIVE") {
            navigate(`/battle/${activeSessionCode}`, { replace: true });
          } else {
            navigate(`/lobby/${activeSessionCode}`, { replace: true });
          }
        })
        .catch((err) => {
          const status = err.response?.status;
          if (status === 404 || status === 401 || status === 403) {
            useAuthStore.getState().clearAuth();
          }
          setIsRedirecting(false);
        });
    }
  }, [username, role, activeSessionCode, navigate]);

  // Atomic Guest Mutation
  const joinGuestMutation = useJoinGuest();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!playerName.trim()) {
      setErrorMsg("Por favor, insira o seu nome.");
      return;
    }
    if (!sessionCode.trim()) {
      setErrorMsg("Por favor, insira o código da sessão.");
      return;
    }

    try {
      const sessionCodeClean = sessionCode.toUpperCase().trim();
      const trimmedPlayerName = playerName.trim();

      // Check if we already have a saved guest session for this code and name
      const savedCode = localStorage.getItem("player_sessionCode");
      const savedAlias = localStorage.getItem("player_alias");
      if (savedCode && savedCode.toUpperCase() === sessionCodeClean && savedAlias === trimmedPlayerName) {
        // Restore session state and navigate directly
        const savedToken = localStorage.getItem("player_token");
        const savedUsername = localStorage.getItem("player_username");
        const savedRole = localStorage.getItem("player_role");
        useAuthStore.getState().setAuth(
          savedToken!,
          savedUsername!,
          savedRole!,
          savedAlias!,
          sessionCodeClean
        );
        navigate(`/lobby/${sessionCodeClean}`);
        return;
      }

      await joinGuestMutation.mutateAsync({
        code: sessionCodeClean,
        displayName: trimmedPlayerName,
      });

      // Navigate to Lobby using the returned session code
      navigate(`/lobby/${sessionCodeClean}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "Erro ao entrar na sessão. Verifique o código e tente novamente.";
      setErrorMsg(msg);
    }
  };

  return (
    <HomeLayout>
      {isRedirecting ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Card
          variant="outlined"
          sx={{
            width: "100%",
            borderRadius: "lg",
          }}
        >
          <form onSubmit={handleJoin}>
            <Stack spacing={2.5}>
              <FormControl required>
                <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
                  Nome
                </FormLabel>
                <Input
                  placeholder="Digite seu nome"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  variant="outlined"
                />
              </FormControl>

              <FormControl required>
                <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
                  Código da Sessão
                </FormLabel>
                <Input
                  placeholder="Digite o código de sessão"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  variant="outlined"
                />
              </FormControl>

              <Button
                type="submit"
                variant="solid"
                color="primary"
                loading={joinGuestMutation.isPending}
              >
                Entrar na sessão
              </Button>
            </Stack>
          </form>
        </Card>
      )}
    </HomeLayout>
  );
}
