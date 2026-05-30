package com.msadley.shellspell.service;

import com.msadley.shellspell.dto.CastSpellDto;
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
import java.util.List;
import java.util.Random;

@Service
public class GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final PlayerSessionRepository playerSessionRepository;
    private final CastSpellRepository castSpellRepository;
    private final SpellRepository spellRepository;
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.msadley.shellspell.security.JwtTokenProvider jwtTokenProvider;
    private final SseService sseService;

    public GameSessionService(GameSessionRepository gameSessionRepository,
                              PlayerSessionRepository playerSessionRepository,
                              CastSpellRepository castSpellRepository,
                              SpellRepository spellRepository,
                              UserRepository userRepository,
                              org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                              com.msadley.shellspell.security.JwtTokenProvider jwtTokenProvider,
                              SseService sseService) {
        this.gameSessionRepository = gameSessionRepository;
        this.playerSessionRepository = playerSessionRepository;
        this.castSpellRepository = castSpellRepository;
        this.spellRepository = spellRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.sseService = sseService;
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
                .crystalHealth(request.crystalHealth())
                .maxCrystalHealth(request.crystalHealth())
                .hostAdmin(host)
                .build();

        GameSession savedSession = gameSessionRepository.save(session);
        SessionResponse response = mapToResponse(savedSession);
        sseService.broadcastSessionsList(getAllSessions());
        return response;
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
        SessionResponse response = mapToResponse(savedSession);
        sseService.broadcast(code, response);
        sseService.broadcastSessionsList(getAllSessions());
        return response;
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
        SessionResponse response = mapToResponse(session);
        sseService.broadcast(code, response);
        sseService.broadcastSessionsList(getAllSessions());
        return response;
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
                throw new BadRequestException("The crystal is already defeated!");
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

        sseService.broadcast(code, mapToResponse(updatedSession));

        return new CastSpellResponse(
                spell.getName(),
                spell.getDamageAmount(),
                updatedSession.getCrystalHealth(),
                updatedSession.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(String code) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getAllSessions() {
        return gameSessionRepository.findAllWithHostAdmin().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void deleteSession(String code) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));

        castSpellRepository.deleteByGameSession(session);
        playerSessionRepository.deleteByGameSession(session);
        gameSessionRepository.delete(session);
        sseService.closeSession(code);
        sseService.broadcastSessionsList(getAllSessions());
    }

    @Transactional
    public com.msadley.shellspell.dto.AuthResponse joinGuest(String code, String displayName) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));

        if (session.getStatus() != SessionStatus.WAITING) {
            throw new BadRequestException("You can only join sessions that are in WAITING status");
        }

        // Generate guest info
        java.util.UUID guestUuid = java.util.UUID.randomUUID();
        String guestUsername = displayName.trim();
        if (guestUsername.equalsIgnoreCase("admin") || userRepository.existsByUsername(guestUsername)) {
            String baseName = guestUsername;
            java.util.Random rnd = new java.util.Random();
            do {
                guestUsername = baseName + "#" + (1000 + rnd.nextInt(9000));
            } while (userRepository.existsByUsername(guestUsername));
        }
        String password = "guest_" + guestUuid;

        // Create and save guest user
        User user = User.builder()
                .username(guestUsername)
                .password(passwordEncoder.encode(password))
                .role(UserRole.PLAYER)
                .build();
        User savedUser = userRepository.save(user);

        // Add guest to player sessions
        PlayerSession playerSession = PlayerSession.builder()
                .user(savedUser)
                .gameSession(session)
                .build();
        playerSessionRepository.save(playerSession);

        sseService.broadcast(code, mapToResponse(session));
        sseService.broadcastSessionsList(getAllSessions());

        // Generate JWT token using UUID string representation
        String token = jwtTokenProvider.generateToken(savedUser.getId().toString());
        return new com.msadley.shellspell.dto.AuthResponse(token, savedUser.getUsername(), savedUser.getRole().name());
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
        // Fetch all players in this session
        List<PlayerSession> playerSessions = playerSessionRepository.findByGameSessionWithUser(session);
        List<String> players = playerSessions.stream()
                .map(playerSession -> playerSession.getUser().getUsername())
                .toList();

        // Fetch recent spell casts for this session
        List<CastSpell> castSpells = castSpellRepository.findByGameSessionWithUserAndSpell(session);
        List<CastSpellDto> recentCasts = castSpells.stream()
                .map(castSpell -> new CastSpellDto(
                        castSpell.getUser().getUsername(),
                        castSpell.getSpell().getName(),
                        castSpell.getSpell().getCategory(),
                        castSpell.getSpell().getDamageAmount(),
                        castSpell.getCastAt().toString()
                ))
                .toList();

        return new SessionResponse(
                session.getSessionCode(),
                session.getStatus(),
                session.getCrystalHealth(),
                session.getMaxCrystalHealth() != null ? session.getMaxCrystalHealth() : session.getCrystalHealth(),
                session.getHostAdmin().getUsername(),
                players,
                recentCasts
        );
    }
}
