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

    private void ensureSpellsExist() {
        if (spellRepository.count() == 0) {
            List<Spell> defaultSpells = List.of(
                Spell.builder().name("Projeção Astral").damageAmount(15).category("arcano").build(),
                Spell.builder().name("Míssil Mágico").damageAmount(20).category("arcano").build(),
                Spell.builder().name("Explosão Arcana").damageAmount(30).category("arcano").build(),
                Spell.builder().name("Distorção Temporal").damageAmount(25).category("arcano").build(),
                
                Spell.builder().name("Runa Explosiva").damageAmount(35).category("runico").build(),
                Spell.builder().name("Escudo Rúnico").damageAmount(10).category("runico").build(),
                Spell.builder().name("Sobrecarga de Mana").damageAmount(40).category("runico").build(),
                Spell.builder().name("Marca da Tempestade").damageAmount(30).category("runico").build(),
                
                Spell.builder().name("Lança de Luz").damageAmount(25).category("etereo").build(),
                Spell.builder().name("Raio Estelar").damageAmount(35).category("etereo").build(),
                Spell.builder().name("Impacto Espacial").damageAmount(30).category("etereo").build(),
                Spell.builder().name("Pulsar Cósmico").damageAmount(45).category("etereo").build(),
                
                Spell.builder().name("Bola de Fogo").damageAmount(30).category("primal").build(),
                Spell.builder().name("Fogo de Artifício").damageAmount(20).category("primal").build(),
                Spell.builder().name("Tempestade de Raios").damageAmount(40).category("primal").build(),
                Spell.builder().name("Terremoto").damageAmount(35).category("primal").build(),
                
                Spell.builder().name("Dreno de Vida").damageAmount(25).category("umbral").build(),
                Spell.builder().name("Seta Sombria").damageAmount(20).category("umbral").build(),
                Spell.builder().name("Chama Negra").damageAmount(35).category("umbral").build(),
                Spell.builder().name("Pesadelo").damageAmount(30).category("umbral").build(),

                // Spells dos Arquivos (VFS)
                Spell.builder().name("Umbra Flagellum").damageAmount(15).category("umbral").build(),
                Spell.builder().name("Noctis Morsus").damageAmount(20).category("umbral").build(),
                Spell.builder().name("Caligo Tenebrarum").damageAmount(20).category("umbral").build(),
                Spell.builder().name("Inanis Sectum").damageAmount(40).category("umbral").build(),
                Spell.builder().name("Chaos Involucrum").damageAmount(50).category("arcano").build(),
                Spell.builder().name("Carcer Angularis").damageAmount(15).category("runico").build(),
                Spell.builder().name("Sigillum Ponderis").damageAmount(15).category("runico").build(),
                Spell.builder().name("Glyphos Dementiae").damageAmount(20).category("runico").build(),
                Spell.builder().name("Maledictio Scripta").damageAmount(35).category("runico").build(),
                Spell.builder().name("Stigma Ignotum").damageAmount(50).category("runico").build(),
                Spell.builder().name("Sporae Profundae").damageAmount(30).category("primal").build(),
                Spell.builder().name("Visceralis Diruptio").damageAmount(25).category("primal").build(),
                Spell.builder().name("Ossea Eruptio").damageAmount(25).category("primal").build(),
                Spell.builder().name("Spiritus Gelidus").damageAmount(15).category("etereo").build(),
                Spell.builder().name("Spectra Ululatus").damageAmount(20).category("etereo").build(),
                Spell.builder().name("Corpus Evanesco").damageAmount(35).category("etereo").build(),
                Spell.builder().name("Umbra Astralis").damageAmount(45).category("etereo").build(),
                Spell.builder().name("Stella Cadens").damageAmount(20).category("etereo").build(),
                Spell.builder().name("Ignis Coloris").damageAmount(20).category("primal").build(),
                Spell.builder().name("Lumen Abyssale").damageAmount(30).category("arcano").build(),
                Spell.builder().name("Arcana Mutatio").damageAmount(55).category("arcano").build()
            );
            spellRepository.saveAll(defaultSpells);
        }
    }

    @Transactional
    public SessionResponse createMockBigResult() {
        // 1. Delete if exists
        gameSessionRepository.findBySessionCode("MOCK80").ifPresent(session -> {
            castSpellRepository.deleteByGameSession(session);
            playerSessionRepository.deleteByGameSession(session);
            gameSessionRepository.delete(session);
            gameSessionRepository.flush();
        });

        // 2. Ensure spells exist
        ensureSpellsExist();

        // 3. Find/Create admin
        User admin = userRepository.findByUsername("admin")
                .orElseGet(() -> userRepository.save(User.builder()
                        .id(java.util.UUID.randomUUID().toString())
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .role(UserRole.ADMIN)
                        .build()));

        // 4. Create GameSession
        GameSession session = GameSession.builder()
                .sessionCode("MOCK80")
                .status(SessionStatus.FINISHED)
                .crystalHealth(0)
                .maxCrystalHealth(10000)
                .hostAdmin(admin)
                .resultsRevealed(false)
                .build();
        session = gameSessionRepository.save(session);

        // 5. Create 80 players and cast spells
        List<Spell> spells = spellRepository.findAll();
        Random random = new Random();
        for (int i = 1; i <= 80; i++) {
            String pName = "Mago " + i;
            String pUsername = "MOCK80:" + pName;
            String pId = "mock_user_" + i;

            User playerUser = userRepository.findById(pId)
                    .orElseGet(() -> userRepository.save(User.builder()
                            .id(pId)
                            .username(pUsername)
                            .password("guest")
                            .role(UserRole.PLAYER)
                            .build()));

            PlayerSession ps = PlayerSession.builder()
                    .user(playerUser)
                    .gameSession(session)
                    .build();
            playerSessionRepository.save(ps);

            // Shuffling spells and pick some for this user
            int spellsCount = random.nextInt(6) + 1; // 1 to 6 spells
            java.util.Collections.shuffle(spells);
            for (int j = 0; j < Math.min(spellsCount, spells.size()); j++) {
                Spell s = spells.get(j);
                CastSpell cs = CastSpell.builder()
                        .user(playerUser)
                        .gameSession(session)
                        .spell(s)
                        .castAt(LocalDateTime.now().minusSeconds(random.nextInt(3600)))
                        .build();
                castSpellRepository.save(cs);
            }
        }

        // Return mapped response
        SessionResponse response = mapToResponse(session);
        sseService.broadcast("MOCK80", response);
        sseService.broadcastSessionsList(getAllSessions());
        return response;
    }

    @Transactional
    public void deleteSession(String code, User host) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));

        if (!session.getHostAdmin().getId().equals(host.getId())) {
            throw new UnauthorizedException("Only the host admin can delete this session");
        }

        castSpellRepository.deleteByGameSession(session);
        playerSessionRepository.deleteByGameSession(session);
        gameSessionRepository.delete(session);
        sseService.closeSession(code);
        sseService.broadcastSessionsList(getAllSessions());
    }

    @Transactional
    public com.msadley.shellspell.dto.AuthResponse joinGuest(String code, String displayName, String matricula) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));

        // Check if user with this matricula already exists and is a participant in this session
        User user = userRepository.findById(matricula).orElse(null);
        boolean alreadyJoined = user != null && playerSessionRepository.existsByUserAndGameSession(user, session);

        if (!alreadyJoined && session.getStatus() != SessionStatus.WAITING && !"MOCK80".equals(code)) {
            throw new BadRequestException("You can only join sessions that are in WAITING status");
        }

        if (user == null) {
            String guestUsername = code + ":" + displayName.trim();
            if (displayName.trim().equalsIgnoreCase("admin") || userRepository.existsByUsername(guestUsername)) {
                String baseName = guestUsername;
                java.util.Random rnd = new java.util.Random();
                do {
                    guestUsername = baseName + "#" + (1000 + rnd.nextInt(9000));
                } while (userRepository.existsByUsername(guestUsername));
            }

            // Create and save guest user with plain password to avoid CPU exhaustion under BCrypt
            user = User.builder()
                    .id(matricula)
                    .username(guestUsername)
                    .password("guest")
                    .role(UserRole.PLAYER)
                    .build();
            try {
                user = userRepository.saveAndFlush(user);
            } catch (org.springframework.dao.DataIntegrityViolationException dive) {
                // If a concurrent thread took the username or user id, resolve with random suffix
                User existingById = userRepository.findById(matricula).orElse(null);
                if (existingById != null) {
                    user = existingById;
                } else {
                    user.setUsername(code + ":" + displayName.trim() + "#" + (1000 + new java.util.Random().nextInt(9000)));
                    user = userRepository.saveAndFlush(user);
                }
            }
        } else {
            String newUsername = code + ":" + displayName.trim();
            if (!user.getUsername().equals(newUsername)) {
                if (displayName.trim().equalsIgnoreCase("admin") || userRepository.existsByUsername(newUsername)) {
                    String baseName = newUsername;
                    java.util.Random rnd = new java.util.Random();
                    do {
                        newUsername = baseName + "#" + (1000 + rnd.nextInt(9000));
                    } while (userRepository.existsByUsername(newUsername));
                }
                user.setUsername(newUsername);
                try {
                    user = userRepository.saveAndFlush(user);
                } catch (org.springframework.dao.DataIntegrityViolationException dive) {
                    user.setUsername(code + ":" + displayName.trim() + "#" + (1000 + new java.util.Random().nextInt(9000)));
                    user = userRepository.saveAndFlush(user);
                }
            }
        }

        // Add guest to player sessions if not already in this session
        alreadyJoined = playerSessionRepository.existsByUserAndGameSession(user, session);
        if (!alreadyJoined) {
            PlayerSession playerSession = PlayerSession.builder()
                    .user(user)
                    .gameSession(session)
                    .build();
            try {
                playerSessionRepository.saveAndFlush(playerSession);
            } catch (org.springframework.dao.DataIntegrityViolationException dive) {
                // Handled if joined concurrently
            }
            
            sseService.broadcast(code, mapToResponse(session));
        }

        // Generate JWT token using string representation of ID
        String token = jwtTokenProvider.generateToken(user.getId(), cleanUsername(user.getUsername()), user.getRole().name());
        return new com.msadley.shellspell.dto.AuthResponse(token, cleanUsername(user.getUsername()), user.getRole().name());
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

    private String cleanUsername(String username) {
        if (username == null) return null;
        int colonIndex = username.indexOf(':');
        if (colonIndex == 6) { // session code is exactly 6 characters
            return username.substring(colonIndex + 1);
        }
        return username;
    }

    @Transactional
    public SessionResponse revealResults(String code, User host) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Game session not found with code: " + code));

        if (!session.getHostAdmin().getId().equals(host.getId())) {
            throw new UnauthorizedException("Only the host admin can reveal results for this session");
        }

        if (session.getStatus() != SessionStatus.FINISHED) {
            throw new BadRequestException("Session status must be FINISHED to reveal results. Current status: " + session.getStatus());
        }

        session.setResultsRevealed(true);
        GameSession savedSession = gameSessionRepository.save(session);
        SessionResponse response = mapToResponse(savedSession);
        sseService.broadcast(code, response);
        sseService.broadcastSessionsList(getAllSessions());
        return response;
    }

    private SessionResponse mapToResponse(GameSession session) {
        // Fetch all players in this session
        List<PlayerSession> playerSessions = playerSessionRepository.findByGameSessionWithUser(session);
        String hostUsername = cleanUsername(session.getHostAdmin().getUsername());
        List<String> players = playerSessions.stream()
                .map(playerSession -> cleanUsername(playerSession.getUser().getUsername()))
                .filter(player -> player != null && 
                                  !player.equalsIgnoreCase("admin") && 
                                  !player.equals(hostUsername))
                .toList();

        // Fetch recent spell casts for this session
        List<CastSpell> castSpells = castSpellRepository.findByGameSessionWithUserAndSpell(session);
        List<CastSpellDto> recentCasts = castSpells.stream()
                .map(castSpell -> new CastSpellDto(
                        cleanUsername(castSpell.getUser().getUsername()),
                        castSpell.getSpell().getName(),
                        castSpell.getSpell().getCategory(),
                        castSpell.getSpell().getDamageAmount(),
                        castSpell.getCastAt().toString()
                ))
                .toList();

        // Build the ranking
        java.util.Map<String, Integer> spellsCastMap = new java.util.HashMap<>();
        java.util.Map<String, Integer> totalDamageMap = new java.util.HashMap<>();

        // Initialize for all players
        for (String player : players) {
            spellsCastMap.put(player, 0);
            totalDamageMap.put(player, 0);
        }

        // Aggregate counts from castSpells
        for (CastSpell cs : castSpells) {
            String player = cleanUsername(cs.getUser().getUsername());
            if (spellsCastMap.containsKey(player)) {
                spellsCastMap.put(player, spellsCastMap.get(player) + 1);
                totalDamageMap.put(player, totalDamageMap.get(player) + cs.getSpell().getDamageAmount());
            }
        }

        List<com.msadley.shellspell.dto.WizardScore> ranking = players.stream()
                .map(player -> new com.msadley.shellspell.dto.WizardScore(
                        player,
                        spellsCastMap.get(player),
                        totalDamageMap.get(player)
                ))
                .sorted((a, b) -> {
                    int compareSpells = Integer.compare(b.spellsCast(), a.spellsCast());
                    if (compareSpells != 0) {
                        return compareSpells;
                    }
                    int compareDamage = Integer.compare(b.totalDamage(), a.totalDamage());
                    if (compareDamage != 0) {
                        return compareDamage;
                    }
                    return a.username().compareToIgnoreCase(b.username());
                })
                .toList();

        return new SessionResponse(
                session.getSessionCode(),
                session.getStatus(),
                session.getCrystalHealth(),
                session.getMaxCrystalHealth() != null ? session.getMaxCrystalHealth() : session.getCrystalHealth(),
                cleanUsername(session.getHostAdmin().getUsername()),
                players,
                recentCasts,
                session.isResultsRevealed(),
                ranking
        );
    }
}
