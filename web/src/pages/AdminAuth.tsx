import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Stack,
} from "@mui/joy";
import { useAdminLogin } from "../hooks/useAuth";
import { useAuthStore } from "../store/useAuthStore";
import { useUIStore } from "../store/useUIStore";
import HomeLayout from "../components/HomeLayout";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

export default function AdminAuth() {
  useDocumentMetadata("Painel do Administrador - Autenticação", "Acesse a área administrativa do ShellSpell.");
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const { role } = useAuthStore();
  const { setErrorMsg } = useUIStore();
  const loginMutation = useAdminLogin();

  // If already authenticated as ADMIN, redirect to admin home
  useEffect(() => {
    if (role === "ADMIN") {
      navigate("/admin/home");
    }
  }, [role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!usernameInput.trim()) {
      setErrorMsg("Por favor, insira o nome de usuário.");
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg("Por favor, insira a senha.");
      return;
    }

    try {
      await loginMutation.mutateAsync({
        username: usernameInput.trim(),
        password: passwordInput,
      });
      navigate("/admin/home");
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "Falha na autenticação do administrador. Verifique as credenciais.";
      setErrorMsg(msg);
    }
  };

  return (
    <HomeLayout>
      <Card
        variant="outlined"
        sx={{
          width: "100%",
          borderRadius: "lg",
        }}
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
                Usuário
              </FormLabel>
              <Input
                placeholder="Nome do usuário"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                variant="outlined"
                autoFocus
              />
            </FormControl>

            <FormControl required>
              <FormLabel sx={{ color: "neutral.300", fontWeight: 600 }}>
                Senha
              </FormLabel>
              <Input
                type="password"
                placeholder="Senha"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                variant="outlined"
              />
            </FormControl>

            <Button
              type="submit"
              variant="solid"
              color="primary"
              loading={loginMutation.isPending}
            >
              Entrar como admin
            </Button>
          </Stack>
        </form>
      </Card>
    </HomeLayout>
  );
}
