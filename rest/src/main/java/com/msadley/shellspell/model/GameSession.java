package com.msadley.shellspell.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "game_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_code", unique = true, nullable = false)
    private String sessionCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    @Column(name = "crystal_health", nullable = false)
    private int crystalHealth;

    @Column(name = "results_revealed", nullable = false)
    @Builder.Default
    private boolean resultsRevealed = false;

    @Column(name = "max_crystal_health")
    private Integer maxCrystalHealth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_admin_id", nullable = false)
    private User hostAdmin;
}
