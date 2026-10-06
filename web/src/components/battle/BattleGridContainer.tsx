import { Box, BoxProps } from '@mui/joy';
import dungeonBg from '../../assets/dungeon.jpg';

interface BattleGridContainerProps extends BoxProps {
  children: React.ReactNode;
}

export default function BattleGridContainer({ children, sx, ...props }: BattleGridContainerProps) {
  return (
    <Box
      {...props}
      sx={{
        minHeight: '100vh',
        height: '100vh',
        maxHeight: '100vh',
        boxSizing: 'border-box',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${dungeonBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: 'grid',
        color: 'white',
        overflow: 'hidden',
        p: { xs: 1, md: 2 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
