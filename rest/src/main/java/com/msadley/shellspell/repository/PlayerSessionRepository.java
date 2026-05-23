package com.msadley.shellspell.repository;

import com.msadley.shellspell.model.PlayerSession;
import com.msadley.shellspell.model.GameSession;
import com.msadley.shellspell.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerSessionRepository extends JpaRepository<PlayerSession, Long> {
    boolean existsByUserAndGameSession(User user, GameSession gameSession);
}
