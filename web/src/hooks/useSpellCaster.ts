import { useState } from 'react';
import { useCastSpell } from './useSession';

export function useSpellCaster(
  sessionCode: string | undefined,
  onVictory: () => void
) {
  const castSpellMutation = useCastSpell();
  const [spellInput, setSpellInput] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  const handleCastSpellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode) return;
    setFeedback(null);
    const spellNameTrimmed = spellInput.trim();
  
    if (!spellNameTrimmed) return;
  
    try {
      const res = await castSpellMutation.mutateAsync({
        code: sessionCode,
        spellName: spellNameTrimmed,
      });
  
      setSpellInput('');
      setFeedback({ 
        success: true, 
        text: `Sucesso! Você lançou ${res.spellName} e causou ${res.damageDealt} de dano!` 
      });
  
      if (res.remainingCrystalHealth <= 0) {
        onVictory();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao lançar feitiço.';
      setFeedback({ success: false, text: msg });
    }
  };

  return {
    spellInput,
    setSpellInput,
    feedback,
    setFeedback,
    isPending: castSpellMutation.isPending,
    castSpell: handleCastSpellSubmit,
  };
}
