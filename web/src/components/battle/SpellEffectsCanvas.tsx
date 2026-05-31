import { useEffect, useRef } from 'react';
import { SPELL_CATEGORY_COLORS } from '../../constants/spells';

export interface SpellCast {
  damage: number;
  spellName: string;
  spellCategory: string;
  username?: string;
  castAtTime?: string;
}

interface SpellEffectsCanvasProps {
  recentCasts: SpellCast[];
  username?: string;
  isAdmin?: boolean;
}

interface ActiveLightning {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  category: string;
  startTime: number;
  duration: number;
  displacement: number;
  points: { x: number; y: number }[];
}

interface VignetteFlash {
  color: string;
  opacity: number;
  startTime: number;
  duration: number;
}

interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

// Subdivide line for jagged electric look
function generateLightningPoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  displacement: number,
  minSegmentLength: number = 8
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];

  function subdivide(x1: number, y1: number, x2: number, y2: number, disp: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minSegmentLength) {
      points.push({ x: x1, y: y1 });
      return;
    }

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Perpendicular vector
    const perpX = -dy / dist;
    const perpY = dx / dist;

    // Random displacement
    const offset = (Math.random() - 0.5) * disp;
    const mx = midX + perpX * offset;
    const my = midY + perpY * offset;

    subdivide(x1, y1, mx, my, disp / 2);
    subdivide(mx, my, x2, y2, disp / 2);
  }

  subdivide(startX, startY, endX, endY, displacement);
  points.push({ x: endX, y: endY });

  // Sort points by distance from start to make sure rendering order is correct
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / len;
  const dirY = dy / len;

  return points.sort((a, b) => {
    const projA = (a.x - startX) * dirX + (a.y - startY) * dirY;
    const projB = (b.x - startX) * dirX + (b.y - startY) * dirY;
    return projA - projB;
  });
}

// Geometric straight neon-grid steps for Runic
function generateRunicPoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
  const dx = endX - startX;
  const dy = endY - startY;

  let cx = startX;
  let cy = startY;
  const steps = 5;

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    // Alternate horizontal and vertical steps
    if (i % 2 === 1) {
      cx = startX + dx * t;
    } else {
      cy = startY + dy * t;
    }
    points.push({ x: cx, y: cy });
  }

  points.push({ x: endX, y: endY });
  return points;
}

export default function SpellEffectsCanvas({
  recentCasts,
  username,
  isAdmin = false,
}: SpellEffectsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeLightningsRef = useRef<ActiveLightning[]>([]);
  const vignetteFlashRef = useRef<VignetteFlash | null>(null);
  const embersRef = useRef<EmberParticle[]>([]);
  const prevCastsLength = useRef<number>(recentCasts.length);
  const animationFrameId = useRef<number>(0);
  const isLoopRunningRef = useRef(false);
  const renderRef = useRef<(() => void) | null>(null);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Listen to new casts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sortedCasts = [...recentCasts].sort((a, b) =>
      (a.castAtTime || '').localeCompare(b.castAtTime || '')
    );

    if (sortedCasts.length > prevCastsLength.current) {
      const newCastsCount = sortedCasts.length - prevCastsLength.current;
      const newCasts = sortedCasts.slice(sortedCasts.length - newCastsCount);

      newCasts.forEach((cast) => {
        // 1. Find Target (Crystal)
        const crystalImg = document.querySelector('img[alt="Cristal"]');
        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight * 0.45;

        if (crystalImg) {
          const rect = crystalImg.getBoundingClientRect();
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;
        }

        // 2. Find Source (Caster input or Admin list row)
        let sourceX = window.innerWidth / 2;
        let sourceY = window.innerHeight;

        if (isAdmin) {
          // Shoot from the player's card/row on the left
          const cleanName = cast.username?.replace(/[^a-zA-Z0-9-_]/g, '');
          const playerRow = document.querySelector(`[data-player="${cast.username}"], .player-row-${cleanName}`);
          if (playerRow) {
            const rect = playerRow.getBoundingClientRect();
            sourceX = rect.right;
            sourceY = rect.top + rect.height / 2;
          } else {
            // Random point on left border
            sourceX = 0;
            sourceY = window.innerHeight * (0.2 + Math.random() * 0.6);
          }
        } else {
          // If cast by current user, shoot from input, otherwise shoot from screen edges
          const isMe = cast.username === username;
          if (isMe) {
            const inputForm = document.querySelector('form');
            if (inputForm) {
              const rect = inputForm.getBoundingClientRect();
              sourceX = rect.left + rect.width / 2;
              sourceY = rect.top;
            }
          } else {
            // Always originate from the top part
            sourceY = 0;
            // Limit the origin X coordinate to achieve a maximum of 90 degrees of appearance (cone)
            // relative to the horizontal top line. To ensure the angle is between 45 and 135 degrees,
            // the horizontal distance from targetX must be at most targetY.
            const minX = targetX - targetY;
            const maxX = targetX + targetY;
            const randomX = minX + Math.random() * (maxX - minX);
            sourceX = Math.max(0, Math.min(window.innerWidth, randomX));
          }
        }

        const normalizedCat = (cast.spellCategory || '').trim().toLowerCase().replace('rúnico', 'runico').replace('etéreo', 'etereo');
        const color = SPELL_CATEGORY_COLORS[normalizedCat as keyof typeof SPELL_CATEGORY_COLORS] || '#70D6FF';

        // 3. Trigger Lightning Bolt
        const boltId = `${Date.now()}-${Math.random()}`;
        const duration = 250; // duration in ms

        activeLightningsRef.current.push({
          id: boltId,
          startX: sourceX,
          startY: sourceY,
          endX: targetX,
          endY: targetY,
          color,
          category: normalizedCat,
          startTime: Date.now(),
          duration,
          displacement: 35,
          points: [], // Will generate dynamically on each frame to crackle
        });

        // 4. Trigger Vignette Flash
        vignetteFlashRef.current = {
          color,
          opacity: 0.25,
          startTime: Date.now(),
          duration: 350,
        };

        // 5. Spawn Elemental Embers at impact point
        const emberCount = normalizedCat === 'primal' ? 25 : 12;
        for (let i = 0; i < emberCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 3.5;
          embersRef.current.push({
            x: targetX,
            y: targetY,
            vx: Math.cos(angle) * speed,
            vy: normalizedCat === 'primal' 
              ? Math.sin(angle) * speed - 1.5 // float up
              : Math.sin(angle) * speed,
            color,
            size: 2 + Math.random() * 3,
            alpha: 1.0,
            life: 0,
            maxLife: 20 + Math.floor(Math.random() * 25),
          });
        }
      });

      // If loop is not running, start it
      if (!isLoopRunningRef.current && renderRef.current) {
        isLoopRunningRef.current = true;
        renderRef.current();
      }
    }

    prevCastsLength.current = sortedCasts.length;
  }, [recentCasts, username, isAdmin]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- 1. RENDER SCREEN VIGNETTE FLASH ---
      const flash = vignetteFlashRef.current;
      if (flash) {
        const elapsed = now - flash.startTime;
        const progress = elapsed / flash.duration;

        if (progress >= 1) {
          vignetteFlashRef.current = null;
        } else {
          // Ease out opacity
          const currentOpacity = flash.opacity * (1 - progress);
          const hexColor = flash.color;

          // Convert hex to rgb
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);

          const grad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.4,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
          );
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${currentOpacity})`);

          ctx.save();
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
      }

      // --- 2. RENDER ACTIVE LIGHTNING RAYS ---
      activeLightningsRef.current = activeLightningsRef.current.filter((bolt) => {
        const elapsed = now - bolt.startTime;
        const progress = elapsed / bolt.duration;

        if (progress >= 1) return false;

        ctx.save();

        // High frequency flicker (only draw on some frames to simulate electricity)
        const isDrawingFrame = Math.random() > 0.08;

        if (isDrawingFrame) {
          const startX = bolt.startX;
          const startY = bolt.startY;
          const endX = bolt.endX;
          const endY = bolt.endY;

          // Category drawing style
          if (bolt.category === 'runico') {
            // Neon cyan geometric path
            const points = generateRunicPoints(startX, startY, endX, endY);
            
            // Neon Glow Pass
            ctx.shadowBlur = 12;
            ctx.shadowColor = bolt.color;
            ctx.strokeStyle = bolt.color;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.stroke();

            // Inner Core Pass
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.stroke();

          } else if (bolt.category === 'arcano') {
            // Arcane Helix: A wavy central line with spirals
            const dx = endX - startX;
            const dy = endY - startY;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            ctx.translate(startX, startY);
            ctx.rotate(angle);

            // Purple helix path
            const timeOffset = (now / 40) % (Math.PI * 2);
            ctx.shadowBlur = 10;
            ctx.shadowColor = bolt.color;
            
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = bolt.color;

            // Spiral 1
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
              const t = i / 40;
              const x = len * t;
              const y = Math.sin(t * Math.PI * 6 + timeOffset) * 14 * (1 - t * 0.4);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Spiral 2 (opposite phase)
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
              const t = i / 40;
              const x = len * t;
              const y = -Math.sin(t * Math.PI * 6 + timeOffset) * 14 * (1 - t * 0.4);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Center glow core
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

          } else if (bolt.category === 'umbral') {
            // Shadow tendril: smooth wobbly wavy curves
            const dx = endX - startX;
            const dy = endY - startY;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            ctx.translate(startX, startY);
            ctx.rotate(angle);

            const amp = 20 * Math.sin(now / 80);
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#4B0082'; // Deep purple glow
            ctx.strokeStyle = bolt.color; // Dark gray
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';

            ctx.beginPath();
            for (let i = 0; i <= 20; i++) {
              const t = i / 20;
              const x = len * t;
              const y = Math.sin(t * Math.PI * 2.5) * amp * (1 - t * 0.7);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Dark void inner core
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#111116';
            ctx.lineWidth = 2.0;
            ctx.stroke();

          } else {
            // Ethereal (Sky blue classic branching) or Primal (Orange fiery forks)
            const points = generateLightningPoints(startX, startY, endX, endY, bolt.displacement);

            // Glow Base Pass
            ctx.shadowBlur = 15;
            ctx.shadowColor = bolt.color;
            ctx.strokeStyle = bolt.color;
            ctx.lineWidth = bolt.category === 'primal' ? 5 : 3.5;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.stroke();

            // Inner Core Pass
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Ethereal Category: Add secondary branches
            if (bolt.category === 'etereo') {
              ctx.strokeStyle = bolt.color;
              ctx.lineWidth = 1.0;
              
              // Draw 2 small branch offshoots
              const branchIndex1 = Math.floor(points.length * 0.35);
              const branchIndex2 = Math.floor(points.length * 0.65);

              [branchIndex1, branchIndex2].forEach((idx) => {
                if (idx < points.length) {
                  const pt = points[idx];
                  const bx = pt.x + (Math.random() - 0.5) * 80;
                  const by = pt.y + 40 + Math.random() * 50;
                  
                  const branchPoints = generateLightningPoints(pt.x, pt.y, bx, by, 15, 12);
                  ctx.beginPath();
                  ctx.moveTo(branchPoints[0].x, branchPoints[0].y);
                  branchPoints.forEach((bp) => ctx.lineTo(bp.x, bp.y));
                  ctx.stroke();
                }
              });
            }

            // Primal Category: Add secondary overlay bolt for double flash
            if (bolt.category === 'primal') {
              const points2 = generateLightningPoints(startX, startY, endX, endY, bolt.displacement * 1.3);
              ctx.strokeStyle = '#FFD166'; // Yellow spark
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(points2[0].x, points2[0].y);
              points2.forEach((p) => ctx.lineTo(p.x, p.y));
              ctx.stroke();
            }
          }
        }

        ctx.restore();
        return true;
      });

      // --- 3. RENDER ELEMENTAL EMBERS/PARTICLES AT IMPACT ---
      embersRef.current = embersRef.current.filter((ember) => {
        ember.x += ember.vx;
        ember.y += ember.vy;
        ember.life++;
        ember.alpha = 1.0 - ember.life / ember.maxLife;

        if (ember.life >= ember.maxLife) return false;

        ctx.save();
        ctx.globalAlpha = ember.alpha;
        ctx.fillStyle = ember.color;
        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      });

      // Check if we have active elements
      const hasActiveElements = 
        activeLightningsRef.current.length > 0 || 
        vignetteFlashRef.current !== null || 
        embersRef.current.length > 0;

      if (!hasActiveElements) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isLoopRunningRef.current = false;
        return;
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    renderRef.current = render;

    // Start loop if there are already active elements (e.g. on mount/remount)
    const hasActiveElements = 
      activeLightningsRef.current.length > 0 || 
      vignetteFlashRef.current !== null || 
      embersRef.current.length > 0;
    if (hasActiveElements) {
      isLoopRunningRef.current = true;
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      renderRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
