package com.msadley.shellspell.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinGuestRequest(
    @NotBlank(message = "Display name must not be blank")
    String displayName
) {}
