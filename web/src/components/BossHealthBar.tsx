import { useState, useEffect, useRef } from "react";
import { Box, Typography } from "@mui/joy";

interface BossHealthBarProps {
  crystalHealth: number;
  maxHealth: number;
}

export default function BossHealthBar({
  crystalHealth,
  maxHealth,
}: BossHealthBarProps) {
  const [delayedHealth, setDelayedHealth] = useState(crystalHealth);
  const prevHealthRef = useRef(crystalHealth);

  const healthPercentage = maxHealth
    ? Math.max(0, (crystalHealth / maxHealth) * 100)
    : 100;

  const delayedPercentage = maxHealth
    ? Math.max(0, (delayedHealth / maxHealth) * 100)
    : 100;

  useEffect(() => {
    if (crystalHealth !== prevHealthRef.current) {
      if (crystalHealth < prevHealthRef.current) {
        // Damage taken: delay the background bar depletion
        const timer = setTimeout(() => {
          setDelayedHealth(crystalHealth);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        // Healing: catch up immediately
        setDelayedHealth(crystalHealth);
      }
      prevHealthRef.current = crystalHealth;
    }
  }, [crystalHealth]);

  const isDamagePending = crystalHealth < delayedHealth;

  // Main bar reduces immediately on damage (none)
  // and animates smoothly over 0.4s during healing.
  const crimsonTransition = isDamagePending
    ? "none"
    : "width 0.4s ease-out";

  // Background bar drains slowly over 0.8s after damage
  // and matches the foreground speed (0.4s) during healing to prevent reveal.
  const delayedTransition = isDamagePending
    ? "width 0.8s ease-out"
    : "width 0.4s ease-out";

  return (
    <Box sx={{ width: "100%" }}>
      {/* Main crude health bar frame */}
      <Box
        sx={{
          width: "100%",
          position: "relative",
          height: 10,
          backgroundColor: "#0a0a0a", // Near-black background
          border: "1px solid #383025", // Dark, weathered metallic/bronze frame
          borderRadius: "md", // Restored rounded corners
          overflow: "hidden",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Dark crimson delayed-damage catch-up bar */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${delayedPercentage}%`,
            backgroundColor: "#4a0606", // Dark blood crimson
            transition: delayedTransition,
          }}
        />

        {/* Deep crimson blood-red health bar */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${healthPercentage}%`,
            backgroundColor: "#8a0c0c", // Dark crimson red
            transition: crimsonTransition,
          }}
        />
      </Box>

      {/* HP text at the bottom left of the bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          mt: "4px",
          pl: "2px",
        }}
      >
        <Typography
          level="body-xs"
          sx={{
            color: "#a39e93", // Soft ash bone color
            letterSpacing: "0.08em",
            fontWeight: 700,
            textShadow: "1px 1px 1px rgba(0,0,0,0.8)",
            userSelect: "none",
          }}
        >
          {crystalHealth} / {maxHealth || crystalHealth}
        </Typography>
      </Box>
    </Box>
  );
}

