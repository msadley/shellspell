package com.msadley.shellspell;

import tools.jackson.databind.ObjectMapper;
import com.msadley.shellspell.dto.*;
import com.msadley.shellspell.model.*;
import com.msadley.shellspell.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
@AutoConfigureMockMvc
public class GameFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private SpellRepository spellRepository;

    @Autowired
    private PlayerSessionRepository playerSessionRepository;

    @Autowired
    private CastSpellRepository castSpellRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        castSpellRepository.deleteAll();
        playerSessionRepository.deleteAll();
        gameSessionRepository.deleteAll();
        userRepository.deleteAll();
        spellRepository.deleteAll();

        spellRepository.save(Spell.builder().name("Fireball").damageAmount(25).category("primal").build());
        spellRepository.save(Spell.builder().name("Thunderstrike").damageAmount(35).category("primal").build());
        spellRepository.save(Spell.builder().name("Frostbolt").damageAmount(15).category("primal").build());
    }

    @Test
    void testCompleteGameFlow() throws Exception {
        // 1. Seed admin user programmatically (since public registration defaults strictly to PLAYER)
        userRepository.save(User.builder()
                .username("gameadmin")
                .password(passwordEncoder.encode("adminpass"))
                .role(UserRole.ADMIN)
                .build());

        // 2. Register player user
        RegisterRequest playerRegister = new RegisterRequest("player1", "playerpass");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(playerRegister)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username", is("player1")))
                .andExpect(jsonPath("$.role", is("PLAYER")));

        // 3. Login as Admin
        LoginRequest adminLogin = new LoginRequest("gameadmin", "adminpass");
        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        jakarta.servlet.http.Cookie adminCookie = adminLoginResult.getResponse().getCookie("token");

        // 4. Login as Player
        LoginRequest playerLogin = new LoginRequest("player1", "playerpass");
        MvcResult playerLoginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(playerLogin)))
                .andExpect(status().isOk())
                .andReturn();
        jakarta.servlet.http.Cookie playerCookie = playerLoginResult.getResponse().getCookie("token");

        // 5. Create Session as Admin (Crystal health: 50)
        CreateSessionRequest createRequest = new CreateSessionRequest(50);
        MvcResult createResult = mockMvc.perform(post("/api/sessions")
                .cookie(adminCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionCode", notNullValue()))
                .andExpect(jsonPath("$.status", is("WAITING")))
                .andExpect(jsonPath("$.crystalHealth", is(50)))
                .andExpect(jsonPath("$.maxCrystalHealth", is(50)))
                .andReturn();
        String sessionCode = objectMapper.readValue(createResult.getResponse().getContentAsString(), SessionResponse.class).sessionCode();

        // 6. Try to join session before starting - should succeed because status is WAITING
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/join")
                .cookie(playerCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionCode", is(sessionCode)))
                .andExpect(jsonPath("$.status", is("WAITING")));

        // 7. Try to join again - should fail (duplicate join)
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/join")
                .cookie(playerCookie))
                .andExpect(status().isBadRequest());

        // 8. Start Session as Admin
        mockMvc.perform(patch("/api/sessions/" + sessionCode + "/start")
                .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")));

        // 9. Cast "Fireball" (25 damage)
        CastSpellRequest castFireball = new CastSpellRequest("Fireball");
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/spells")
                .cookie(playerCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(castFireball)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.spellName", is("Fireball")))
                .andExpect(jsonPath("$.damageDealt", is(25)))
                .andExpect(jsonPath("$.remainingCrystalHealth", is(25)))
                .andExpect(jsonPath("$.gameStatus", is("ACTIVE")));

        // 10. Try to cast "Fireball" again - should fail (non-repeat check)
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/spells")
                .cookie(playerCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(castFireball)))
                .andExpect(status().isBadRequest());

        // 11. Cast "Thunderstrike" (35 damage) to finish the crystal
        CastSpellRequest castThunder = new CastSpellRequest("Thunderstrike");
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/spells")
                .cookie(playerCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(castThunder)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.spellName", is("Thunderstrike")))
                .andExpect(jsonPath("$.damageDealt", is(35)))
                .andExpect(jsonPath("$.remainingCrystalHealth", is(0)))
                .andExpect(jsonPath("$.gameStatus", is("FINISHED")));

        // 12. Try to cast another spell after status is FINISHED - should fail
        CastSpellRequest castFrost = new CastSpellRequest("Frostbolt");
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/spells")
                .cookie(playerCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(castFrost)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testChangePassword() throws Exception {
        // Register and login
        RegisterRequest register = new RegisterRequest("passchangeuser", "oldpassword");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest("passchangeuser", "oldpassword");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();
        jakarta.servlet.http.Cookie cookie = loginResult.getResponse().getCookie("token");

        // Change password
        ChangePasswordRequest changeRequest = new ChangePasswordRequest("oldpassword", "newpassword");
        mockMvc.perform(patch("/api/users/me/password")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changeRequest)))
                .andExpect(status().isNoContent());

        // Login with old password should fail
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());

        // Login with new password should succeed
        LoginRequest newLogin = new LoginRequest("passchangeuser", "newpassword");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk());
    }

    @Test
    void testJoinGuest() throws Exception {
        // 1. Seed admin user
        userRepository.save(User.builder()
                .username("gameadmin2")
                .password(passwordEncoder.encode("adminpass"))
                .role(UserRole.ADMIN)
                .build());

        // 2. Login as Admin
        LoginRequest adminLogin = new LoginRequest("gameadmin2", "adminpass");
        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        jakarta.servlet.http.Cookie adminCookie = adminLoginResult.getResponse().getCookie("token");

        // 3. Create Session as Admin
        CreateSessionRequest createRequest = new CreateSessionRequest(50);
        MvcResult createResult = mockMvc.perform(post("/api/sessions")
                .cookie(adminCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();
        String sessionCode = objectMapper.readValue(createResult.getResponse().getContentAsString(), SessionResponse.class).sessionCode();

        // 4. Join as Guest
        JoinGuestRequest joinGuestRequest = new JoinGuestRequest("GuestPlayer");
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/join-guest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(joinGuestRequest)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("token"))
                .andExpect(jsonPath("$.username", is("GuestPlayer")))
                .andExpect(jsonPath("$.role", is("PLAYER")));
    }

    @Test
    void testJoinGuestAdminClash() throws Exception {
        // 1. Seed admin user with username "admin"
        User admin = userRepository.save(User.builder()
                .username("admin")
                .password(passwordEncoder.encode("adminpass"))
                .role(UserRole.ADMIN)
                .build());

        // 2. Login as Admin
        LoginRequest adminLogin = new LoginRequest("admin", "adminpass");
        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        jakarta.servlet.http.Cookie adminCookie = adminLoginResult.getResponse().getCookie("token");

        // 3. Create Session as Admin
        CreateSessionRequest createRequest = new CreateSessionRequest(50);
        MvcResult createResult = mockMvc.perform(post("/api/sessions")
                .cookie(adminCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();
        String sessionCode = objectMapper.readValue(createResult.getResponse().getContentAsString(), SessionResponse.class).sessionCode();

        // 4. Join as Guest with name "admin" - should append suffix
        JoinGuestRequest joinGuestRequest = new JoinGuestRequest("admin");
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/join-guest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(joinGuestRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", startsWith("admin#")))
                .andExpect(jsonPath("$.role", is("PLAYER")));

        // 5. Verify the admin lookup is still unique
        User retrievedAdmin = userRepository.findByUsername("admin").orElseThrow();
        assertEquals(admin.getId(), retrievedAdmin.getId());
    }
}
