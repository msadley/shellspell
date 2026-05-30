package com.msadley.shellspell.dto;

import com.msadley.shellspell.model.UserRole;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    UserRole role
) {}
