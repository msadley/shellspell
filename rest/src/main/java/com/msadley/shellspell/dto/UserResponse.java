package com.msadley.shellspell.dto;

import com.msadley.shellspell.model.UserRole;

public record UserResponse(
    String id,
    String username,
    UserRole role
) {}
