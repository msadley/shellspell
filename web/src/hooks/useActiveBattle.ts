import { useState, useEffect } from 'react';
import { useSession } from './useSession';

export function useActiveBattle(code: string | undefined) {
  const query = useSession(code);
  const session = query.data;

  const [showVictory, setShowVictory] = useState(false);

  useEffect(() => {
    if (session && session.crystalHealth <= 0) {
      setShowVictory(true);
    }
  }, [session]);

  const crystalHealth = session?.crystalHealth ?? 0;
  const maxHealth = session?.maxCrystalHealth ?? null;
  const recentCasts = session?.recentCasts ?? [];
  const isCrystalDefeated = crystalHealth <= 0;

  return {
    ...query,
    session,
    maxHealth,
    showVictory,
    setShowVictory,
    crystalHealth,
    recentCasts,
    isCrystalDefeated,
  };
}
