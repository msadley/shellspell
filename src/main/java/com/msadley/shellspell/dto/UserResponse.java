package com.msadley.shellspell.dto;

import com.msadley.shellspell.model.UserRole;

public record UserResponse(
    Long id,
    String username,
    String email,
    UserRole role
) {}
