package com.msadley.shellspell.dto;

import com.msadley.shellspell.model.SessionStatus;

public record SessionResponse(
    String sessionCode,
    SessionStatus status,
    int dragonHealth,
    String hostAdminUsername
) {}
