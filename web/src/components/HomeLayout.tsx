import { Box, Stack, Alert } from "@mui/joy";
import { AlertCircle } from "lucide-react";
import titleBg from "../assets/title_bg.jpg";
import { useUIStore } from "../store/useUIStore";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  const { errorMsg } = useUIStore();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "black",
        p: 2,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Stack
        spacing={4}
        sx={{ width: "100%", maxWidth: 440, zIndex: 1, alignItems: "center" }}
      >
        <Box
          component="img"
          src={titleBg}
          alt="ShellSpell Logo"
          sx={{
            width: "100%",
            maxWidth: 420,
            height: "auto",
            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
            mb: -1,
          }}
        />
        {errorMsg && (
          <Alert
            color="danger"
            variant="soft"
            startDecorator={<AlertCircle />}
            sx={{ width: "100%", borderRadius: "md" }}
          >
            {errorMsg}
          </Alert>
        )}

        {children}
      </Stack>
    </Box>
  );
}
