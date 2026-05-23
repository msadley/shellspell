package com.msadley.shellspell.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "player_sessions",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "game_session_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_session_id", nullable = false)
    private GameSession gameSession;
}
