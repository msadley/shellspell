package com.msadley.shellspell.dto;

import com.msadley.shellspell.model.SessionStatus;
import java.util.List;

public record SessionResponse(
    String sessionCode,
    SessionStatus status,
    int crystalHealth,
    int maxCrystalHealth,
    String hostAdminUsername,
    List<String> players,
    List<CastSpellDto> recentCasts,
    boolean resultsRevealed,
    List<WizardScore> ranking
) {}
