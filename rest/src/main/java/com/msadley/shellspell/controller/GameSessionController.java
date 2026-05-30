package com.msadley.shellspell.controller;

import com.msadley.shellspell.dto.CastSpellRequest;
import com.msadley.shellspell.dto.CastSpellResponse;
import com.msadley.shellspell.dto.CreateSessionRequest;
import com.msadley.shellspell.dto.SessionResponse;
import com.msadley.shellspell.security.CustomUserDetails;
import com.msadley.shellspell.service.GameSessionService;
import com.msadley.shellspell.service.SseService;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.msadley.shellspell.security.CookieUtils;
import com.msadley.shellspell.dto.AuthResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class GameSessionController {

  private final GameSessionService gameSessionService;
  private final SseService sseService;

  public GameSessionController(GameSessionService gameSessionService, SseService sseService) {
    this.gameSessionService = gameSessionService;
    this.sseService = sseService;
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

  @PostMapping("/{code}/join-guest")
  public ResponseEntity<AuthResponse> joinGuest(
      @PathVariable String code,
      @Valid @RequestBody com.msadley.shellspell.dto.JoinGuestRequest request,
      HttpServletResponse servletResponse) {
    AuthResponse response = gameSessionService.joinGuest(code, request.displayName());
    CookieUtils.setTokenCookie(servletResponse, response.token());
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

  @GetMapping("/{code}/stream")
  public SseEmitter streamSession(@PathVariable String code) {
    SessionResponse currentSession = gameSessionService.getSession(code);
    SseEmitter emitter = sseService.register(code);

    try {
      emitter.send(SseEmitter.event()
          .name("session-update")
          .data(currentSession));
    } catch (Exception e) {
      emitter.complete();
    }

    return emitter;
  }

  @GetMapping
  public ResponseEntity<List<SessionResponse>> getAllSessions() {
    List<SessionResponse> response = gameSessionService.getAllSessions();
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{code}")
  public ResponseEntity<Void> deleteSession(@PathVariable String code) {
    gameSessionService.deleteSession(code);
    return ResponseEntity.noContent().build();
  }
}
