import { useState } from "react";
import {
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Option,
  Select,
  Stack,
  Textarea,
  Typography,
} from "@mui/joy";
import { useCreateSpell, useCreateSpellsBatch } from "../hooks/useSpells";
import { useUIStore } from "../store/useUIStore";
import { parseSpellBatch } from "../utils/spellParser";


export default function CreateSpellCard() {
  const [addMode, setAddMode] = useState<"single" | "batch">("single");
  const [spellName, setSpellName] = useState("");
  const [spellDamage, setSpellDamage] = useState(20);
  const [spellCategory, setSpellCategory] = useState("primal");
  const [batchText, setBatchText] = useState("");

  const setErrorMsg = useUIStore((state) => state.setErrorMsg);
  const createSpellMutation = useCreateSpell();
  const createSpellsBatchMutation = useCreateSpellsBatch();
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const handleCreateSpell = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!spellName.trim()) {
      setErrorMsg("O nome do feitiço é obrigatório.");
      return;
    }

    if (spellDamage <= 0) {
      setErrorMsg("O dano do feitiço deve ser pelo menos 1.");
      return;
    }

    try {
      await createSpellMutation.mutateAsync({
        name: spellName.trim(),
        damageAmount: spellDamage,
        category: spellCategory,
      });
      setSpellName("");
      setSpellDamage(20);
      setSpellCategory("primal");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erro ao criar feitiço.";
      setErrorMsg(msg);
    }
  };

  const handleCreateSpellBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsBatchSubmitting(true);

    const { spells, error } = parseSpellBatch(batchText);

    if (error) {
      setErrorMsg(error);
      setIsBatchSubmitting(false);
      return;
    }

    try {
      await createSpellsBatchMutation.mutateAsync(spells || []);
      setBatchText("");
    } catch (err: any) {
      const msg =
        err.response?.data?.error || "Erro ao salvar feitiços em lote.";
      setErrorMsg(msg);
    } finally {
      setIsBatchSubmitting(false);
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
        }}
      >
        Criar Novo Feitiço
      </Typography>

      {/* Switch between Single and Batch mode */}
      <Stack direction="row" spacing={1}>
        <Button
          size="sm"
          variant={addMode === "single" ? "solid" : "soft"}
          color="neutral"
          onClick={() => {
            setErrorMsg(null);
            setAddMode("single");
          }}
          sx={{ flexGrow: 1 }}
        >
          Individual
        </Button>
        <Button
          size="sm"
          variant={addMode === "batch" ? "solid" : "soft"}
          color="neutral"
          onClick={() => {
            setErrorMsg(null);
            setAddMode("batch");
          }}
          sx={{ flexGrow: 1 }}
        >
          Em Lote
        </Button>
      </Stack>

      {addMode === "single" ? (
        <form onSubmit={handleCreateSpell}>
          <Stack spacing={2.5}>
            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
                Nome da Magia
              </FormLabel>
              <Input
                placeholder="Ex: Fireball"
                value={spellName}
                onChange={(e) => setSpellName(e.target.value)}
                variant="outlined"
              />
            </FormControl>

            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
                Dano
              </FormLabel>
              <Input
                type="number"
                placeholder="Ex: 25"
                value={spellDamage}
                onChange={(e) => setSpellDamage(Number(e.target.value))}
                variant="outlined"
                slotProps={{
                  input: {
                    min: 1,
                  },
                }}
              />
            </FormControl>

            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
                Categoria
              </FormLabel>
              <Select
                value={spellCategory}
                onChange={(_, val) => setSpellCategory(val || "primal")}
                variant="outlined"
                sx={{ color: "white" }}
              >
                <Option value="arcano">Arcano</Option>
                <Option value="runico">Rúnico</Option>
                <Option value="etereo">Etéreo</Option>
                <Option value="primal">Primal</Option>
                <Option value="umbral">Umbral</Option>
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="solid"
              color="primary"
              loading={createSpellMutation.isPending}
            >
              Salvar no Grimório
            </Button>
          </Stack>
        </form>
      ) : (
        <form onSubmit={handleCreateSpellBatch}>
          <Stack spacing={2.5}>
            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
                Lote de Magias
              </FormLabel>
              <Textarea
                minRows={6}
                placeholder="Formato por linha:&#10;nome : dano, categoria&#10;&#10;Ex:&#10;Fireball : 25, primal&#10;Frostbolt : 15, etereo"
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                variant="outlined"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.02)",
                }}
              />
            </FormControl>

            <Button
              type="submit"
              variant="solid"
              color="primary"
              loading={isBatchSubmitting}
            >
              Salvar Lote no Grimório
            </Button>
          </Stack>
        </form>
      )}
    </Card>
  );
}
