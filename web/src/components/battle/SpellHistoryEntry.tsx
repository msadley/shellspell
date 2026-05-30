import { Box, Sheet, Stack, Typography } from '@mui/joy';
import { SPELL_CATEGORY_COLORS } from '../../constants/spells';

export interface SpellCast {
  damage: number;
  spellName: string;
  spellCategory: string;
}

interface SpellHistoryEntryProps {
  cast: SpellCast;
}

export default function SpellHistoryEntry({ cast }: SpellHistoryEntryProps) {
  const color = SPELL_CATEGORY_COLORS[cast.spellCategory as keyof typeof SPELL_CATEGORY_COLORS] || "#777777";

  return (
    <Sheet
      variant="soft"
      sx={{
        p: 1.5,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 'sm',
        borderLeft: `2px solid ${color}`,
        '&:hover': {
          bgcolor: 'background.level2'
        }
      }}
    >
      {/* Damage indicator */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          background: 'background.surface',
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          border: `1px solid ${color}`
        }}
      >
        {cast.damage}
      </Box>

      {/* Spell info */}
      <Stack sx={{ flexGrow: 1 }}>
        <Typography level="body-sm" sx={{ fontWeight: 600 }}>
          {cast.spellName}
        </Typography>
      </Stack>
    </Sheet>
  );
}
