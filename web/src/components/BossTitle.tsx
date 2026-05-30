import { useEffect, useState } from 'react';
import { Typography, TypographyProps } from '@mui/joy';

interface BossTitleProps extends TypographyProps {
  isCrystalDefeated: boolean;
}

export default function BossTitle({ isCrystalDefeated, sx, ...props }: BossTitleProps) {
  const originalName = "Alma Aprisionada de Xyl'thul";
  const [bossName, setBossName] = useState(originalName);

  useEffect(() => {
    if (isCrystalDefeated) {
      setBossName("CRISTAL DESTRUÍDO");
      return;
    }

    const glyphs = "!@#$%^&*()_+-=[]{}|;':\",./<>?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runCycle = (state: 'glitch' | 'reveal', cycleEndTime: number) => {
      if (!active) return;

      const now = Date.now();

      if (state === 'glitch') {
        if (now >= cycleEndTime) {
          // Transition to reveal phase (original name is legible)
          setBossName(originalName);
          // Reveal duration: 200ms to 300ms
          const revealDuration = Math.random() * 100 + 200;
          timeoutId = setTimeout(() => {
            // Glitch duration: 2500ms to 3000ms
            const glitchDuration = Math.random() * 500 + 2500;
            runCycle('glitch', Date.now() + glitchDuration);
          }, revealDuration);
        } else {
          // Chaotic glitch frame: partial substitution
          const scrambled = originalName
            .split("")
            .map((char) => {
              if (char === " ") return " ";
              // 15% chance of random glyph, 85% chance of original character
              return Math.random() < 0.15
                ? glyphs[Math.floor(Math.random() * glyphs.length)]
                : char;
            })
            .join("");
          setBossName(scrambled);

          // Stuttering delay: 20ms to 120ms
          const nextFrameDelay = Math.random() * 100 + 20;
          timeoutId = setTimeout(() => {
            runCycle('glitch', cycleEndTime);
          }, nextFrameDelay);
        }
      }
    };

    // Start the cycle with initial glitch phase
    const initialGlitchDuration = Math.random() * 500 + 2500;
    runCycle('glitch', Date.now() + initialGlitchDuration);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [isCrystalDefeated]);

  return (
    <Typography
      level="h3"
      sx={{
        color: isCrystalDefeated ? 'neutral.500' : 'text.primary',
        fontWeight: 800,
        letterSpacing: '0.05em',
        fontFamily: 'monospace',
        ...sx,
      }}
      {...props}
    >
      {bossName}
    </Typography>
  );
}
