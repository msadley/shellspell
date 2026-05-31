import { Box, Sheet, Stack, Typography } from '@mui/joy';
import { keyframes } from '@emotion/react';
import { 
  Sparkles, 
  Hexagon, 
  Flame, 
  Wind, 
  Moon, 
  HelpCircle 
} from 'lucide-react';
import { SPELL_CATEGORY_COLORS } from '../../constants/spells';

export interface SpellCast {
  damage: number;
  spellName: string;
  spellCategory: string;
  username?: string;
  castAtTime?: string;
}

interface SpellHistoryEntryProps {
  cast: SpellCast;
  showCastBy?: boolean;
}

const slideInAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translateX(40px);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  }
  50% {
    box-shadow: 0 0 15px var(--glow-color);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    box-shadow: none;
  }
`;

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  arcano: Sparkles,
  runico: Hexagon,
  primal: Flame,
  etereo: Wind,
  umbral: Moon,
};

export default function SpellHistoryEntry({ cast, showCastBy = true }: SpellHistoryEntryProps) {
  const normalizedCat = (cast.spellCategory || '').trim().toLowerCase().replace('rúnico', 'runico').replace('etéreo', 'etereo');
  const color = SPELL_CATEGORY_COLORS[normalizedCat as keyof typeof SPELL_CATEGORY_COLORS] || "#777777";
  const IconComponent = CATEGORY_ICONS[normalizedCat] || HelpCircle;

  return (
    <Sheet
      variant="soft"
      sx={{
        p: 1.5,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderRadius: 'sm',
        borderLeft: `3px solid ${color}`,
        bgcolor: '#000000',
        '--glow-color': color,
        animation: `${slideInAnimation} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
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
          border: `1px solid ${color}`,
          flexShrink: 0,
        }}
      >
        {cast.damage}
      </Box>

      {/* Category Icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IconComponent size={18} color={color} style={{ opacity: 0.9 }} />
      </Box>

      {/* Spell info */}
      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography 
          level="body-sm" 
          sx={{ 
            fontWeight: 600, 
            color: 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {cast.spellName}
        </Typography>
        {showCastBy && cast.username && (
          <Typography 
            level="body-xs" 
            sx={{ 
              color: 'neutral.500', 
              fontSize: '10px',
              fontWeight: 500 
            }}
          >
            conjurado por {cast.username}
          </Typography>
        )}
      </Stack>
    </Sheet>
  );
}

