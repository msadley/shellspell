package com.msadley.shellspell.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateSessionRequest(
    @NotNull(message = "Crystal health must be specified")
    @Min(value = 1, message = "Crystal health must be at least 1")
    Integer crystalHealth
) {}
