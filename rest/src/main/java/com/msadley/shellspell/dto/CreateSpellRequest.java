package com.msadley.shellspell.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSpellRequest(
    @NotBlank(message = "Spell name must not be blank")
    String name,

    @NotNull(message = "Damage amount must be specified")
    @Min(value = 1, message = "Damage amount must be at least 1")
    Integer damageAmount,

    @NotBlank(message = "Category must not be blank")
    String category
) {}
