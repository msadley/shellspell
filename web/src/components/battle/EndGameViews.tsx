import { Box, Button, Card, Stack, Typography, Sheet, CircularProgress, Grid } from '@mui/joy';
import { Trophy, Crown, Sparkles, Zap, TrendingUp, User, CheckCircle2, BarChart3, Undo2, LogOut } from 'lucide-react';
import { SessionResponse } from '../../types';
import { useRevealResults } from '../../hooks/useSession';
import HomeLayout from '../HomeLayout';
import { SPELL_CATEGORY_COLORS } from '../../constants/spells';

export function PlayerWaitingRoom({ session, onExit }: { session: SessionResponse; onExit: () => void }) {
  return (
    <HomeLayout>
      <Card
        variant="outlined"
        sx={{
          width: '100%',
          borderRadius: 'lg',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Stack spacing={4} alignItems="center">
          <Stack spacing={1}>
            <Typography
              level="body-xs"
              sx={{
                color: "neutral.400",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: 700
              }}
            >
              Combate Encerrado!
            </Typography>
            <Typography level="h2" sx={{ color: 'white', fontWeight: 800 }}>
              SALA {session.sessionCode}
            </Typography>
          </Stack>

          <CircularProgress
            variant="plain"
            sx={{
              "--CircularProgress-size": "80px",
              "--CircularProgress-trackThickness": "6px",
              "--CircularProgress-progressThickness": "6px",
            }}
          />

          <Stack spacing={1}>
            <Typography level="title-lg" sx={{ color: 'white', fontWeight: 700 }}>
              Aguardando Resultados
            </Typography>
            <Typography level="body-sm" sx={{ color: 'neutral.400' }}>
              O cristal foi destruído! Aguardando o anfitrião revelar o ranking oficial dos magos.
            </Typography>
          </Stack>

          {/* List of active players waiting */}
          <Stack spacing={1.5} sx={{ width: '100%', alignItems: 'stretch' }}>
            <Typography level="body-xs" sx={{ color: 'neutral.400', textAlign: 'left', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Conjuradores na Sala ({session.players.length})
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: 'center',
                maxHeight: 120,
                overflowY: 'auto',
                p: 1.5,
                borderRadius: 'sm',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              {session.players.map((player) => (
                <Box
                  key={player}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 'md',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'white',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  🧙‍♂️ {player}
                </Box>
              ))}
            </Box>
          </Stack>

          <Button
            variant="plain"
            color="neutral"
            onClick={onExit}
            startDecorator={<LogOut size={16} />}
            sx={{
              color: 'neutral.400',
              '&:hover': {
                color: 'white',
                background: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Sair do Jogo
          </Button>
        </Stack>
      </Card>
    </HomeLayout>
  );
}

export function WizardRankingResults({ session, onExit }: { session: SessionResponse; onExit: () => void }) {
  const ranking = session.ranking || [];

  // Top 3 wizards
  const first = ranking[0];
  const second = ranking[1];
  const third = ranking[2];

  return (
    <Sheet
      variant="solid"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'common.black',
        p: { xs: 2, md: 4 },
        pb: 8,
        overflowY: 'auto'
      }}
    >
      <Stack spacing={4} sx={{ maxWidth: 800, width: '100%', alignItems: 'center' }}>
        
        {/* Header */}
        <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
          <Sheet
            variant="soft"
            sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              bgcolor: 'rgba(168, 85, 247, 0.15)',
              color: 'rgb(168, 85, 247)',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}
          >
            <Trophy size={40} />
          </Sheet>
          <Typography
            level="h1"
            textColor="common.white"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '32px', md: '42px' },
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Ranking dos Magos
          </Typography>
        </Stack>

        {/* Podium (Top 3) */}
        {ranking.length > 0 && (
          <Box sx={{ width: '100%', py: 5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'flex-end' },
                justifyContent: 'center',
                gap: 3,
                width: '100%'
              }}
            >
              {/* 2nd Place */}
              {second && (
                <Card
                  variant="outlined"
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    order: { xs: 2, sm: 1 },
                    p: 3,
                    bgcolor: 'neutral.900',
                    borderColor: 'rgba(168, 85, 247, 0.15)',
                    textAlign: 'center',
                    boxShadow: 'none'
                  }}
                >
                  <Typography level="body-xs" textColor="neutral.400" sx={{ fontWeight: 700 }}>
                    2º LUGAR
                  </Typography>
                  <Box sx={{ fontSize: '40px', my: 1 }}>🥈</Box>
                  <Typography level="title-md" textColor="common.white" sx={{ fontWeight: 700 }}>
                    {second.username}
                  </Typography>
                  <Typography level="body-sm" textColor="neutral.300">
                    {second.spellsCast} feitiços
                  </Typography>
                  <Typography level="body-xs" textColor="neutral.400">
                    Dano: {second.totalDamage}
                  </Typography>
                </Card>
              )}

              {/* 1st Place */}
              {first && (
                <Card
                  variant="outlined"
                  sx={{
                    flex: 1.2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    order: { xs: 1, sm: 2 },
                    p: 4,
                    bgcolor: 'neutral.900',
                    borderColor: 'rgba(168, 85, 247, 0.6)',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.25)',
                    transform: { xs: 'none', sm: 'scale(1.08)' },
                    zIndex: 2,
                    my: { xs: 0, sm: -2 },
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Crown size={18} color="rgb(168, 85, 247)" />
                    <Typography level="body-xs" sx={{ color: 'rgb(168, 85, 247)', fontWeight: 800, letterSpacing: '0.1em' }}>
                      SUPREMO
                    </Typography>
                  </Box>
                  <Box sx={{ fontSize: '56px', my: 1 }}>🥇</Box>
                  <Typography level="h4" textColor="common.white" sx={{ fontWeight: 900 }}>
                    {first.username}
                  </Typography>
                  <Typography level="title-md" sx={{ color: 'rgb(192, 132, 252)', fontWeight: 700 }}>
                    {first.spellsCast} feitiços
                  </Typography>
                  <Typography level="body-sm" textColor="neutral.300">
                    Dano Total: {first.totalDamage}
                  </Typography>
                </Card>
              )}

              {/* 3rd Place */}
              {third && (
                <Card
                  variant="outlined"
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    order: 3,
                    p: 3,
                    bgcolor: 'neutral.900',
                    borderColor: 'rgba(168, 85, 247, 0.15)',
                    textAlign: 'center',
                    boxShadow: 'none'
                  }}
                >
                  <Typography level="body-xs" textColor="neutral.400" sx={{ fontWeight: 700 }}>
                    3º LUGAR
                  </Typography>
                  <Box sx={{ fontSize: '40px', my: 1 }}>🥉</Box>
                  <Typography level="title-md" textColor="common.white" sx={{ fontWeight: 700 }}>
                    {third.username}
                  </Typography>
                  <Typography level="body-sm" textColor="neutral.300">
                    {third.spellsCast} feitiços
                  </Typography>
                  <Typography level="body-xs" textColor="neutral.400">
                    Dano: {third.totalDamage}
                  </Typography>
                </Card>
              )}
            </Box>
          </Box>
        )}

        {/* Detailed Leaderboard Table */}
        <Card
          variant="outlined"
          sx={{
            width: '100%',
            p: 3,
            bgcolor: 'neutral.900',
            borderColor: 'rgba(168, 85, 247, 0.15)',
            boxShadow: 'none'
          }}
        >
          <Typography level="title-md" textColor="common.white" sx={{ fontWeight: 700, mb: 2 }}>
            Tabela de Classificação
          </Typography>

          <Stack spacing={1} sx={{ maxHeight: 480, overflowY: 'auto', pr: 1 }}>
            {ranking.map((wizard, index) => {
              const isFirst = index === 0;
              
              return (
                <Sheet
                  key={wizard.username}
                  variant={isFirst ? 'soft' : 'outlined'}
                  sx={{
                    p: 2,
                    borderRadius: 'md',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    bgcolor: isFirst ? 'rgba(168, 85, 247, 0.12)' : 'neutral.800',
                    borderColor: isFirst ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.08)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '14px',
                        color: index === 0 ? 'rgb(168, 85, 247)' : index === 1 ? 'neutral.300' : index === 2 ? 'rgb(192, 132, 252)' : 'neutral.400',
                        border: '1px solid currentColor',
                        background: 'rgba(0,0,0,0.3)'
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography level="title-sm" sx={{ fontWeight: 600, color: isFirst ? 'rgb(216, 180, 254)' : 'common.white' }}>
                      {wizard.username}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography level="body-xs" textColor="neutral.400">Conjurados</Typography>
                      <Typography level="body-sm" textColor="common.white" sx={{ fontWeight: 700 }}>
                        {wizard.spellsCast} magias
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                      <Typography level="body-xs" textColor="neutral.400">Dano Total</Typography>
                      <Typography level="body-sm" sx={{ fontWeight: 700, color: 'rgb(168, 85, 247)' }}>
                        {wizard.totalDamage}
                      </Typography>
                    </Box>
                  </Box>
                </Sheet>
              );
            })}

            {ranking.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, textColor: 'neutral.400' }}>
                Nenhum feitiço foi conjurado nesta sessão.
              </Box>
            )}
          </Stack>
        </Card>

        {/* Back Button */}
        <Button
          variant="solid"
          onClick={onExit}
          size="lg"
          sx={{
            px: 4,
            borderRadius: 'md',
            boxShadow: 'none',
            bgcolor: 'rgb(168, 85, 247)',
            '&:hover': {
              bgcolor: 'rgb(147, 51, 234)',
            }
          }}
        >
          Voltar ao Início
        </Button>
      </Stack>
    </Sheet>
  );
}

export function AdminAnalyticsView({ session, onBack }: { session: SessionResponse; onBack: () => void }) {
  const revealMutation = useRevealResults();
  
  const ranking = session.ranking || [];
  const totalSpells = session.recentCasts.length;
  const totalDamage = session.recentCasts.reduce((acc, cast) => acc + cast.damage, 0);

  // Compute spell stats
  const spellStats = session.recentCasts.reduce((acc: Record<string, { count: number; damage: number, category: string }>, cast) => {
    if (!acc[cast.spellName]) {
      acc[cast.spellName] = { count: 0, damage: 0, category: cast.spellCategory };
    }
    acc[cast.spellName].count += 1;
    acc[cast.spellName].damage += cast.damage;
    return acc;
  }, {});

  const sortedSpells = Object.entries(spellStats).sort((a, b) => b[1].count - a[1].count);

  // Compute category stats
  const categoryStats = session.recentCasts.reduce((acc: Record<string, number>, cast) => {
    acc[cast.spellCategory] = (acc[cast.spellCategory] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.body',
        p: { xs: 2, md: 4 },
        pb: 8
      }}
    >
      <Stack spacing={4} sx={{ maxWidth: 1000, width: '100%', mx: 'auto' }}>
        
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography level="h1" fontWeight="xl">
              Painel de Estatísticas
            </Typography>
            <Typography level="body-md" textColor="text.secondary">
              Relatório de performance da sala <strong>{session.sessionCode}</strong>
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="neutral"
            onClick={onBack}
            startDecorator={<Undo2 size={16} />}
          >
            Voltar
          </Button>
        </Stack>

        {/* Key metrics grid */}
        <Grid container spacing={2}>
          <Grid xs={12} sm={4}>
            <Card variant="outlined">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 'md', background: 'rgba(147, 51, 234, 0.1)', color: 'rgb(168, 85, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={24} />
                </Box>
                <Box>
                  <Typography level="body-xs" textColor="text.tertiary">FEITIÇOS CONJURADOS</Typography>
                  <Typography level="h3" fontWeight="xl">{totalSpells}</Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid xs={12} sm={4}>
            <Card variant="outlined">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 'md', background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(248, 113, 113)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={24} />
                </Box>
                <Box>
                  <Typography level="body-xs" textColor="text.tertiary">DANO TOTAL DEFEITADO</Typography>
                  <Typography level="h3" fontWeight="xl">{totalDamage}</Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid xs={12} sm={4}>
            <Card variant="outlined">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 'md', background: 'rgba(59, 130, 246, 0.1)', color: 'rgb(96, 165, 250)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} />
                </Box>
                <Box>
                  <Typography level="body-xs" textColor="text.tertiary">MAGOS ATIVOS</Typography>
                  <Typography level="h3" fontWeight="xl">{ranking.length}</Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Action Banner: Reveal Results */}
        <Card
          variant="soft"
          color={session.resultsRevealed ? "success" : "primary"}
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Stack spacing={0.5}>
            <Typography level="title-lg" fontWeight="bold">
              {session.resultsRevealed ? 'Resultados Revelados!' : 'Resultados Ocultos para Jogadores'}
            </Typography>
            <Typography level="body-sm" textColor="text.secondary" sx={{ maxWidth: 600 }}>
              {session.resultsRevealed 
                ? 'Os jogadores já conseguem visualizar o ranking geral e a coroação dos melhores magos em suas telas.'
                : 'Os participantes da partida estão aguardando na sala de espera. Clique para revelar os resultados e liberar o pódio de classificação.'
              }
            </Typography>
          </Stack>

          {session.resultsRevealed ? (
            <Button
              variant="solid"
              color="success"
              disabled
              startDecorator={<CheckCircle2 size={18} />}
            >
              Publicado
            </Button>
          ) : (
            <Button
              variant="solid"
              color="primary"
              loading={revealMutation.isPending}
              onClick={() => revealMutation.mutate(session.sessionCode)}
              startDecorator={<Sparkles size={18} />}
            >
              Revelar Resultados
            </Button>
          )}
        </Card>

        {/* Detailed Analytics Grid */}
        <Grid container spacing={3}>
          {/* Left Column: Wizards Ranking */}
          <Grid xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <Typography level="title-md" startDecorator={<Trophy size={18} color="gold" />} sx={{ mb: 2 }}>
                Classificação Geral dos Magos
              </Typography>
              <Stack spacing={1} sx={{ maxHeight: 480, overflowY: 'auto', pr: 1 }}>
                {ranking.map((wizard, idx) => (
                  <Sheet
                    key={wizard.username}
                    variant="soft"
                    sx={{
                      p: 1.5,
                      borderRadius: 'md',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography level="title-sm" fontWeight="bold" sx={{ color: idx < 3 ? 'rgb(192, 132, 252)' : 'neutral.400' }}>
                        #{idx + 1}
                      </Typography>
                      <Typography level="body-sm" fontWeight="bold">{wizard.username}</Typography>
                    </Box>
                    <Stack direction="row" spacing={3}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography level="body-xs" textColor="text.tertiary">Magias</Typography>
                        <Typography level="body-xs" fontWeight="bold">{wizard.spellsCast}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', minWidth: 60 }}>
                        <Typography level="body-xs" textColor="text.tertiary">Dano</Typography>
                        <Typography level="body-xs" fontWeight="bold" sx={{ color: 'rgb(168, 85, 247)' }}>{wizard.totalDamage}</Typography>
                      </Box>
                    </Stack>
                  </Sheet>
                ))}
              </Stack>
            </Card>
          </Grid>

          {/* Right Column: Spells and Categories analytics */}
          <Grid xs={12} md={6}>
            <Stack spacing={3} sx={{ height: '100%' }}>
              {/* Most popular spell */}
              <Card variant="outlined">
                <Typography level="title-md" startDecorator={<Sparkles size={18} />} sx={{ mb: 2 }}>
                  Feitiços Mais Conjurados
                </Typography>
                
                <Stack spacing={2} sx={{ overflowY: 'auto', maxHeight: 200 }}>
                  {sortedSpells.map(([spellName, stats]) => {
                    const normalizedCat = (stats.category || '').trim().toLowerCase().replace('rúnico', 'runico').replace('etéreo', 'etereo');
                    const color = SPELL_CATEGORY_COLORS[normalizedCat as keyof typeof SPELL_CATEGORY_COLORS] || '#70D6FF';
                    return (
                      <Stack key={spellName} spacing={0.5}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography level="body-sm" fontWeight="bold">{spellName}</Typography>
                          <Typography level="body-xs" sx={{ color: color, fontWeight: 600 }}>
                            {stats.count}x ({stats.damage} dano)
                          </Typography>
                        </Stack>
                        <Box sx={{ width: '100%', height: 6, bgcolor: `color-mix(in srgb, ${color} 15%, transparent)`, borderRadius: 'sm', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', bgcolor: color, width: `${(stats.count / Math.max(1, totalSpells)) * 100}%`, borderRadius: 'sm' }} />
                        </Box>
                      </Stack>
                    );
                  })}
                  {sortedSpells.length === 0 && (
                    <Typography level="body-sm" textColor="text.tertiary" textAlign="center" py={2}>
                      Nenhum feitiço foi conjurado.
                    </Typography>
                  )}
                </Stack>
              </Card>

              {/* Spell Category breakdown */}
              <Card variant="outlined">
                <Typography level="title-md" startDecorator={<BarChart3 size={18} />} sx={{ mb: 2 }}>
                  Categorias Populares
                </Typography>

                <Stack spacing={2}>
                  {sortedCategories.map(([category, count]) => {
                    const normalizedCat = (category || '').trim().toLowerCase().replace('rúnico', 'runico').replace('etéreo', 'etereo');
                    const color = SPELL_CATEGORY_COLORS[normalizedCat as keyof typeof SPELL_CATEGORY_COLORS] || '#70D6FF';
                    return (
                      <Stack key={category} spacing={0.5}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography level="body-sm" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                            {category}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: color, fontWeight: 600 }}>{count} conjurações</Typography>
                        </Stack>
                        <Box sx={{ width: '100%', height: 6, bgcolor: `color-mix(in srgb, ${color} 15%, transparent)`, borderRadius: 'sm', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', bgcolor: color, width: `${(count / Math.max(1, totalSpells)) * 100}%`, borderRadius: 'sm' }} />
                        </Box>
                      </Stack>
                    );
                  })}
                  {sortedCategories.length === 0 && (
                    <Typography level="body-sm" textColor="text.tertiary" textAlign="center" py={2}>
                      Nenhuma categoria registrada.
                    </Typography>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Grid>

      </Stack>
    </Box>
  );
}
