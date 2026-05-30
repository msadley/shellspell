import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
  CircularProgress,
  Sheet,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/joy";
import { AlertCircle, Undo2 } from "lucide-react";
import { useStartSession, useDeleteSession } from "../hooks/useSession";
import CrystalDisplay from "../components/battle/CrystalDisplay";
import { useActiveBattle } from "../hooks/useActiveBattle";
import BattleGridContainer from "../components/battle/BattleGridContainer";
import SpellHistoryList from "../components/battle/SpellHistoryList";
import VictoryOverlay from "../components/battle/VictoryOverlay";

export default function AdminBattle() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const {
    session,
    isLoading,
    error,
    maxHealth,
    showVictory,
    recentCasts,
    isCrystalDefeated,
  } = useActiveBattle(code);

  // Count cast spells for each player
  const spellCounts = (session?.recentCasts || []).reduce((acc: Record<string, number>, cast) => {
    acc[cast.username] = (acc[cast.username] || 0) + 1;
    return acc;
  }, {});

  // Filter out host admin and any 'admin' user
  const filteredPlayers = (session?.players || []).filter(
    (player) => player.toLowerCase() !== "admin" && player !== session?.hostAdminUsername
  );

  // Sort players by most cast spells
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const countA = spellCounts[a] || 0;
    const countB = spellCounts[b] || 0;
    return countB - countA;
  });

  const startSessionMutation = useStartSession();
  const deleteSessionMutation = useDeleteSession();

  const handleBack = () => {
    navigate("/admin/home");
  };

  if (showCancelModal) {
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
        <Modal open={true} disableEscapeKeyDown>
          <ModalDialog
            variant="outlined"
            sx={{
              maxWidth: 400,
              width: "100%",
              borderRadius: "md",
              boxShadow: "lg",
            }}
          >
            <DialogTitle sx={{ color: "white" }}>Sessão Cancelada</DialogTitle>
            <DialogContent sx={{ color: "neutral.400" }}>
              A sessão foi cancelada com sucesso.
            </DialogContent>
            <DialogActions>
              <Button
                variant="solid"
                color="primary"
                onClick={() => {
                  setShowCancelModal(false);
                  navigate("/admin/home");
                }}
              >
                Sair
              </Button>
            </DialogActions>
          </ModalDialog>
        </Modal>
      </Box>
    );
  }

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

  if (error || !session) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "black",
          p: 3,
        }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 400,
            width: "100%",
            p: 3,
            borderRadius: "lg",
          }}
        >
          <Stack spacing={2} alignItems="center">
            <AlertCircle size={48} color="#f44336" />
            <Typography level="h4">
              Sessão Inválida
            </Typography>
            <Button
              color="neutral"
              variant="soft"
              onClick={() => navigate("/admin/home")}
            >
              Voltar ao Painel
            </Button>
          </Stack>
        </Sheet>
      </Box>
    );
  }

  return (
    <BattleGridContainer
      sx={{
        gridTemplateColumns: "minmax(auto, 250px) 1fr minmax(auto, 250px)",
        gridTemplateRows: "1fr",
        gridTemplateAreas: `
          "players crystal log"
        `,
        gap: 2,
      }}
    >
      {/* GLOBAL HEADER REMOVED FROM TOP GRID - KEPT FOR GRID STRUCTURE */}

      {/* PLAYERS COLUMN */}
      <Card
        variant="outlined"
        sx={{
          gridArea: "players",
          borderRadius: "lg",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxWidth: 250,
          width: "100%",
          justifySelf: "start",
        }}
      >
        <Typography
          level="title-md"
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            pb: 1,
            fontWeight: 700,
            mb: 2,
          }}
        >
          Jogadores ({sortedPlayers.length})
        </Typography>

        <Stack
          spacing={1}
          sx={{
            flex: 1,
            overflowY: "auto",
            pb: 2,
          }}
        >
          {sortedPlayers.map((player) => {
            const castCount = spellCounts[player] || 0;
            return (
              <Sheet
                key={player}
                variant="soft"
                sx={{
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  borderRadius: "sm",
                  "&:hover": {
                    bgcolor: "background.level2",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ fontSize: "20px" }}>🧙‍♂️</Box>
                  <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                    {player}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: "50%",
                    minWidth: 26,
                    height: 26,
                    px: 0.5,
                  }}
                >
                  <Typography
                    level="body-xs"
                    sx={{
                      color: "rgb(192, 132, 252)",
                      fontWeight: 800,
                      fontSize: "12px",
                    }}
                  >
                    {castCount}
                  </Typography>
                </Box>
              </Sheet>
            );
          })}
        </Stack>
      </Card>

      {/* CRYSTAL COLUMN - Center */}
      <Stack
        spacing={3}
        alignItems="center"
        direction="column"
        justifyContent="center"
        sx={{
          gridArea: "crystal",
          p: 2,
          position: "relative",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{ width: "100%", position: "relative" }}
        >
          {session.status === "WAITING" ? (
            <Button
              size="sm"
              variant="solid"
              sx={{
                bgcolor: "#007bff",
                "&:hover": { bgcolor: "#0056b3" },
              }}
              onClick={async () => {
                try {
                  await startSessionMutation.mutateAsync(session.sessionCode);
                } catch (err) {
                  console.error("Failed to start session:", err);
                }
              }}
              loading={startSessionMutation.isPending}
            >
              Iniciar Partida
            </Button>
          ) : session.status === "ACTIVE" ? (
            <Button
              size="sm"
              variant="solid"
              color="danger"
              onClick={async () => {
                try {
                  setShowCancelModal(true);
                  await deleteSessionMutation.mutateAsync(session.sessionCode);
                } catch (err) {
                  setShowCancelModal(false);
                  console.error("Failed to cancel session:", err);
                }
              }}
              loading={deleteSessionMutation.isPending}
            >
              Cancelar Partida
            </Button>
          ) : null}
          <Typography
            level="title-md"
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              color: "neutral.300",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            {session.sessionCode}
          </Typography>
          <Button
            size="sm"
            variant="solid"
            onClick={handleBack}
            startDecorator={<Undo2 size={14} />}
            sx={{
              ml: "auto",
              bgcolor: "black",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              "&:hover": {
                bgcolor: "#222",
              },
            }}
          >
            Sair
          </Button>
        </Stack>
        <CrystalDisplay
          crystalHealth={session.crystalHealth}
          maxHealth={maxHealth || session.crystalHealth}
          isCrystalDefeated={isCrystalDefeated}
          layout="title-bottom"
          titleAlign="center"
          maxCrystalHeight={{ xs: "25vh", md: "40vh" }}
        />
      </Stack>

      {/* SPELL LOG COLUMN - Right side */}
      <SpellHistoryList recentCasts={recentCasts} />

      {/* VICTORY MODAL OVERLAY */}
      <VictoryOverlay
        showVictory={showVictory}
        crystalSummary="O Cristal foi completamente destruído pelos conjuradores!"
        summaryLabel="RESUMO DA PARTIDA"
        confirmText="Voltar ao Painel"
        onConfirm={handleBack}
      />
    </BattleGridContainer>
  );
}
