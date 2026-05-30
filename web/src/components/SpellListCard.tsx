import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
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
import { useSpells, useDeleteSpell } from "../hooks/useSpells";
import { useUIStore } from "../store/useUIStore";
import { SPELL_CATEGORIES } from "../constants/spells";

export default function SpellListCard() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [spellToDelete, setSpellToDelete] = useState<{ id: number; name: string } | null>(null);

  const { data: spells, isLoading: spellsLoading, error: spellsError } = useSpells();
  const deleteSpellMutation = useDeleteSpell();
  const setErrorMsg = useUIStore((state) => state.setErrorMsg);

  const openDeleteConfirm = (id: number, name: string) => {
    setSpellToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!spellToDelete) return;
    setErrorMsg(null);
    try {
      await deleteSpellMutation.mutateAsync(spellToDelete.id);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erro ao excluir feitiço.";
      setErrorMsg(msg);
    } finally {
      setIsDeleteModalOpen(false);
      setSpellToDelete(null);
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
        Grimório do Administrador
      </Typography>

      {spellsLoading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography level="body-md" sx={{ color: "neutral.400" }}>
            Carregando grimório...
          </Typography>
        </Stack>
      ) : spellsError ? (
        <Alert color="danger" variant="soft">
          Erro ao listar feitiços do grimório.
        </Alert>
      ) : !spells || spells.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <Typography
            level="body-sm"
            sx={{ color: "neutral.500", fontStyle: "italic" }}
          >
            Nenhum feitiço no grimório. Adicione feitiços no painel ao lado!
          </Typography>
        </Stack>
      ) : (
        <Stack
          spacing={3}
          sx={{ maxHeight: 600, overflowY: "auto", pr: 0.5 }}
        >
          {[...SPELL_CATEGORIES, "outros"].map((categoryName) => {
            const filteredSpells = spells.filter((s) => {
              const cat = (s.category || "").toLowerCase().trim();
              if (categoryName === "outros") {
                return !SPELL_CATEGORIES.includes(cat as any);
              }
              return cat === categoryName;
            });
            if (filteredSpells.length === 0) return null;
            return (
              <Box
                key={categoryName}
                sx={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  p: 2,
                  borderRadius: "md",
                }}
              >
                <Typography
                  level="title-sm"
                  sx={{
                    color: "primary.300",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 800,
                    mb: 1.5,
                  }}
                >
                  {categoryName}
                </Typography>

                <Grid container spacing={1.5}>
                  {filteredSpells.map((spell) => (
                    <Grid xs={12} sm={6} key={spell.id}>
                      <Sheet
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: "sm",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "rgba(255,255,255,0.01)",
                        }}
                      >
                        <Stack>
                          <Typography
                            level="title-sm"
                            sx={{ color: "white", fontWeight: 700 }}
                          >
                            {spell.name}
                          </Typography>
                          <Typography
                            level="body-xs"
                            sx={{ color: "neutral.400" }}
                          >
                            Dano: <b>{spell.damageAmount} HP</b>
                          </Typography>
                        </Stack>

                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="danger"
                          onClick={() =>
                            openDeleteConfirm(spell.id, spell.name)
                          }
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </Sheet>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalDialog variant="outlined" color="danger" sx={{ maxWidth: 400, width: "100%" }}>
          <DialogTitle>Excluir Feitiço</DialogTitle>
          <DialogContent>
            Tem certeza que deseja excluir o feitiço <b>{spellToDelete?.name}</b> do grimório?
          </DialogContent>
          <DialogActions>
            <Button variant="solid" color="danger" onClick={confirmDelete} loading={deleteSpellMutation.isPending}>
              Confirmar
            </Button>
            <Button variant="plain" color="neutral" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </Card>
  );
}
