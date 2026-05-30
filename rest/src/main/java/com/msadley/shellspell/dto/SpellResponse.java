package com.msadley.shellspell.dto;

public record SpellResponse(
    Long id,
    String name,
    int damageAmount,
    String category
) {}
