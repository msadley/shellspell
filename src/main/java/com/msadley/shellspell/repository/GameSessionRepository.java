package com.msadley.shellspell.repository;

import com.msadley.shellspell.model.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    Optional<GameSession> findBySessionCode(String sessionCode);
    boolean existsBySessionCode(String sessionCode);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("UPDATE GameSession g SET " +
           "g.dragonHealth = CASE WHEN (g.dragonHealth - :damage) < 0 THEN 0 ELSE (g.dragonHealth - :damage) END, " +
           "g.status = CASE WHEN (g.dragonHealth - :damage) <= 0 THEN com.msadley.shellspell.model.SessionStatus.FINISHED ELSE g.status END " +
           "WHERE g.sessionCode = :code AND g.status = com.msadley.shellspell.model.SessionStatus.ACTIVE")
    int applyDamage(@Param("code") String code, @Param("damage") int damage);
}
