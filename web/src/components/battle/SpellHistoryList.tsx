import { Card, Stack, Typography } from '@mui/joy';
import SpellHistoryEntry, { SpellCast } from './SpellHistoryEntry';

interface SpellHistoryListProps {
  recentCasts?: SpellCast[];
  showCastBy?: boolean;
}

export default function SpellHistoryList({ recentCasts = [], showCastBy = true }: SpellHistoryListProps) {
  const totalCasts = recentCasts.length;

  return (
    <Card variant="outlined" sx={{
      gridArea: 'log',
      borderRadius: "lg",
      height: '100%',
      overflow: 'hidden',
      display: { xs: 'none', md: 'flex' },
      flexDirection: 'column',
      maxWidth: 300,
      width: '100%',
      justifySelf: 'end'
    }}>
      <Typography
        level="title-md"
        sx={{
          color: "white",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          pb: 1,
          fontWeight: 700,
          mb: 2,
        }}
      >
        Histórico de Magias
      </Typography>

      <Stack spacing={1} sx={{
        flex: 1,
        overflowY: 'auto',
        pb: 2
      }}>
        {totalCasts > 0 ? (
          [...recentCasts]
            .sort((a, b) => (a.castAtTime || '').localeCompare(b.castAtTime || ''))
            .reverse()
            .map((cast, index) => {
              const uniqueKey = cast.castAtTime
                ? `${cast.castAtTime}-${cast.username || ''}-${cast.spellName}`
                : `${totalCasts - 1 - index}-${cast.spellName}`;
              return (
                <SpellHistoryEntry
                  key={uniqueKey}
                  cast={cast}
                  showCastBy={showCastBy}
                />
              );
            })
        ) : (
          <Typography level="body-sm" sx={{ 
            color: 'neutral.500', 
            fontStyle: 'italic', 
            textAlign: 'center', 
            mt: 4 
          }}>
            Nenhuma magia conjurada ainda nesta sessão.
          </Typography>
        )}
      </Stack>
    </Card>
  );
}
