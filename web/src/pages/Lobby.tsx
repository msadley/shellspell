import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Button, Card, Stack, Typography, CircularProgress, 
  IconButton, Tooltip, Alert
} from '@mui/joy';
import { Copy, Check, LogOut, Swords, ShieldAlert } from 'lucide-react';
import { useSession, useStartSession } from '../hooks/useGame';

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: session, isLoading, error } = useSession(code);
  const startMutation = useStartSession();

  const userRole = localStorage.getItem('role');
  const userAlias = localStorage.getItem('alias') || 'Jogador';
  const isAdmin = userRole === 'ADMIN';

  // Automatically redirect to battle screen when game session status is ACTIVE
  useEffect(() => {
    if (session && session.status === 'ACTIVE') {
      navigate(`/battle/${session.sessionCode}`);
    }
  }, [session, navigate]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0d0413' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0d0413', p: 3 }}>
        <Card variant="outlined" sx={{ maxWidth: 400, width: '100%', background: 'rgba(25,15,45,0.7)', p: 3 }}>
          <Stack spacing={2} alignItems="center">
            <ShieldAlert size={48} color="#f44336" />
            <Typography level="h4" sx={{ color: 'white' }}>Sala Não Encontrada</Typography>
            <Typography level="body-sm" sx={{ color: 'neutral.400', textAlign: 'center' }}>
              Não foi possível carregar a sessão {code}. O código pode estar expirado ou incorreto.
            </Typography>
            <Button color="neutral" variant="soft" onClick={() => navigate('/')}>Voltar à Tela Inicial</Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = async () => {
    setErrorMsg(null);
    try {
      await startMutation.mutateAsync(session.sessionCode);
      navigate(`/battle/${session.sessionCode}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao iniciar o jogo.';
      setErrorMsg(msg);
    }
  };

  const handleLeave = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1b0a2a 0%, #0d0413 70%, #050107 100%)',
        p: 2,
        position: 'relative',
      }}
    >
      <Stack spacing={4} sx={{ width: '100%', maxWidth: 440, zIndex: 1 }}>
        
        {/* Navigation / Leave action */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography level="title-md" sx={{ color: '#b388ff', fontWeight: 600 }}>
            🔮 Olá, {userAlias} ({isAdmin ? 'Anfitrião' : 'Jogador'})
          </Typography>
          <Button 
            size="sm" 
            variant="plain" 
            color="neutral" 
            startDecorator={<LogOut size={16} />}
            onClick={handleLeave}
            sx={{ color: 'neutral.400', '&:hover': { color: 'white', background: 'rgba(255,255,255,0.05)' } }}
          >
            Sair
          </Button>
        </Stack>

        {errorMsg && (
          <Alert color="danger" variant="soft" sx={{ borderRadius: 'md' }}>
            {errorMsg}
          </Alert>
        )}

        <Card
          variant="outlined"
          sx={{
            borderRadius: 'lg',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(25, 15, 45, 0.6)',
            backdropFilter: 'blur(20px)',
            p: 4,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            textAlign: 'center',
          }}
        >
          <Stack spacing={4} alignItems="center">
            
            <Stack spacing={1}>
              <Typography level="body-xs" sx={{ color: 'neutral.400', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Código da Sala
              </Typography>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Typography level="h2" sx={{ color: 'white', letterSpacing: '0.15em', fontWeight: 800 }}>
                  {session.sessionCode}
                </Typography>
                <Tooltip title={copied ? "Copiado!" : "Copiar Código"} variant="solid">
                  <IconButton 
                    size="sm" 
                    variant="soft" 
                    color="neutral" 
                    onClick={handleCopyCode}
                    sx={{ color: 'neutral.300', background: 'rgba(255,255,255,0.05)', '&:hover': { color: 'white', background: 'rgba(255,255,255,0.1)' } }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <CircularProgress 
              variant="plain" 
              sx={{ 
                '--CircularProgress-size': '80px',
                '--CircularProgress-trackThickness': '6px',
                '--CircularProgress-progressThickness': '6px',
                color: '#b388ff'
              }} 
            />

            <Stack spacing={1}>
              <Typography level="title-lg" sx={{ color: 'white', fontWeight: 700 }}>
                {isAdmin ? 'Você é o Anfitrião' : 'Aguardando o Anfitrião'}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'neutral.400' }}>
                {isAdmin 
                  ? 'Compartilhe o código da sala com os outros jogadores e clique no botão abaixo para começar a batalha!' 
                  : 'A partida iniciará assim que o anfitrião der o sinal verde. Prepare seus grimórios!'
                }
              </Typography>
            </Stack>

            {isAdmin ? (
              <Button
                size="lg"
                color="primary"
                onClick={handleStartGame}
                loading={startMutation.isPending}
                startDecorator={<Swords size={20} />}
                sx={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #aa00ff 0%, #7600ea 100%)',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(170, 0, 255, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #be33ff 0%, #891eff 100%)',
                  }
                }}
              >
                Começar Partida
              </Button>
            ) : (
              <Box sx={{ width: '100%', p: 1.5, background: 'rgba(255,255,255,0.03)', borderRadius: 'md', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <Typography level="body-xs" sx={{ color: 'neutral.500', fontStyle: 'italic' }}>
                  Aguardando status da sessão mudar para ativo...
                </Typography>
              </Box>
            )}

          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
