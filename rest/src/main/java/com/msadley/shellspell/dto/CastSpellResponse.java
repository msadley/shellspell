package com.msadley.shellspell.dto;

import com.msadley.shellspell.model.SessionStatus;

public record CastSpellResponse(
    String spellName,
    int damageDealt,
    int remainingCrystalHealth,
    SessionStatus gameStatus
) {}
