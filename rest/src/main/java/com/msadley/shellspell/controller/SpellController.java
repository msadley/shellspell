package com.msadley.shellspell.controller;

import com.msadley.shellspell.dto.CreateSpellRequest;
import com.msadley.shellspell.dto.SpellResponse;
import com.msadley.shellspell.service.SpellService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spells")
public class SpellController {

    private final SpellService spellService;

    public SpellController(SpellService spellService) {
        this.spellService = spellService;
    }

    @GetMapping
    public ResponseEntity<List<SpellResponse>> getAllSpells() {
        List<SpellResponse> response = spellService.getAllSpells();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<SpellResponse> createSpell(@Valid @RequestBody CreateSpellRequest request) {
        SpellResponse response = spellService.createSpell(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<SpellResponse>> createSpellsBatch(@Valid @RequestBody List<@Valid CreateSpellRequest> requests) {
        List<SpellResponse> response = spellService.createSpellsBatch(requests);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpell(@PathVariable Long id) {
        spellService.deleteSpell(id);
        return ResponseEntity.noContent().build();
    }
}
