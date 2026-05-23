package com.msadley.shellspell.service;

import com.msadley.shellspell.dto.CastSpellResponse;
import com.msadley.shellspell.dto.CreateSessionRequest;
import com.msadley.shellspell.dto.SessionResponse;
import com.msadley.shellspell.exception.BadRequestException;
import com.msadley.shellspell.exception.ResourceNotFoundException;
import com.msadley.shellspell.exception.UnauthorizedException;
import com.msadley.shellspell.model.*;
import com.msadley.shellspell.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final PlayerSessionRepository playerSessionRepository;
    private final CastSpellRepository castSpellRepository;
    private final SpellRepository spellRepository;

    public GameSessionService(GameSessionRepository gameSessionRepository,
                              PlayerSessionRepository playerSessionRepository,
                              CastSpellRepository castSpellRepository,
                              SpellRepository spellRepository) {
        this.gameSessionRepository = gameSessionRepository;
        this.playerSessionRepository = playerSessionRepository;
        this.castSpellRepository = castSpellRepository;
        this.spellRepository = spellRepository;
    }

    @Transactional
    public SessionResponse createSession(User host, CreateSessionRequest request) {
        if (host.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedException("Only ADMIN users can create sessions");
        }

        String sessionCode = generateSessionCode();
        GameSession session = GameSession.builder()
                .sessionCode(sessionCode)
                .status(SessionStatus.WAITING)
                .dragonHealth(request.dragonHealth())
                .hostAdmin(host)
                .build();

        GameSession savedSession = gameSessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    @Transactional
    public SessionResponse startSession(String code, User host) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));

        if (!session.getHostAdmin().getId().equals(host.getId())) {
            throw new UnauthorizedException("Only the host admin can start this session");
        }

        if (session.getStatus() != SessionStatus.WAITING) {
            throw new BadRequestException("Session status must be WAITING to start. Current status: " + session.getStatus());
        }

        session.setStatus(SessionStatus.ACTIVE);
        GameSession savedSession = gameSessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    @Transactional
    public SessionResponse joinSession(String code, User user) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));

        if (session.getStatus() != SessionStatus.WAITING) {
            throw new BadRequestException("You can only join sessions that are in WAITING status");
        }

        boolean alreadyJoined = playerSessionRepository.existsByUserAndGameSession(user, session);
        if (alreadyJoined) {
            throw new BadRequestException("You have already joined this session");
        }

        PlayerSession playerSession = PlayerSession.builder()
                .user(user)
                .gameSession(session)
                .build();

        playerSessionRepository.save(playerSession);
        return mapToResponse(session);
    }

    @Transactional
    public CastSpellResponse castSpell(String code, String spellName, User user) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BadRequestException("Spell can only be cast in an ACTIVE session");
        }

        // Verify player belongs to session
        boolean isMember = playerSessionRepository.existsByUserAndGameSession(user, session);
        if (!isMember) {
            throw new BadRequestException("You must join the session before casting spells");
        }

        // Verify spell exists
        Spell spell = spellRepository.findByNameIgnoreCase(spellName)
                .orElseThrow(() -> new ResourceNotFoundException("Spell not found: " + spellName));

        // Check if spell already used by this player
        boolean alreadyUsed = castSpellRepository.existsByUserAndGameSessionAndSpell(user, session, spell);
        if (alreadyUsed) {
            throw new BadRequestException("You have already cast the spell '" + spell.getName() + "' in this session");
        }

        // Apply damage atomically
        int updatedRows = gameSessionRepository.applyDamage(code, spell.getDamageAmount());
        if (updatedRows == 0) {
            // Fetch session status to throw correct error
            GameSession currentSessionState = gameSessionRepository.findBySessionCode(code)
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
            if (currentSessionState.getStatus() == SessionStatus.FINISHED) {
                throw new BadRequestException("The dragon is already defeated!");
            }
            throw new BadRequestException("Failed to apply damage. Session status might not be active.");
        }

        // Record history
        CastSpell castSpell = CastSpell.builder()
                .user(user)
                .gameSession(session)
                .spell(spell)
                .castAt(LocalDateTime.now())
                .build();
        castSpellRepository.save(castSpell);

        // Fetch updated state for return
        GameSession updatedSession = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        return new CastSpellResponse(
                spell.getName(),
                spell.getDamageAmount(),
                updatedSession.getDragonHealth(),
                updatedSession.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(String code) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));
        return mapToResponse(session);
    }

    private String generateSessionCode() {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        java.util.Random rnd = new java.util.Random();
        while (code.length() < 6) {
            int index = (int) (rnd.nextFloat() * characters.length());
            code.append(characters.charAt(index));
        }
        String sessionCode = code.toString();
        if (gameSessionRepository.existsBySessionCode(sessionCode)) {
            return generateSessionCode(); // collision check
        }
        return sessionCode;
    }

    private SessionResponse mapToResponse(GameSession session) {
        return new SessionResponse(
                session.getSessionCode(),
                session.getStatus(),
                session.getDragonHealth(),
                session.getHostAdmin().getUsername()
        );
    }
}
