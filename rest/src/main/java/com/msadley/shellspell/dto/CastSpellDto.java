package com.msadley.shellspell.dto;

public record CastSpellDto(
    String username,
    String spellName,
    String spellCategory,
    int damage,
    String castAtTime
) {}
