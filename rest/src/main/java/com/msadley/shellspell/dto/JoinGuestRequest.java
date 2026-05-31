package com.msadley.shellspell.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record JoinGuestRequest(
    @NotBlank(message = "Display name must not be blank")
    String displayName,

    @NotBlank(message = "Matricula must not be blank")
    @Pattern(regexp = "\\d{9,}", message = "Matricula must be 9 digits or greater")
    String matricula
) {}
