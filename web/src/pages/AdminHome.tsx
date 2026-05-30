import { useEffect, useState } from "react";
import { Alert, Box, Button, Grid, Stack } from "@mui/joy";
import { ShieldAlert } from "lucide-react";

import { useSessions } from "../hooks/useSession";
import { useUIStore } from "../store/useUIStore";

import AdminHeader from "../components/AdminHeader";
import CreateSessionCard from "../components/CreateSessionCard";
import SessionListCard from "../components/SessionListCard";
import CreateSpellCard from "../components/CreateSpellCard";
import SpellListCard from "../components/SpellListCard";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

export default function AdminHome() {
  useDocumentMetadata("Painel do Administrador", "Gerencie sessões de jogo e edite o grimório de feitiços de ShellSpell.");
  const [activeTab, setActiveTab] = useState(0);
  const errorMsg = useUIStore((state) => state.errorMsg);
  const setErrorMsg = useUIStore((state) => state.setErrorMsg);
  const selectedCode = useUIStore((state) => state.selectedCode);
  const setSelectedCode = useUIStore((state) => state.setSelectedCode);

  const { data: sessions } = useSessions();

  // Clean error msg on unmount
  useEffect(() => {
    return () => setErrorMsg(null);
  }, [setErrorMsg]);

  // Automatically select the first active/waiting session if none is selected
  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedCode) {
      const activeOrWaiting = sessions.find(
        (s) => s.status === "ACTIVE" || s.status === "WAITING"
      );
      if (activeOrWaiting) {
        setSelectedCode(activeOrWaiting.sessionCode);
      } else {
        setSelectedCode(sessions[0].sessionCode);
      }
    }
  }, [sessions, selectedCode, setSelectedCode]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "black",
        p: { xs: 2, md: 4 },
        color: "white",
      }}
    >
      {/* HEADER SECTION */}
      <AdminHeader />

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <Alert
          color="danger"
          variant="soft"
          startDecorator={<ShieldAlert />}
          sx={{ mb: 3, borderRadius: "md" }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* TABS WRAPPER USING BUTTONS */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 4 }}>
        <Button
          variant={activeTab === 0 ? "solid" : "soft"}
          color={activeTab === 0 ? "primary" : "neutral"}
          onClick={() => setActiveTab(0)}
        >
          Partidas &amp; Sessões
        </Button>
        <Button
          variant={activeTab === 1 ? "solid" : "soft"}
          color={activeTab === 1 ? "primary" : "neutral"}
          onClick={() => setActiveTab(1)}
        >
          Gerenciar Grimório
        </Button>
      </Stack>

      {/* TAB 1: SESSIONS & LIVE MONITOR */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Left Side: Create Form, Change Password, & Live Monitor */}
          <Grid xs={12} md={4}>
              <Stack spacing={3}>
                <CreateSessionCard />
              </Stack>
          </Grid>

          {/* Right Side: Sessions List */}
          <Grid xs={12} md={8}>
            <SessionListCard />
          </Grid>
        </Grid>
      )}

      {/* TAB 2: SPELL MANAGEMENT */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Left Side: Create Spell Form */}
          <Grid xs={12} md={4}>
            <CreateSpellCard />
          </Grid>

          {/* Right Side: Spell List */}
          <Grid xs={12} md={8}>
            <SpellListCard />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
