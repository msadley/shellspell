package com.msadley.shellspell.controller;

import com.msadley.shellspell.dto.CastSpellRequest;
import com.msadley.shellspell.dto.CastSpellResponse;
import com.msadley.shellspell.dto.CreateSessionRequest;
import com.msadley.shellspell.dto.SessionResponse;
import com.msadley.shellspell.security.CustomUserDetails;
import com.msadley.shellspell.service.GameSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
public class GameSessionController {

    private final GameSessionService gameSessionService;

    public GameSessionController(GameSessionService gameSessionService) {
        this.gameSessionService = gameSessionService;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateSessionRequest request) {
        SessionResponse response = gameSessionService.createSession(userDetails.getUser(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{code}/start")
    public ResponseEntity<SessionResponse> startSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String code) {
        SessionResponse response = gameSessionService.startSession(code, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{code}/join")
    public ResponseEntity<SessionResponse> joinSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String code) {
        SessionResponse response = gameSessionService.joinSession(code, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{code}/spells")
    public ResponseEntity<CastSpellResponse> castSpell(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String code,
            @Valid @RequestBody CastSpellRequest request) {
        CastSpellResponse response = gameSessionService.castSpell(code, request.spellName(), userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{code}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable String code) {
        SessionResponse response = gameSessionService.getSession(code);
        return ResponseEntity.ok(response);
    }
}
