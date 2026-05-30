import { Card, Stack, Typography } from '@mui/joy';
import SpellHistoryEntry, { SpellCast } from './SpellHistoryEntry';

interface SpellHistoryListProps {
  recentCasts?: SpellCast[];
}

export default function SpellHistoryList({ recentCasts = [] }: SpellHistoryListProps) {
  const totalCasts = recentCasts.length;

  return (
    <Card variant="outlined" sx={{
      gridArea: 'log',
      borderRadius: "lg",
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 250,
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
          recentCasts.slice().reverse().map((cast, index) => {
            return (
              <SpellHistoryEntry
                key={index}
                cast={cast}
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
