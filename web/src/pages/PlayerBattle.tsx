import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Stack, CircularProgress, Snackbar
} from '@mui/joy';
import { useAuthStore } from '../store/useAuthStore';
import { useActiveBattle } from '../hooks/useActiveBattle';
import BattleGridContainer from '../components/battle/BattleGridContainer';
import SpellHistoryList from '../components/battle/SpellHistoryList';
import VictoryOverlay from '../components/battle/VictoryOverlay';
import CrystalDisplay from '../components/battle/CrystalDisplay';
import GameErrorOverlay from '../components/battle/GameErrorOverlay';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';
import SpellEffectsCanvas from '../components/battle/SpellEffectsCanvas';
import { PlayerWaitingRoom, WizardRankingResults } from '../components/battle/EndGameViews';
import SimulatedTerminal from '../components/terminal/SimulatedTerminal';

export default function PlayerBattle() {
  const { code } = useParams<{ code: string }>();
  useDocumentMetadata(`Batalha Ativa - Sala ${code || ""}`, "Lute contra o Cristal conjurando magias na arena ShellSpell.");

  const navigate = useNavigate();
  const { username, logout } = useAuthStore();
  
  const {
    session,
    isLoading,
    error,
    maxHealth,
    showVictory,
    setShowVictory,
    recentCasts,
    isCrystalDefeated,
    isCancelled,
  } = useActiveBattle(code);

  const [animationFinished, setAnimationFinished] = useState(false);
  const hasBeenActiveRef = useRef(false);

  useEffect(() => {
    if (session && session.status === 'ACTIVE') {
      hasBeenActiveRef.current = true;
    }
  }, [session]);

  useEffect(() => {
    if (isCrystalDefeated) {
      const timer = setTimeout(() => {
        setAnimationFinished(true);
      }, 3000); // 3 seconds for shatter animation to complete
      return () => clearTimeout(timer);
    } else {
      setAnimationFinished(false);
    }
  }, [isCrystalDefeated]);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

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

    return (
      <GameErrorOverlay
        type={isNetworkOrServerError ? 'connection' : isCancelled ? 'cancelled' : 'invalid'}
        onExit={() => {
          logout(code);
          navigate('/');
        }}
      />
    );
  }
  if (session && session.status === 'FINISHED') {
    // If the crystal has been defeated and we were in an active game, we want to play
    // the death animation first before showing the waiting room / ranking results.
    if (!hasBeenActiveRef.current || animationFinished || session.resultsRevealed) {
      if (!session.resultsRevealed) {
        return (
          <PlayerWaitingRoom
            session={session}
            onExit={() => {
              logout(code);
              navigate('/');
            }}
          />
        );
      } else {
        return (
          <WizardRankingResults
            session={session}
            onExit={() => {
              logout(code);
              navigate('/');
            }}
          />
        );
      }
    }
  }
  return (
    <BattleGridContainer
      sx={{
        gridTemplateColumns: { xs: '1fr', md: '1fr minmax(auto, 300px)' },
        gridTemplateRows: isTerminalMaximized
          ? '1fr'
          : { xs: 'auto 1fr', md: 'auto 1fr' },
        gridTemplateAreas: isTerminalMaximized
          ? {
              xs: '"input"',
              md: '"input log"',
            }
          : {
              xs: `
                "crystal"
                "input"
              `,
              md: `
                "crystal log"
                "input log"
              `,
            },
        gap: { xs: 1.5, md: 2 },
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* CRYSTAL COLUMN - Center (hidden when terminal is maximized) */}
      {!isTerminalMaximized && (
        <Stack 
          spacing={1} 
          alignItems="stretch" 
          justifyContent="flex-start"
          sx={{
            gridArea: 'crystal',
            p: { xs: 1, md: 1.5 },
            position: 'relative',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <CrystalDisplay
            crystalHealth={session.crystalHealth}
            maxHealth={maxHealth || session.crystalHealth}
            isCrystalDefeated={isCrystalDefeated}
            layout="title-top"
            titleAlign="left"
            maxCrystalHeight={{ xs: '18vh', md: '22vh' }}
          />
        </Stack>
      )}

      {/* SPELL LOG COLUMN - Right side */}
      <SpellHistoryList 
        recentCasts={recentCasts.filter((cast) => cast.username === username)} 
        showCastBy={false}
      />

      {/* SIMULATED TERMINAL - Bottom center-left (takes full space when maximized) */}
      <SimulatedTerminal
        sessionCode={session?.sessionCode}
        username={username}
        isCrystalDefeated={isCrystalDefeated}
        onVictory={() => setShowVictory(true)}
        isMaximized={isTerminalMaximized}
        onToggleMaximize={() => setIsTerminalMaximized((prev) => !prev)}
        onFeedback={(fb) => {
          if (!fb.success) {
            setToastMessage(fb.text);
            setToastOpen(true);
          }
        }}
      />

      {/* VICTORY MODAL OVERLAY */}
      <VictoryOverlay
        showVictory={showVictory && animationFinished}
        crystalSummary="O Cristal foi completamente destruído sob a investida de feitiços dos conjuradores!"
        summaryLabel="RESUMO DA CONJURAÇÃO"
        confirmText="Jogar Novamente"
        onConfirm={() => {
          logout(code);
          navigate('/');
        }}
      />

      <SpellEffectsCanvas
        recentCasts={recentCasts}
        username={username || undefined}
        isAdmin={false}
      />

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        color="danger"
        variant="solid"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ zIndex: 10000 }}
      >
        {toastMessage}
      </Snackbar>
    </BattleGridContainer>
  );
}
