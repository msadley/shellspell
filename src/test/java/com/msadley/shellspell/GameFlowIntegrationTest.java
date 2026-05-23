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

@SpringBootTest
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

    @BeforeEach
    void setUp() {
        castSpellRepository.deleteAll();
        playerSessionRepository.deleteAll();
        gameSessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testCompleteGameFlow() throws Exception {
        // 1. Register admin user (contains "admin" in username)
        RegisterRequest adminRegister = new RegisterRequest("gameadmin", "admin@shellspell.com", "adminpass");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminRegister)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username", is("gameadmin")))
                .andExpect(jsonPath("$.role", is("ADMIN")));

        // 2. Register player user
        RegisterRequest playerRegister = new RegisterRequest("player1", "player1@shellspell.com", "playerpass");
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
                .andExpect(jsonPath("$.token", notNullValue()))
                .andReturn();
        String adminToken = objectMapper.readValue(adminLoginResult.getResponse().getContentAsString(), AuthResponse.class).token();

        // 4. Login as Player
        LoginRequest playerLogin = new LoginRequest("player1", "playerpass");
        MvcResult playerLoginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(playerLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andReturn();
        String playerToken = objectMapper.readValue(playerLoginResult.getResponse().getContentAsString(), AuthResponse.class).token();

        // 5. Create Session as Admin (Dragon health: 50)
        CreateSessionRequest createRequest = new CreateSessionRequest(50);
        MvcResult createResult = mockMvc.perform(post("/api/sessions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionCode", notNullValue()))
                .andExpect(jsonPath("$.status", is("WAITING")))
                .andExpect(jsonPath("$.dragonHealth", is(50)))
                .andReturn();
        String sessionCode = objectMapper.readValue(createResult.getResponse().getContentAsString(), SessionResponse.class).sessionCode();

        // 6. Try to join session before starting - should succeed because status is WAITING
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/join")
                .header("Authorization", "Bearer " + playerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionCode", is(sessionCode)))
                .andExpect(jsonPath("$.status", is("WAITING")));

        // 7. Try to join again - should fail (duplicate join)
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/join")
                .header("Authorization", "Bearer " + playerToken))
                .andExpect(status().isBadRequest());

        // 8. Start Session as Admin
        mockMvc.perform(patch("/api/sessions/" + sessionCode + "/start")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")));

        // 9. Cast "Fireball" (25 damage)
        CastSpellRequest castFireball = new CastSpellRequest("Fireball");
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/spells")
                .header("Authorization", "Bearer " + playerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(castFireball)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.spellName", is("Fireball")))
                .andExpect(jsonPath("$.damageDealt", is(25)))
                .andExpect(jsonPath("$.remainingDragonHealth", is(25)))
                .andExpect(jsonPath("$.gameStatus", is("ACTIVE")));

        // 10. Try to cast "Fireball" again - should fail (non-repeat check)
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/spells")
                .header("Authorization", "Bearer " + playerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(castFireball)))
                .andExpect(status().isBadRequest());

        // 11. Cast "Thunderstrike" (35 damage) to finish the dragon
        CastSpellRequest castThunder = new CastSpellRequest("Thunderstrike");
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/spells")
                .header("Authorization", "Bearer " + playerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(castThunder)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.spellName", is("Thunderstrike")))
                .andExpect(jsonPath("$.damageDealt", is(35)))
                .andExpect(jsonPath("$.remainingDragonHealth", is(0)))
                .andExpect(jsonPath("$.gameStatus", is("FINISHED")));

        // 12. Try to cast another spell after status is FINISHED - should fail
        CastSpellRequest castFrost = new CastSpellRequest("Frostbolt");
        mockMvc.perform(post("/api/sessions/" + sessionCode + "/spells")
                .header("Authorization", "Bearer " + playerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(castFrost)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testChangePassword() throws Exception {
        // Register and login
        RegisterRequest register = new RegisterRequest("passchangeuser", "change@shellspell.com", "oldpassword");
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
        String token = objectMapper.readValue(loginResult.getResponse().getContentAsString(), AuthResponse.class).token();

        // Change password
        ChangePasswordRequest changeRequest = new ChangePasswordRequest("oldpassword", "newpassword");
        mockMvc.perform(patch("/api/users/me/password")
                .header("Authorization", "Bearer " + token)
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
}
