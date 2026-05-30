import { Box, Stack } from '@mui/joy';
import { keyframes } from '@emotion/react';
import BossTitle from '../BossTitle';
import BossHealthBar from '../BossHealthBar';
import crystalImg from '../../assets/main_crystal.png';

const floatAnimation = keyframes`
  0% {
    transform: translateY(0px);
    filter: drop-shadow(0 5px 15px rgba(168, 85, 247, 0.4));
  }
  50% {
    transform: translateY(-12px);
    filter: drop-shadow(0 15px 25px rgba(168, 85, 247, 0.75));
  }
  100% {
    transform: translateY(0px);
    filter: drop-shadow(0 5px 15px rgba(168, 85, 247, 0.4));
  }
`;

interface CrystalDisplayProps {
  crystalHealth: number;
  maxHealth: number;
  isCrystalDefeated: boolean;
  layout?: 'title-top' | 'title-bottom';
  titleAlign?: 'left' | 'center';
  maxCrystalHeight?: string | object;
}

export default function CrystalDisplay({
  crystalHealth,
  maxHealth,
  isCrystalDefeated,
  layout = 'title-top',
  titleAlign = 'left',
  maxCrystalHeight = { xs: '40vh', md: '55vh' },
}: CrystalDisplayProps) {
  const titleAndBar = (
    <Stack
      spacing={1}
      sx={{
        width: '100%',
        maxWidth: titleAlign === 'center' ? 500 : { xs: 280, sm: 360, md: 450 },
        textAlign: titleAlign,
      }}
    >
      <BossTitle isCrystalDefeated={isCrystalDefeated} />
      <BossHealthBar crystalHealth={crystalHealth} maxHealth={maxHealth} />
    </Stack>
  );

  const crystalFigure = (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Box
        component="img"
        src={crystalImg}
        alt="Cristal"
        sx={{
          maxWidth: '100%',
          maxHeight: maxCrystalHeight,
          objectFit: 'contain',
          animation: isCrystalDefeated
            ? 'none'
            : `${floatAnimation} 4s ease-in-out infinite`,
          filter: isCrystalDefeated
            ? 'grayscale(100%) opacity(0.3)'
            : undefined,
          transition: 'filter 1s ease, opacity 1s ease',
        }}
      />
    </Box>
  );

  return (
    <Stack
      spacing={3}
      alignItems={titleAlign === 'center' ? 'center' : 'stretch'}
      justifyContent={titleAlign === 'center' ? 'center' : 'flex-start'}
      sx={{ flex: 1, width: '100%' }}
    >
      {layout === 'title-top' ? (
        <>
          {titleAndBar}
          {crystalFigure}
        </>
      ) : (
        <>
          {crystalFigure}
          {titleAndBar}
        </>
      )}
    </Stack>
  );
}
