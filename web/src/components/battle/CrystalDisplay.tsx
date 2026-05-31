import { useState, useEffect, useRef } from 'react';
import { Box, Stack } from '@mui/joy';
import { keyframes } from '@emotion/react';
import BossTitle from '../BossTitle';
import BossHealthBar from '../BossHealthBar';
import crystalImg from '../../assets/main_crystal.png';
import crystalShardsImg from '../../assets/crystal_shards.png';
import crystalShardsFrontImg from '../../assets/crystal_shards_front.png';

const floatAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const shardsFloatAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-24px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const frontShardsFloatAnimation = keyframes`
  0% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(3deg);
  }
  100% {
    transform: translateY(0px) rotate(0deg);
  }
`;

const glowPulseAnimation = keyframes`
  0% {
    transform: scale(0.9);
    opacity: 0.45;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.85;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.45;
  }
`;

const shakeAnimation = keyframes`
  0% { transform: translate(0, 0) rotate(0deg); }
  10% { transform: translate(-4px, 3px) rotate(-1deg); }
  20% { transform: translate(3px, -2px) rotate(1deg); }
  30% { transform: translate(-3px, -3px) rotate(0deg); }
  40% { transform: translate(2px, 2px) rotate(1deg); }
  55% { transform: translate(-1px, -1px) rotate(-1deg); }
  70% { transform: translate(2px, -2px) rotate(0deg); }
  85% { transform: translate(-2px, 1px) rotate(1deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
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
  const [isDamaged, setIsDamaged] = useState(false);
  const prevHealthRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wasTriggeredRef = useRef(false);

  useEffect(() => {
    if (prevHealthRef.current !== null && crystalHealth < prevHealthRef.current) {
      setIsDamaged(true);
      const timer = setTimeout(() => setIsDamaged(false), 500);

      return () => {
        clearTimeout(timer);
      };
    }
    prevHealthRef.current = crystalHealth;
  }, [crystalHealth]);

  const triggerShatter = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const particles: any[] = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      const size = 3 + Math.random() * 9;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      
      const numPoints = 3 + Math.floor(Math.random() * 3);
      const points = [];
      for (let j = 0; j < numPoints; j++) {
        const pAngle = (j / numPoints) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        const r = size * (0.5 + Math.random() * 0.5);
        points.push({
          x: Math.cos(pAngle) * r,
          y: Math.sin(pAngle) * r
        });
      }

      const hue = 265 + Math.floor(Math.random() * 35);
      const saturation = 90 + Math.floor(Math.random() * 10);
      const lightness = 50 + Math.floor(Math.random() * 20);

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1 + Math.random() * 2.5),
        points,
        color: `hsla(${hue}, ${saturation}%, ${lightness}%, OPACITY)`,
        opacity: 1,
        fadeSpeed: 0.007 + Math.random() * 0.010,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() * 0.08 - 0.04)
      });
    }

    let animationFrameId: number;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let activeParticles = 0;

      particles.forEach((p) => {
        if (p.opacity <= 0) return;

        activeParticles++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // gravity
        p.rot += p.spin;
        p.opacity -= p.fadeSpeed;

        if (p.opacity < 0) p.opacity = 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(p.points[0].x, p.points[0].y);
        for (let j = 1; j < p.points.length; j++) {
          ctx.lineTo(p.points[j].x, p.points[j].y);
        }
        ctx.closePath();
        
        ctx.fillStyle = p.color.replace('OPACITY', p.opacity.toString());
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(168, 85, 247, ${p.opacity})`;
        ctx.fill();
        ctx.restore();
      });

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (isCrystalDefeated && !wasTriggeredRef.current) {
      wasTriggeredRef.current = true;
      cleanup = triggerShatter();
    } else if (!isCrystalDefeated) {
      wasTriggeredRef.current = false;
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [isCrystalDefeated]);

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
      ref={containerRef}
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Shatter Canvas overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Shake & Flash Wrapper */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          animation: isDamaged ? `${shakeAnimation} 0.4s ease-in-out` : 'none',
          filter: isDamaged
            ? 'drop-shadow(0 0 35px rgba(168, 85, 247, 0.95)) brightness(1.4)'
            : undefined,
          transition: isDamaged ? 'none' : 'filter 0.5s ease-out',
        }}
      >
        {/* Background Glow */}
        {!isCrystalDefeated && (
          <Box
            sx={{
              position: 'absolute',
              width: { xs: '220px', md: '340px' },
              height: { xs: '220px', md: '340px' },
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.55) 0%, rgba(168, 85, 247, 0) 70%)',
              filter: 'blur(20px)',
              animation: `${glowPulseAnimation} 5s ease-in-out infinite`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        {/* Background Crystal Shards */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <Box
            component="img"
            src={crystalShardsImg}
            alt="Crystal Shards"
            sx={{
              maxWidth: '100%',
              maxHeight: maxCrystalHeight,
              objectFit: 'contain',
              animation: isCrystalDefeated
                ? 'none'
                : `${shardsFloatAnimation} 6s ease-in-out infinite`,
              filter: isCrystalDefeated
                ? 'grayscale(100%) opacity(0.3)'
                : undefined,
              opacity: isCrystalDefeated ? 0 : 1,
              transition: 'opacity 0.3s ease, filter 1s ease',
            }}
          />
        </Box>

        {/* Main Crystal */}
        <Box
          component="img"
          src={crystalImg}
          alt="Cristal"
          sx={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '100%',
            maxHeight: maxCrystalHeight,
            objectFit: 'contain',
            animation: isCrystalDefeated
              ? 'none'
              : `${floatAnimation} 4s ease-in-out infinite`,
            filter: isCrystalDefeated
              ? 'grayscale(100%) opacity(0.3)'
              : undefined,
            opacity: isCrystalDefeated ? 0 : 1,
            transition: 'opacity 0.3s ease, filter 1s ease',
          }}
        />

        {/* Foreground Crystal Shards */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <Box
            component="img"
            src={crystalShardsFrontImg}
            alt="Crystal Shards Front"
            sx={{
              maxWidth: '100%',
              maxHeight: maxCrystalHeight,
              objectFit: 'contain',
              animation: isCrystalDefeated
                ? 'none'
                : `${frontShardsFloatAnimation} 8s ease-in-out infinite`,
              filter: isCrystalDefeated
                ? 'grayscale(100%) opacity(0.3)'
                : undefined,
              opacity: isCrystalDefeated ? 0 : 1,
              transition: 'opacity 0.3s ease, filter 1s ease',
            }}
          />
        </Box>
      </Box>

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
