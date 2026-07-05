package com.mockinterview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.dto.interview.InterviewSessionRequest;
import com.mockinterview.entity.*;
import com.mockinterview.repository.InterviewSessionRepository;
import com.mockinterview.repository.RoleRepository;
import com.mockinterview.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InterviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private InterviewSessionRepository sessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User candidateUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role candidateRole = roleRepository.save(Role.builder().name(RoleName.ROLE_CANDIDATE).build());

        Set<Role> roles = new HashSet<>();
        roles.add(candidateRole);

        candidateUser = userRepository.save(User.builder()
                .email("candidate@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .roles(roles)
                .enabled(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .roles(roles)
                .enabled(true)
                .build());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void createSession_Success() throws Exception {
        InterviewSessionRequest request = new InterviewSessionRequest("Java Backend Developer Interview", "TECHNICAL", "MEDIUM");

        mockMvc.perform(post("/api/interviews/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Java Backend Developer Interview")))
                .andExpect(jsonPath("$.status", is("NOT_STARTED")))
                .andExpect(jsonPath("$.interviewType", is("TECHNICAL")))
                .andExpect(jsonPath("$.difficulty", is("MEDIUM")));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void createSession_DuplicateActiveSession_BadRequest() throws Exception {
        // Create an active session
        sessionRepository.save(InterviewSession.builder()
                .user(candidateUser)
                .title("First Interview")
                .status(InterviewStatus.IN_PROGRESS)
                .interviewType(InterviewType.HR)
                .difficulty(InterviewDifficulty.EASY)
                .duration(0)
                .build());

        InterviewSessionRequest request = new InterviewSessionRequest("Second Interview", "TECHNICAL", "MEDIUM");

        mockMvc.perform(post("/api/interviews/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", is("You already have an active interview session (ID: " + sessionRepository.findByUser(candidateUser).get(0).getId() + ")")));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void startSession_Success() throws Exception {
        InterviewSession session = sessionRepository.save(InterviewSession.builder()
                .user(candidateUser)
                .title("Java Tech Interview")
                .status(InterviewStatus.NOT_STARTED)
                .interviewType(InterviewType.TECHNICAL)
                .difficulty(InterviewDifficulty.HARD)
                .duration(0)
                .build());

        mockMvc.perform(post("/api/interviews/start/" + session.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.startedAt", notNullValue()));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void pauseAndResumeSession_Success() throws Exception {
        InterviewSession session = sessionRepository.save(InterviewSession.builder()
                .user(candidateUser)
                .title("Java Tech Interview")
                .status(InterviewStatus.NOT_STARTED)
                .interviewType(InterviewType.TECHNICAL)
                .difficulty(InterviewDifficulty.HARD)
                .startedAt(LocalDateTime.now())
                .duration(0)
                .build());

        // First transition to IN_PROGRESS
        mockMvc.perform(post("/api/interviews/start/" + session.getId()))
                .andExpect(status().isOk());

        // Pause the session
        mockMvc.perform(post("/api/interviews/pause/" + session.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PAUSED")));

        // Resume the session
        mockMvc.perform(post("/api/interviews/resume/" + session.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void completeSession_Success() throws Exception {
        InterviewSession session = sessionRepository.save(InterviewSession.builder()
                .user(candidateUser)
                .title("Java Tech Interview")
                .status(InterviewStatus.NOT_STARTED)
                .interviewType(InterviewType.TECHNICAL)
                .difficulty(InterviewDifficulty.HARD)
                .duration(0)
                .build());

        mockMvc.perform(post("/api/interviews/start/" + session.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/interviews/complete/" + session.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.endedAt", notNullValue()));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void getSessionDetails_OwnershipMismatched_Forbidden() throws Exception {
        // Save session owned by otherUser
        InterviewSession session = sessionRepository.save(InterviewSession.builder()
                .user(otherUser)
                .title("Secret Profile")
                .status(InterviewStatus.NOT_STARTED)
                .interviewType(InterviewType.TECHNICAL)
                .difficulty(InterviewDifficulty.EASY)
                .duration(0)
                .build());

        mockMvc.perform(get("/api/interviews/" + session.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void getStatistics_Success() throws Exception {
        // Save completed session
        sessionRepository.save(InterviewSession.builder()
                .user(candidateUser)
                .title("Completed Interview")
                .status(InterviewStatus.COMPLETED)
                .interviewType(InterviewType.TECHNICAL)
                .difficulty(InterviewDifficulty.MEDIUM)
                .duration(360) // 6 minutes
                .build());

        // Save cancelled session
        sessionRepository.save(InterviewSession.builder()
                .user(candidateUser)
                .title("Cancelled Interview")
                .status(InterviewStatus.CANCELLED)
                .interviewType(InterviewType.HR)
                .difficulty(InterviewDifficulty.EASY)
                .duration(60) // 1 minute
                .build());

        mockMvc.perform(get("/api/interviews/statistics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSessions", is(2)))
                .andExpect(jsonPath("$.completedSessions", is(1)))
                .andExpect(jsonPath("$.cancelledSessions", is(1)))
                .andExpect(jsonPath("$.averageDurationSeconds", is(360.0)));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void getHistory_Success() throws Exception {
        sessionRepository.save(InterviewSession.builder()
                .user(candidateUser)
                .title("Interview 1")
                .status(InterviewStatus.COMPLETED)
                .interviewType(InterviewType.TECHNICAL)
                .difficulty(InterviewDifficulty.MEDIUM)
                .duration(100)
                .build());

        mockMvc.perform(get("/api/interviews/history")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessions", hasSize(1)))
                .andExpect(jsonPath("$.currentPage", is(0)))
                .andExpect(jsonPath("$.totalItems", is(1)));
    }
}
