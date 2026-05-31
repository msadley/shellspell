import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Button, Card, Stack, CircularProgress, Input, Typography, Snackbar
} from '@mui/joy';
import { keyframes } from '@emotion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useActiveBattle } from '../hooks/useActiveBattle';
import { useSpellCaster } from '../hooks/useSpellCaster';
import BattleGridContainer from '../components/battle/BattleGridContainer';
import SpellHistoryList from '../components/battle/SpellHistoryList';
import VictoryOverlay from '../components/battle/VictoryOverlay';
import CrystalDisplay from '../components/battle/CrystalDisplay';
import GameErrorOverlay from '../components/battle/GameErrorOverlay';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';
import SpellEffectsCanvas from '../components/battle/SpellEffectsCanvas';
import { PlayerWaitingRoom, WizardRankingResults } from '../components/battle/EndGameViews';

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-4px); }
  30%, 60%, 90% { transform: translateX(4px); }
`;

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

  const {
    spellInput,
    setSpellInput,
    feedback,
    isPending,
    castSpell,
  } = useSpellCaster(session?.sessionCode, () => setShowVictory(true));

  const [isShaking, setIsShaking] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (feedback) {
      if (!feedback.success) {
        const isSpellNotFound = feedback.text.toLowerCase().includes("spell not found");
        if (isSpellNotFound) {
          setIsShaking(true);
          const timer = setTimeout(() => setIsShaking(false), 300);
          return () => clearTimeout(timer);
        } else {
          setToastMessage(feedback.text);
          setToastOpen(true);
        }
      }
    }
  }, [feedback]);


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
        gridTemplateColumns: '1fr minmax(auto, 300px)',
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
      <SpellHistoryList 
        recentCasts={recentCasts.filter((cast) => cast.username === username)} 
        showCastBy={false}
      />

      {/* PLAYER INPUT - Bottom center-left */}
      <Card variant="outlined" sx={{
        gridArea: 'input',
        p: 2,
        borderRadius: 'lg',
      }}>
        <form onSubmit={castSpell} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <Input
            placeholder={isCrystalDefeated ? "Cristal destruído!" : "Digite o nome da magia..."}
            value={spellInput}
            onChange={(e) => setSpellInput(e.target.value)}
            disabled={isCrystalDefeated || isPending}
            startDecorator={
              <Typography
                sx={{
                  color: 'rgb(168, 85, 247)',
                  fontWeight: 'bold',
                  mr: 0.5,
                  userSelect: 'none'
                }}
              >
                ❯
              </Typography>
            }
            sx={{ 
              flexGrow: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              '&::before': {
                display: 'none !important',
              },
              '&:focus-within': {
                borderColor: 'rgba(255, 255, 255, 0.3) !important',
                boxShadow: 'none !important',
              },
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.25)',
              },
              ...(isShaking && {
                animation: `${shakeAnimation} 0.3s ease-in-out`,
                borderColor: 'danger.500 !important',
                '&:hover': {
                  borderColor: 'danger.500 !important',
                }
              })
            }}
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
