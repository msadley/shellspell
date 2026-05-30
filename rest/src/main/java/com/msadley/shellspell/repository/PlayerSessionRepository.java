package com.msadley.shellspell.repository;

import com.msadley.shellspell.model.PlayerSession;
import com.msadley.shellspell.model.GameSession;
import com.msadley.shellspell.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface PlayerSessionRepository extends JpaRepository<PlayerSession, Long> {
    boolean existsByUserAndGameSession(User user, GameSession gameSession);

    List<PlayerSession> findByGameSession(GameSession gameSession);

    @org.springframework.data.jpa.repository.Query("SELECT ps FROM PlayerSession ps JOIN FETCH ps.user WHERE ps.gameSession = :gameSession")
    List<PlayerSession> findByGameSessionWithUser(@org.springframework.data.repository.query.Param("gameSession") GameSession gameSession);

    @Modifying
    @Transactional
    void deleteByGameSession(GameSession gameSession);
}
