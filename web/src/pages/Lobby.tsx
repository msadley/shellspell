import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/joy";
import { LogOut } from "lucide-react";
import { useSession } from "../hooks/useSession";
import { useAuthStore } from "../store/useAuthStore";
import HomeLayout from "../components/HomeLayout";
import GameErrorOverlay from "../components/battle/GameErrorOverlay";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  useDocumentMetadata(`Aguardando Partida - Sala ${code || ""}`, "Aguardando o anfitrião iniciar a partida de ShellSpell.");

  const navigate = useNavigate();

  const { alias, logout } = useAuthStore();

  const handleLeave = () => {
    logout(code);
    navigate("/");
  };

  const { data: sessionData, isLoading, error, isCancelled } = useSession(code);

  const userAlias = alias || "Jogador";
  const currentSession = sessionData;

  // Automatically redirect to battle screen when game session status is ACTIVE or FINISHED
  useEffect(() => {
    if (currentSession && (currentSession.status === "ACTIVE" || currentSession.status === "FINISHED")) {
      navigate(`/battle/${currentSession.sessionCode}`);
    }
  }, [currentSession, navigate]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "black",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !currentSession) {
    const axiosError = error as any;
    const isNetworkOrServerError = axiosError && (!axiosError.response || axiosError.response.status >= 500);

    return (
      <GameErrorOverlay
        type={isNetworkOrServerError ? "connection" : isCancelled ? "cancelled" : "invalid"}
        sessionCode={code}
        onExit={handleLeave}
        useHomeLayout={isNetworkOrServerError}
      />
    );
  }


  return (
    <HomeLayout>
      {/* Navigation / Leave action */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ width: "100%" }}
      >
        <Typography level="title-md" sx={{ fontWeight: 600 }}>
          🔮 Olá, {userAlias} (Jogador)
        </Typography>
        <Button
          size="sm"
          variant="plain"
          color="neutral"
          startDecorator={<LogOut size={16} />}
          onClick={handleLeave}
        >
          Sair
        </Button>
      </Stack>

      <Card
        variant="outlined"
        sx={{
          width: "100%",
          borderRadius: "lg",
          textAlign: "center",
        }}
      >
        <Stack spacing={4} alignItems="center">
          <Stack spacing={1}>
            <Typography
              level="body-xs"
              sx={{
                color: "neutral.400",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Código da Sala
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1}
            >
              <Typography
                level="h2"
                sx={{
                  color: "white",
                  letterSpacing: "0.15em",
                  fontWeight: 800,
                }}
              >
                {currentSession.sessionCode}
              </Typography>
            </Stack>
          </Stack>

          <CircularProgress
            variant="plain"
            sx={{
              "--CircularProgress-size": "80px",
              "--CircularProgress-trackThickness": "6px",
              "--CircularProgress-progressThickness": "6px",
            }}
          />

          <Stack spacing={1}>
            <Typography
              level="title-lg"
              sx={{ color: "white", fontWeight: 700 }}
            >
              Aguardando o Anfitrião
            </Typography>
            <Typography level="body-sm" sx={{ color: "neutral.400" }}>
              A partida iniciará assim que o anfitrião der o sinal verde
            </Typography>
          </Stack>

          <Box
            sx={{
              width: "100%",
              p: 1.5,
              background: "rgba(255,255,255,0.03)",
              borderRadius: "md",
              border: "1px dashed rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              level="body-xs"
              sx={{ color: "neutral.500", fontStyle: "italic" }}
            >
              Aguardando status da sessão mudar para ativo...
            </Typography>
          </Box>
        </Stack>
      </Card>
    </HomeLayout>
  );
}
