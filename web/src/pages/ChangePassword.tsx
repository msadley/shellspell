import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Typography,
} from "@mui/joy";
import { useChangePassword } from "../hooks/useAuth";
import HomeLayout from "../components/HomeLayout";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

export default function ChangePassword() {
  useDocumentMetadata("Alterar Senha do Administrador", "Altere as credenciais de acesso do administrador do ShellSpell.");
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const changePasswordMutation = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setSuccessMsg("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        navigate("/admin/home");
      }, 2000);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "Erro ao alterar a senha. Verifique a senha atual.";
      setErrorMsg(msg);
    }
  };

  const handleCancel = () => {
    navigate("/admin/home");
  };

  return (
    <HomeLayout>
      <Card variant="outlined" sx={{ width: "100%", borderRadius: "lg" }}>
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
          Alterar Senha do Administrador
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {successMsg && (
              <Alert color="success" variant="soft" size="sm">
                {successMsg}
              </Alert>
            )}
            {errorMsg && (
              <Alert color="danger" variant="soft" size="sm">
                {errorMsg}
              </Alert>
            )}

            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontSize: "13px" }}>
                Senha Atual
              </FormLabel>
              <Input
                type="password"
                placeholder="Senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                variant="outlined"
                size="sm"
              />
            </FormControl>

            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontSize: "13px" }}>
                Nova Senha
              </FormLabel>
              <Input
                type="password"
                placeholder="Nova senha (min. 6 caract.)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="outlined"
                size="sm"
              />
            </FormControl>

            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontSize: "13px" }}>
                Confirmar Nova Senha
              </FormLabel>
              <Input
                type="password"
                placeholder="Confirme a nova senha"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                variant="outlined"
                size="sm"
              />
            </FormControl>

            <Stack direction="row" spacing={1.5} sx={{ mt: 1, width: "100%" }}>
              <Button
                type="submit"
                size="sm"
                variant="solid"
                color="success"
                loading={changePasswordMutation.isPending}
                sx={{ flex: 1 }}
              >
                Confirmar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="soft"
                color="neutral"
                onClick={handleCancel}
                sx={{ flex: 1 }}
              >
                Cancelar
              </Button>
            </Stack>
          </Stack>
        </form>
      </Card>
    </HomeLayout>
  );
}
