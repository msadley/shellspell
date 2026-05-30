import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Chip,
  IconButton,
  Sheet,
  Stack,
  Typography,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/joy";
import { Trash2 } from "lucide-react";
import {
  useSessions,
  useDeleteSession,
} from "../hooks/useSession";
import { useUIStore } from "../store/useUIStore";

export default function SessionListCard() {
  const navigate = useNavigate();
  const selectedCode = useUIStore((state) => state.selectedCode);
  const setSelectedCode = useUIStore((state) => state.setSelectedCode);
  const setErrorMsg = useUIStore((state) => state.setErrorMsg);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showAdminCancelModal, setShowAdminCancelModal] = useState(false);

  const { data: sessions, isLoading: listLoading, error: listError } =
    useSessions();
  const deleteSessionMutation = useDeleteSession();

  const openDeleteConfirm = (code: string) => {
    setSessionToDelete(code);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    setErrorMsg(null);
    try {
      await deleteSessionMutation.mutateAsync(sessionToDelete);
      if (selectedCode === sessionToDelete) {
        setSelectedCode(null);
      }
      setShowAdminCancelModal(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erro ao excluir sessão.";
      setErrorMsg(msg);
    } finally {
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: "lg", minHeight: 350 }}>
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
        Lista de Sessões
      </Typography>

      {listLoading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography level="body-md" sx={{ color: "neutral.400" }}>
            Carregando sessões...
          </Typography>
        </Stack>
      ) : listError ? (
        <Alert color="danger" variant="soft">
          Erro ao listar sessões. Verifique a conexão com o servidor.
        </Alert>
      ) : !sessions || sessions.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <Typography
            level="body-sm"
            sx={{ color: "neutral.500", fontStyle: "italic" }}
          >
            Nenhuma sessão criada no momento.
          </Typography>
        </Stack>
      ) : (
        <Stack
          spacing={1.5}
          sx={{ maxHeight: 550, overflowY: "auto", pr: 0.5 }}
        >
          {sessions.map((session) => {
            const isSelected = selectedCode === session.sessionCode;
            return (
              <Sheet
                key={session.sessionCode}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: "md",
                  background: isSelected
                    ? "rgba(255, 255, 255, 0.05)"
                    : "transparent",
                  borderColor: isSelected
                    ? "primary.solidBg"
                    : "neutral.outlinedBorder",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                {/* Session Info */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  <Typography
                    level="title-sm"
                    onClick={() => setSelectedCode(session.sessionCode)}
                    sx={{
                      color: "white",
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      "&:hover": { color: "primary.300" },
                    }}
                  >
                    SALA: {session.sessionCode}
                  </Typography>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={
                      session.status === "ACTIVE"
                        ? "success"
                        : session.status === "WAITING"
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {session.status}
                  </Chip>
                  <Typography level="body-xs" sx={{ color: "neutral.400" }}>
                    HP: <b>{session.crystalHealth}</b>
                  </Typography>
                </Stack>

                {/* Session Actions */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: "flex-end",
                  }}
                >


                   <Button
                      size="sm"
                      variant="soft"
                      color="primary"
                      onClick={() =>
                        navigate(`/admin/battle/${session.sessionCode}`)
                      }
                    >
                      Monitorar
                    </Button>

                  <IconButton
                    size="sm"
                    variant="outlined"
                    color="danger"
                    onClick={() => openDeleteConfirm(session.sessionCode)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Stack>
              </Sheet>
            );
          })}
        </Stack>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalDialog variant="outlined" color="danger" sx={{ maxWidth: 400, width: "100%" }}>
          <DialogTitle>Excluir Sessão</DialogTitle>
          <DialogContent>
            Tem certeza que deseja excluir a sessão <b>{sessionToDelete}</b>? Isso irá desconectar todos os jogadores.
          </DialogContent>
          <DialogActions>
            <Button variant="solid" color="danger" onClick={confirmDelete} loading={deleteSessionMutation.isPending}>
              Confirmar
            </Button>
            <Button variant="plain" color="neutral" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Admin Cancel Confirmation Modal */}
      <Modal open={showAdminCancelModal} disableEscapeKeyDown>
        <ModalDialog variant="outlined" sx={{ maxWidth: 400, width: "100%" }}>
          <DialogTitle sx={{ color: "white" }}>Sessão Cancelada</DialogTitle>
          <DialogContent sx={{ color: "neutral.400" }}>
            A sessão foi cancelada com sucesso.
          </DialogContent>
          <DialogActions>
            <Button variant="solid" color="primary" onClick={() => setShowAdminCancelModal(false)}>
              Sair
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </Card>
  );
}
