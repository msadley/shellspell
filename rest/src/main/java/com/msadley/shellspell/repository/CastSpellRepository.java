package com.msadley.shellspell.repository;

import com.msadley.shellspell.model.CastSpell;
import com.msadley.shellspell.model.GameSession;
import com.msadley.shellspell.model.User;
import com.msadley.shellspell.model.Spell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface CastSpellRepository extends JpaRepository<CastSpell, Long> {
    boolean existsByUserAndGameSessionAndSpell(User user, GameSession gameSession, Spell spell);

    List<CastSpell> findByGameSession(GameSession gameSession);

    @org.springframework.data.jpa.repository.Query("SELECT cs FROM CastSpell cs JOIN FETCH cs.user JOIN FETCH cs.spell WHERE cs.gameSession = :gameSession ORDER BY cs.id ASC")
    List<CastSpell> findByGameSessionWithUserAndSpell(@org.springframework.data.repository.query.Param("gameSession") GameSession gameSession);

    @Modifying
    @Transactional
    void deleteByGameSession(GameSession gameSession);

    @Modifying
    @Transactional
    void deleteBySpell(Spell spell);
}
