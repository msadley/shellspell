import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Card, FormControl, FormLabel, Input, 
  Stack, Typography, Tabs, TabList, Tab, TabPanel, Alert
} from '@mui/joy';
import { Play, PlusCircle, AlertCircle, Wand2 } from 'lucide-react';
import { useRegisterAndJoin, useCreateSession } from '../hooks/useGame';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [playerName, setPlayerName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [dragonHealth, setDragonHealth] = useState<number>(100);

  // React Query Mutations
  const joinMutation = useRegisterAndJoin();
  const createMutation = useCreateSession();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!playerName.trim()) {
      setErrorMsg('Por favor, insira o seu nome.');
      return;
    }
    if (!sessionCode.trim()) {
      setErrorMsg('Por favor, insira o código da sessão.');
      return;
    }

    try {
      const session = await joinMutation.mutateAsync({
        username: playerName,
        code: sessionCode.toUpperCase().trim(),
      });
      navigate(`/lobby/${session.sessionCode}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao entrar na sessão. Verifique o código e tente novamente.';
      setErrorMsg(msg);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!adminName.trim()) {
      setErrorMsg('Por favor, insira o nome do anfitrião.');
      return;
    }
    if (dragonHealth <= 0) {
      setErrorMsg('A vida do dragão deve ser pelo menos 1.');
      return;
    }

    try {
      const code = await createMutation.mutateAsync({
        username: adminName,
        dragonHealth,
      });
      navigate(`/lobby/${code}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao criar sessão.';
      setErrorMsg(msg);
    }
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
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Dynamic Background Glows */}
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(144, 30, 200, 0.15) 0%, rgba(0,0,0,0) 70%)',
          top: '-10%',
          left: '-10%',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(200, 30, 100, 0.12) 0%, rgba(0,0,0,0) 70%)',
          bottom: '-10%',
          right: '-10%',
          zIndex: 0,
        }}
      />

      <Stack spacing={4} sx={{ width: '100%', maxWidth: 440, zIndex: 1, alignItems: 'center' }}>
        {/* Glowing Stylized Logo */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Wand2 size={40} color="#b388ff" style={{ filter: 'drop-shadow(0 0 10px #b388ff)' }} />
          <Typography
            level="h1"
            sx={{
              fontSize: '3rem',
              fontWeight: 900,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.15em',
              background: 'linear-gradient(135deg, #e040fb 0%, #00e5ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(0,229,255,0.2)',
              m: 0,
            }}
          >
            SHELLSPELL
          </Typography>
        </Stack>

        <Typography level="body-md" sx={{ color: 'neutral.400', textAlign: 'center', mt: -2 }}>
          Convoque seus amigos, digite feitiços mágicos em tempo real e derrotem o Dragão!
        </Typography>

        {errorMsg && (
          <Alert
            color="danger"
            variant="soft"
            startDecorator={<AlertCircle />}
            sx={{ width: '100%', borderRadius: 'md' }}
          >
            {errorMsg}
          </Alert>
        )}

        <Card
          variant="outlined"
          sx={{
            width: '100%',
            borderRadius: 'lg',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(25, 15, 45, 0.6)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            p: 3,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => {
              setActiveTab(val as number);
              setErrorMsg(null);
            }}
            sx={{
              background: 'transparent',
              '--Tabs-gap': '0px',
            }}
          >
            <TabList
              variant="soft"
              color="neutral"
              sx={{
                p: 0.5,
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 'md',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Tab
                disableIndicator
                sx={{
                  flexGrow: 1,
                  fontWeight: 600,
                  borderRadius: 'sm',
                  color: activeTab === 0 ? 'white' : 'neutral.400',
                  background: activeTab === 0 ? 'rgba(179, 136, 255, 0.25)' : 'transparent',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.06)' },
                }}
              >
                Entrar em Sala
              </Tab>
              <Tab
                disableIndicator
                sx={{
                  flexGrow: 1,
                  fontWeight: 600,
                  borderRadius: 'sm',
                  color: activeTab === 1 ? 'white' : 'neutral.400',
                  background: activeTab === 1 ? 'rgba(179, 136, 255, 0.25)' : 'transparent',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.06)' },
                }}
              >
                Criar Sala
              </Tab>
            </TabList>

            <TabPanel value={0} sx={{ p: 0, pt: 3 }}>
              <form onSubmit={handleJoin}>
                <Stack spacing={2.5}>
                  <FormControl required>
                    <FormLabel sx={{ color: 'neutral.300', fontWeight: 600 }}>Seu Nome</FormLabel>
                    <Input
                      placeholder="Ex: Arthur Pendragon"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      variant="outlined"
                      sx={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        '&:focus-within': { borderColor: '#b388ff' },
                      }}
                    />
                  </FormControl>

                  <FormControl required>
                    <FormLabel sx={{ color: 'neutral.300', fontWeight: 600 }}>Código da Sessão</FormLabel>
                    <Input
                      placeholder="Ex: XK7F90"
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value)}
                      variant="outlined"
                      sx={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        textTransform: 'uppercase',
                        '&:focus-within': { borderColor: '#b388ff' },
                      }}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    variant="solid"
                    color="primary"
                    loading={joinMutation.isPending}
                    startDecorator={<Play size={18} />}
                    sx={{
                      background: 'linear-gradient(90deg, #aa00ff 0%, #7600ea 100%)',
                      boxShadow: '0 4px 15px rgba(170, 0, 255, 0.3)',
                      fontWeight: 700,
                      '&:hover': {
                        background: 'linear-gradient(90deg, #be33ff 0%, #891eff 100%)',
                      },
                    }}
                  >
                    Entrar na Luta
                  </Button>
                </Stack>
              </form>
            </TabPanel>

            <TabPanel value={1} sx={{ p: 0, pt: 3 }}>
              <form onSubmit={handleCreate}>
                <Stack spacing={2.5}>
                  <FormControl required>
                    <FormLabel sx={{ color: 'neutral.300', fontWeight: 600 }}>Nome do Anfitrião</FormLabel>
                    <Input
                      placeholder="Ex: Mago Merlin"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      variant="outlined"
                      sx={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        '&:focus-within': { borderColor: '#b388ff' },
                      }}
                    />
                  </FormControl>

                  <FormControl required>
                    <FormLabel sx={{ color: 'neutral.300', fontWeight: 600 }}>Vida Inicial do Dragão</FormLabel>
                    <Input
                      type="number"
                      placeholder="100"
                      value={dragonHealth}
                      onChange={(e) => setDragonHealth(parseInt(e.target.value) || 0)}
                      variant="outlined"
                      sx={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        '&:focus-within': { borderColor: '#b388ff' },
                      }}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    variant="solid"
                    color="success"
                    loading={createMutation.isPending}
                    startDecorator={<PlusCircle size={18} />}
                    sx={{
                      background: 'linear-gradient(90deg, #00c853 0%, #00b0ff 100%)',
                      boxShadow: '0 4px 15px rgba(0, 200, 83, 0.25)',
                      fontWeight: 700,
                      '&:hover': {
                        background: 'linear-gradient(90deg, #0df06b 0%, #33c0ff 100%)',
                      },
                    }}
                  >
                    Criar Sessão
                  </Button>
                </Stack>
              </form>
            </TabPanel>
          </Tabs>
        </Card>
      </Stack>
    </Box>
  );
}
