package com.msadley.shellspell.dto;

import jakarta.validation.constraints.NotBlank;

public record CastSpellRequest(
    @NotBlank(message = "Spell name cannot be empty")
    String spellName
) {}
