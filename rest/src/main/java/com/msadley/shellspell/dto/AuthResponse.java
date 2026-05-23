package com.msadley.shellspell.dto;

public record AuthResponse(
    String token,
    String username,
    String role
) {}
