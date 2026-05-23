import { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Button, Card, Stack, Typography, LinearProgress, 
  Input, Grid, Alert, Sheet, Modal, ModalDialog
} from '@mui/joy';
import { Swords, Flame, Snowflake, Zap, Moon, Orbit, AlertCircle, Award } from 'lucide-react';
import { useSession, useCastSpell } from '../hooks/useGame';

interface SpellInfo {
  name: string;
  damage: number;
  description: string;
  icon: ReactNode;
}

const AVAILABLE_SPELLS: SpellInfo[] = [
  { name: 'Fireball', damage: 25, description: 'Lança uma bola de fogo massiva', icon: <Flame size={18} color="#ff3d00" /> },
  { name: 'Frostbolt', damage: 15, description: 'Congela as asas do dragão', icon: <Snowflake size={18} color="#00e5ff" /> },
  { name: 'Thunderstrike', damage: 35, description: 'Invoca um raio dos céus', icon: <Zap size={18} color="#ffd600" /> },
  { name: 'Shadowburn', damage: 20, description: 'Corrói a alma da fera', icon: <Moon size={18} color="#d500f9" /> },
  { name: 'Earthquake', damage: 40, description: 'Abre fendas sob o dragão', icon: <Orbit size={18} color="#ffab00" /> },
];

export default function Battle() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const { data: session, isLoading, error } = useSession(code);
  const castSpellMutation = useCastSpell();

  const [spellInput, setSpellInput] = useState('');
  const [maxHealth, setMaxHealth] = useState<number | null>(null);
  
  // Track spells cast by this player in this session
  const [usedSpells, setUsedSpells] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);
  const [showVictory, setShowVictory] = useState(false);

  const userAlias = localStorage.getItem('alias') || 'Jogador';

  // Set initial max health once the session loads
  useEffect(() => {
    if (session && maxHealth === null) {
      setMaxHealth(session.dragonHealth);
    }
    if (session && session.dragonHealth <= 0) {
      setShowVictory(true);
    }
  }, [session, maxHealth]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0d0413' }}>
        <LinearProgress color="primary" sx={{ width: '200px' }} />
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0d0413', p: 3 }}>
        <Card variant="outlined" sx={{ maxWidth: 400, width: '100%', background: 'rgba(25,15,45,0.7)', p: 3 }}>
          <Stack spacing={2} alignItems="center">
            <AlertCircle size={48} color="#f44336" />
            <Typography level="h4" sx={{ color: 'white' }}>Sessão Inválida</Typography>
            <Button color="neutral" variant="soft" onClick={() => navigate('/')}>Voltar</Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  const handleCastSpellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const spellNameTrimmed = spellInput.trim();

    if (!spellNameTrimmed) return;

    // Local pre-validation
    const matchedSpell = AVAILABLE_SPELLS.find(
      (s) => s.name.toLowerCase() === spellNameTrimmed.toLowerCase()
    );

    if (!matchedSpell) {
      setFeedback({ success: false, text: `O feitiço "${spellNameTrimmed}" não existe em seu grimório!` });
      return;
    }

    if (usedSpells.includes(matchedSpell.name)) {
      setFeedback({ success: false, text: `Você já conjurou "${matchedSpell.name}" nesta sessão. Feitiços não podem ser repetidos!` });
      return;
    }

    try {
      const res = await castSpellMutation.mutateAsync({
        code: session.sessionCode,
        spellName: matchedSpell.name,
      });

      // Add to local list of used spells
      setUsedSpells((prev) => [...prev, matchedSpell.name]);
      setSpellInput('');
      setFeedback({ 
        success: true, 
        text: `Sucesso! Você lançou ${res.spellName} e causou ${res.damageDealt} de dano!` 
      });

      if (res.remainingDragonHealth <= 0) {
        setShowVictory(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao lançar feitiço.';
      setFeedback({ success: false, text: msg });
    }
  };

  const handleQuickCast = async (spellName: string) => {
    if (usedSpells.includes(spellName) || session.dragonHealth <= 0) return;
    setSpellInput(spellName);
  };

  const healthPercentage = maxHealth ? Math.max(0, (session.dragonHealth / maxHealth) * 100) : 100;
  const isDragonDefeated = session.dragonHealth <= 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #240a34 0%, #0c0214 70%, #030006 100%)',
        p: { xs: 2, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: 'white',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      {/* Decorative dragon background glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(233, 30, 99, 0.1) 0%, rgba(0,0,0,0) 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* HEADER SECTION */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', pb: 2 }}>
        <Stack>
          <Typography level="body-xs" sx={{ color: 'neutral.400', letterSpacing: '0.1em' }}>MULTI JOGADOR QUEBRA-GELO</Typography>
          <Typography level="title-lg" sx={{ color: 'white', fontWeight: 800 }}>SHELLSPELL RAID</Typography>
        </Stack>
        <Sheet
          variant="outlined"
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 'sm',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#b388ff',
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}
        >
          SALA: {session.sessionCode}
        </Sheet>
      </Stack>

      {/* BOSS (DRAGON) ARENA */}
      <Stack spacing={2} alignItems="center" sx={{ my: { xs: 4, md: 2 }, zIndex: 1 }}>
        {/* Animated Boss Figure */}
        <Box
          sx={{
            width: { xs: 180, md: 240 },
            height: { xs: 180, md: 240 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(144, 30, 200, 0.15) 0%, rgba(240, 10, 80, 0.05) 50%, rgba(0,0,0,0) 70%)',
            border: '2px solid rgba(255, 255, 255, 0.05)',
            boxShadow: isDragonDefeated ? 'none' : '0 0 50px rgba(240, 10, 80, 0.25)',
            animation: isDragonDefeated ? 'none' : 'float 6s ease-in-out infinite',
            position: 'relative',
            transition: 'all 0.5s ease',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(-15px) scale(1.05)' },
            }
          }}
        >
          <Typography sx={{ fontSize: { xs: '80px', md: '120px' }, filter: isDragonDefeated ? 'grayscale(1) opacity(0.5)' : 'drop-shadow(0 0 15px rgba(244, 67, 54, 0.6))' }}>
            🐉
          </Typography>
        </Box>

        {/* Boss Title & Life bar */}
        <Stack spacing={1} sx={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
          <Typography level="h3" sx={{ color: isDragonDefeated ? 'neutral.500' : '#ff4081', fontWeight: 800, letterSpacing: '0.05em' }}>
            {isDragonDefeated ? 'DRAGÃO DERROTADO' : 'TIAMAT, O ANULADOR DE COMPILAÇÕES'}
          </Typography>

          <Box sx={{ width: '100%', position: 'relative' }}>
            <LinearProgress
              value={healthPercentage}
              determinate
              color={healthPercentage > 50 ? 'success' : healthPercentage > 20 ? 'warning' : 'danger'}
              sx={{
                height: 24,
                borderRadius: 'md',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                '--LinearProgress-radius': '6px',
                background: 'rgba(0,0,0,0.4)',
              }}
            />
            <Typography
              level="title-sm"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontWeight: 800,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)'
              }}
            >
              HP: {session.dragonHealth} / {maxHealth || session.dragonHealth}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* PLAYER HUD & ACTION DECK */}
      <Grid container spacing={3} sx={{ zIndex: 1, mt: 4 }}>
        
        {/* PlayerHUD (Bottom Left Perspective) */}
        <Grid xs={12} md={5}>
          <Card
            variant="outlined"
            sx={{
              background: 'rgba(15, 10, 25, 0.6)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'lg',
              height: '100%',
              p: 3,
            }}
          >
            <Stack spacing={2}>
              <Typography level="title-md" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, fontWeight: 700 }}>
                🔮 Grimório do Conjurador
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#b388ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  🧙‍♂️
                </Box>
                <Stack>
                  <Typography level="title-sm" sx={{ color: 'white', fontWeight: 600 }}>{userAlias}</Typography>
                  <Typography level="body-xs" sx={{ color: 'neutral.400' }}>Feitiços Lançados: {usedSpells.length} / {AVAILABLE_SPELLS.length}</Typography>
                </Stack>
              </Stack>

              <Typography level="body-xs" sx={{ color: 'neutral.400', fontWeight: 600, mt: 1 }}>HISTÓRICO LOCAL:</Typography>
              <Stack spacing={1} sx={{ maxHeight: 110, overflowY: 'auto' }}>
                {usedSpells.length === 0 ? (
                  <Typography level="body-xs" sx={{ color: 'neutral.500', fontStyle: 'italic' }}>
                    Nenhum feitiço lançado ainda. Digite um feitiço para começar!
                  </Typography>
                ) : (
                  usedSpells.map((spell, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                      <Typography level="body-xs" sx={{ color: '#00e5ff' }}>✓</Typography>
                      <Typography level="body-xs" sx={{ color: 'neutral.300' }}>Lançou <b>{spell}</b> com sucesso.</Typography>
                    </Stack>
                  ))
                )}
              </Stack>
            </Stack>
          </Card>
        </Grid>

        {/* Action Panel (Bottom Right Input & Buttons) */}
        <Grid xs={12} md={7}>
          <Card
            variant="outlined"
            sx={{
              background: 'rgba(15, 10, 25, 0.6)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'lg',
              p: 3,
            }}
          >
            <Stack spacing={2}>
              <Typography level="title-md" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, fontWeight: 700 }}>
                ⚔️ Lançar Magia
              </Typography>

              {feedback && (
                <Alert
                  color={feedback.success ? 'success' : 'danger'}
                  variant="soft"
                  size="sm"
                  sx={{ borderRadius: 'md' }}
                >
                  {feedback.text}
                </Alert>
              )}

              {/* Spell Input Form */}
              <form onSubmit={handleCastSpellSubmit}>
                <Stack direction="row" spacing={1}>
                  <Input
                    placeholder={isDragonDefeated ? "Dragão derrotado!" : "Digite o nome da magia (ex: Fireball)..."}
                    value={spellInput}
                    onChange={(e) => setSpellInput(e.target.value)}
                    disabled={isDragonDefeated || castSpellMutation.isPending}
                    variant="outlined"
                    sx={{
                      flexGrow: 1,
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      '&:focus-within': { borderColor: '#b388ff' }
                    }}
                  />
                  <Button
                    type="submit"
                    variant="solid"
                    color="primary"
                    disabled={isDragonDefeated}
                    loading={castSpellMutation.isPending}
                    startDecorator={<Swords size={18} />}
                    sx={{
                      background: 'linear-gradient(90deg, #aa00ff 0%, #7600ea 100%)',
                      '&:hover': { background: 'linear-gradient(90deg, #be33ff 0%, #891eff 100%)' }
                    }}
                  >
                    Conjurar
                  </Button>
                </Stack>
              </form>

              {/* Quick Spell Buttons */}
              <Typography level="body-xs" sx={{ color: 'neutral.400', fontWeight: 600, mt: 1 }}>DECK DE DISPONIBILIDADE:</Typography>
              <Grid container spacing={1}>
                {AVAILABLE_SPELLS.map((spell) => {
                  const isUsed = usedSpells.includes(spell.name);
                  return (
                    <Grid xs={12} sm={4} key={spell.name}>
                      <Button
                        variant="outlined"
                        color="neutral"
                        size="sm"
                        disabled={isUsed || isDragonDefeated}
                        onClick={() => handleQuickCast(spell.name)}
                        sx={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          background: isUsed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                          border: isUsed ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(255,255,255,0.08)',
                          opacity: isUsed ? 0.4 : 1,
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.08)',
                            borderColor: '#b388ff'
                          }
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                          {spell.icon}
                          <Stack alignItems="flex-start" sx={{ flexGrow: 1 }}>
                            <Typography level="title-sm" sx={{ color: isUsed ? 'neutral.500' : 'white', fontWeight: 700 }}>
                              {spell.name}
                            </Typography>
                            <Typography level="body-xs" sx={{ color: 'neutral.400', fontSize: '10px' }}>
                              Dano: {spell.damage}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* VICTORY MODAL OVERLAY */}
      <Modal open={showVictory} onClose={() => {}}>
        <ModalDialog
          variant="outlined"
          sx={{
            maxWidth: 450,
            width: '100%',
            background: 'radial-gradient(circle, #2a1545 0%, #110520 100%)',
            border: '2px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 0 40px rgba(0, 229, 255, 0.3)',
            color: 'white',
            textAlign: 'center',
            p: 4,
          }}
        >
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(0, 229, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
                  '50%': { transform: 'scale(1.1)', boxShadow: '0 0 35px rgba(0, 229, 255, 0.5)' },
                  '100%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
                }
              }}
            >
              <Award size={48} color="#00e5ff" />
            </Box>

            <Stack spacing={1}>
              <Typography level="h3" sx={{ color: '#00e5ff', fontWeight: 900, letterSpacing: '0.05em' }}>
                VITÓRIA!
              </Typography>
              <Typography level="body-sm" sx={{ color: 'neutral.300' }}>
                O Dragão foi completamente pulverizado sob a investida de feitiços dos conjuradores!
              </Typography>
            </Stack>

            <Sheet
              variant="soft"
              sx={{
                p: 2,
                borderRadius: 'md',
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <Typography level="body-xs" sx={{ color: 'neutral.400', mb: 1 }}>RESUMO DA CONJURAÇÃO:</Typography>
              <Typography level="title-md" sx={{ color: 'white', fontWeight: 700 }}>
                Você lançou {usedSpells.length} de {AVAILABLE_SPELLS.length} feitiços.
              </Typography>
              <Typography level="body-sm" sx={{ color: '#00c853', fontWeight: 600 }}>
                Dano Total Causado: {usedSpells.reduce((acc, curr) => acc + (AVAILABLE_SPELLS.find(s => s.name === curr)?.damage || 0), 0)} HP
              </Typography>
            </Sheet>

            <Button
              variant="solid"
              color="neutral"
              onClick={() => {
                localStorage.clear();
                navigate('/');
              }}
              sx={{
                width: '100%',
                background: 'linear-gradient(90deg, #aa00ff 0%, #7600ea 100%)',
                color: 'white',
                fontWeight: 700,
                '&:hover': { background: 'linear-gradient(90deg, #be33ff 0%, #891eff 100%)' }
              }}
            >
              Jogar Novamente
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
