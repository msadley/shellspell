import { useState } from "react";
import {
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Typography,
} from "@mui/joy";
import { useCreateSession, useJoinSession } from "../hooks/useSession";
import { useUIStore } from "../store/useUIStore";

export default function CreateSessionCard() {
  const [crystalHealthInput, setCrystalHealthInput] = useState(100);
  const setSelectedCode = useUIStore((state) => state.setSelectedCode);
  const setErrorMsg = useUIStore((state) => state.setErrorMsg);
  const createSessionMutation = useCreateSession();
  const joinSessionMutation = useJoinSession();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (crystalHealthInput <= 0) {
      setErrorMsg("A vida do cristal deve ser pelo menos 1.");
      return;
    }

    try {
      const session = await createSessionMutation.mutateAsync({
        crystalHealth: crystalHealthInput,
      });
      await joinSessionMutation.mutateAsync(session.sessionCode);
      setSelectedCode(session.sessionCode);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erro ao criar sessão.";
      setErrorMsg(msg);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: "lg" }}>
      <Typography
        level="title-md"
        sx={{
          color: "white",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          pb: 1,
          fontWeight: 700,
          mb: 1,
        }}
      >
        Criar Nova Sessão
      </Typography>
      <form onSubmit={handleCreate}>
        <Stack spacing={2}>
          <FormControl required>
            <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
              Vida Inicial do Cristal
            </FormLabel>
            <Input
              type="number"
              placeholder="Ex: 100"
              value={crystalHealthInput}
              onChange={(e) => setCrystalHealthInput(Number(e.target.value))}
              variant="outlined"
              slotProps={{
                input: {
                  min: 1,
                },
              }}
            />
          </FormControl>

          <Button
            type="submit"
            variant="solid"
            color="primary"
            loading={createSessionMutation.isPending || joinSessionMutation.isPending}
          >
            Criar Sessão
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
