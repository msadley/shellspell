import { useNavigate } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/joy";
import { Key, LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import titleBg from "../assets/title_bg.jpg";

export default function AdminHeader() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2, mb: 4 }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          component="img"
          src={titleBg}
          alt="ShellSpell Logo"
          sx={{
            height: 48,
            width: "auto",
            objectFit: "contain",
            display: { xs: "none", sm: "block" },
          }}
        />
        <Stack>
          <Typography
            level="title-lg"
            sx={{ color: "white", fontWeight: 800 }}
          >
            SHELLSPELL
          </Typography>
          <Typography
            level="body-xs"
            sx={{ color: "neutral.400", letterSpacing: "0.1em" }}
          >
            PAINEL DE CONTROLE
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          size="sm"
          variant="outlined"
          color="neutral"
          startDecorator={<Key size={14} />}
          onClick={() => navigate("/admin/change-password")}
        >
          Alterar Senha
        </Button>
        <Button
          size="sm"
          variant="solid"
          color="danger"
          startDecorator={<LogOut size={14} />}
          onClick={handleLogout}
        >
          Sair
        </Button>
      </Stack>
    </Stack>
  );
}
