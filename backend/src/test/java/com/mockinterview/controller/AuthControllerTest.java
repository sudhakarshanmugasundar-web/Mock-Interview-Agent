package com.mockinterview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.dto.auth.LoginRequest;
import com.mockinterview.dto.auth.RefreshTokenRequest;
import com.mockinterview.dto.auth.RegisterRequest;
import com.mockinterview.entity.Role;
import com.mockinterview.entity.RoleName;
import com.mockinterview.entity.User;
import com.mockinterview.repository.RoleRepository;
import com.mockinterview.repository.UserRepository;
import com.mockinterview.service.auth.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private ObjectMapper objectMapper;

    private Role candidateRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        roleRepository.deleteAll();

        // Seed roles
        candidateRole = roleRepository.save(Role.builder().name(RoleName.ROLE_CANDIDATE).build());
        adminRole = roleRepository.save(Role.builder().name(RoleName.ROLE_ADMIN).build());
    }

    @Test
    void registerUser_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("candidate@test.com", "Password123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is("candidate@test.com")))
                .andExpect(jsonPath("$.roles[0]", is("ROLE_CANDIDATE")));
    }

    @Test
    void registerUser_InvalidEmail_BadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("invalid-email", "Password123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation Failed")));
    }

    @Test
    void registerUser_WeakPassword_BadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("candidate@test.com", "weak");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation Failed")));
    }

    @Test
    void registerUser_EmailAlreadyRegistered_BadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("candidate@test.com", "Password123!");

        // First registration
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Second registration with same email
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Email is already registered")));
    }

    @Test
    void loginUser_Success() throws Exception {
        // Register user first
        Set<Role> roles = new HashSet<>();
        roles.add(candidateRole);
        User user = User.builder()
                .email("candidate@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .roles(roles)
                .enabled(true)
                .build();
        userRepository.save(user);

        LoginRequest request = new LoginRequest("candidate@test.com", "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.email", is("candidate@test.com")));
    }

    @Test
    void loginUser_InvalidCredentials_Unauthorized() throws Exception {
        LoginRequest request = new LoginRequest("nonexistent@test.com", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    void refreshToken_Success() throws Exception {
        Set<Role> roles = new HashSet<>();
        roles.add(candidateRole);
        User user = User.builder()
                .email("candidate@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .roles(roles)
                .enabled(true)
                .build();
        userRepository.save(user);

        var refreshToken = tokenService.createRefreshToken(user.getEmail());
        RefreshTokenRequest request = new RefreshTokenRequest(refreshToken.getToken());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.email", is("candidate@test.com")));
    }

    @Test
    void refreshToken_InvalidToken_Forbidden() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("non-existent-uuid-token");

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("Failed for [non-existent-uuid-token]: Refresh token is not in database.")));
    }

    @Test
    void logoutUser_Success() throws Exception {
        Set<Role> roles = new HashSet<>();
        roles.add(candidateRole);
        User user = User.builder()
                .email("candidate@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .roles(roles)
                .enabled(true)
                .build();
        userRepository.save(user);

        // Fetch credentials by logging in
        LoginRequest loginRequest = new LoginRequest("candidate@test.com", "Password123!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseContent = loginResult.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(responseContent).get("accessToken").asText();

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("User logged out successfully")));
    }
}
