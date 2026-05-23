package com.msadley.shellspell.repository;

import com.msadley.shellspell.model.CastSpell;
import com.msadley.shellspell.model.GameSession;
import com.msadley.shellspell.model.User;
import com.msadley.shellspell.model.Spell;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CastSpellRepository extends JpaRepository<CastSpell, Long> {
    boolean existsByUserAndGameSessionAndSpell(User user, GameSession gameSession, Spell spell);
}
