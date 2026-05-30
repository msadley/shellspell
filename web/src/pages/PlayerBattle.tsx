import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Button, Card, Stack, Typography, CircularProgress,
  Input, Sheet, Alert, Modal, ModalDialog, DialogTitle, DialogContent, DialogActions
} from '@mui/joy';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useActiveBattle } from '../hooks/useActiveBattle';
import { useSpellCaster } from '../hooks/useSpellCaster';
import BattleGridContainer from '../components/battle/BattleGridContainer';
import SpellHistoryList from '../components/battle/SpellHistoryList';
import VictoryOverlay from '../components/battle/VictoryOverlay';
import CrystalDisplay from '../components/battle/CrystalDisplay';

export default function PlayerBattle() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  const {
    session,
    isLoading,
    error,
    maxHealth,
    showVictory,
    setShowVictory,
    recentCasts,
    isCrystalDefeated,
  } = useActiveBattle(code);

  const [isSessionCancelled, setIsSessionCancelled] = useState(false);
  const sessionExistsRef = useRef(false);

  useEffect(() => {
    if (session) {
      sessionExistsRef.current = true;
    }
  }, [session]);

  useEffect(() => {
    if (!isLoading && !session && sessionExistsRef.current) {
      setIsSessionCancelled(true);
    }
  }, [session, isLoading]);

  const {
    spellInput,
    setSpellInput,
    feedback,
    isPending,
    castSpell,
  } = useSpellCaster(session?.sessionCode, () => setShowVictory(true));


  // Redirect players to lobby if session is WAITING
  useEffect(() => {
    if (session && session.status === 'WAITING') {
      navigate(`/lobby/${session.sessionCode}`);
    }
  }, [session, navigate]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'black' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !session) {
    const axiosError = error as any;
    const isNetworkOrServerError = axiosError && (!axiosError.response || axiosError.response.status >= 500);

    if (isNetworkOrServerError) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'black', p: 3 }}>
          <Sheet variant="outlined" sx={{ maxWidth: 400, width: '100%', p: 3, borderRadius: 'lg', textAlign: 'center' }}>
            <Stack spacing={2} alignItems="center">
              <AlertCircle size={48} color="#ffa726" />
              <Typography level="h4" sx={{ color: 'white' }}>
                Erro de Conexão
              </Typography>
              <Typography level="body-sm" sx={{ color: 'neutral.400' }}>
                Não foi possível conectar ao servidor. Verifique sua conexão.
              </Typography>
              <Button color="primary" variant="solid" onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </Stack>
          </Sheet>
        </Box>
      );
    }

    if (isSessionCancelled) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'black', p: 3 }}>
          <Modal open={true} disableEscapeKeyDown>
            <ModalDialog variant="outlined" sx={{ maxWidth: 400, width: '100%' }}>
              <DialogTitle sx={{ color: "white" }}>Sessão Cancelada</DialogTitle>
              <DialogContent sx={{ color: 'neutral.400' }}>
                A sessão foi cancelada pelo administrador. Você foi desconectado.
              </DialogContent>
              <DialogActions>
                <Button color="primary" variant="solid" onClick={() => { logout(code); navigate('/'); }}>Sair</Button>
              </DialogActions>
            </ModalDialog>
          </Modal>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'black', p: 3 }}>
        <Sheet variant="outlined" sx={{ maxWidth: 400, width: '100%', p: 3, borderRadius: 'lg' }}>
          <Stack spacing={2} alignItems="center">
            <AlertCircle size={48} color="#f44336" />
            <Typography level="h4">Sessão Inválida</Typography>
            <Button color="neutral" variant="soft" onClick={() => { logout(code); navigate('/'); }}>Voltar</Button>
          </Stack>
        </Sheet>
      </Box>
    );
  }

  return (
    <BattleGridContainer
      sx={{
        gridTemplateColumns: '1fr minmax(auto, 250px)',
        gridTemplateRows: '1fr auto',
        gridTemplateAreas: `
          "crystal log"
          "input log"
        `,
        gap: 2,
      }}
    >
      {/* CRYSTAL COLUMN - Center */}
      <Stack 
        spacing={3} 
        alignItems="stretch" 
        justifyContent="flex-start"
        sx={{
          gridArea: 'crystal',
          p: 2,
          position: 'relative'
        }}
      >
        <CrystalDisplay
          crystalHealth={session.crystalHealth}
          maxHealth={maxHealth || session.crystalHealth}
          isCrystalDefeated={isCrystalDefeated}
          layout="title-top"
          titleAlign="left"
          maxCrystalHeight={{ xs: '40vh', md: '55vh' }}
        />
      </Stack>

      {/* SPELL LOG COLUMN - Right side */}
      <SpellHistoryList recentCasts={recentCasts} />

      {/* PLAYER INPUT - Bottom center-left */}
      <Card variant="outlined" sx={{
        gridArea: 'input',
        p: 2,
        borderRadius: 'lg',
      }}>
        {feedback && (
          <Alert color={feedback.success ? 'success' : 'danger'} variant="soft" sx={{ mb: 2 }}>
            {feedback.text}
          </Alert>
        )}

        <form onSubmit={castSpell} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <Input
            placeholder={isCrystalDefeated ? "Cristal destruído!" : "Digite o nome da magia..."}
            value={spellInput}
            onChange={(e) => setSpellInput(e.target.value)}
            disabled={isCrystalDefeated || isPending}
            sx={{ flexGrow: 1 }}
          />
          <Button
            type="submit"
            variant="solid"
            color="primary"
            disabled={isCrystalDefeated || isPending}
            loading={isPending}
          >
            Conjurar
          </Button>
        </form>
      </Card>

      {/* VICTORY MODAL OVERLAY */}
      <VictoryOverlay
        showVictory={showVictory}
        crystalSummary="O Cristal foi completamente destruído sob a investida de feitiços dos conjuradores!"
        summaryLabel="RESUMO DA CONJURAÇÃO"
        confirmText="Jogar Novamente"
        onConfirm={() => {
          logout(code);
          navigate('/');
        }}
      />
    </BattleGridContainer>
  );
}
