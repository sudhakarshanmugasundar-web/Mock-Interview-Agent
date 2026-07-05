package com.mockinterview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.dto.interview.AnswerRequest;
import com.mockinterview.entity.*;
import com.mockinterview.repository.*;
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

import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AiInterviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private InterviewSessionRepository sessionRepository;

    @Autowired
    private CandidateResponseRepository responseRepository;

    @Autowired
    private EvaluationRepository evaluationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private InterviewSession activeSession;

    @BeforeEach
    void setUp() {
        evaluationRepository.deleteAll();
        responseRepository.deleteAll();
        sessionRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role candidateRole = roleRepository.save(Role.builder().name(RoleName.ROLE_CANDIDATE).build());
        Set<Role> roles = new HashSet<>();
        roles.add(candidateRole);

        testUser = userRepository.save(User.builder()
                .email("candidate@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .roles(roles)
                .enabled(true)
                .build());

        activeSession = sessionRepository.save(InterviewSession.builder()
                .user(testUser)
                .title("Tech Java Interview")
                .status(InterviewStatus.IN_PROGRESS)
                .interviewType(InterviewType.TECHNICAL)
                .difficulty(InterviewDifficulty.MEDIUM)
                .duration(0)
                .build());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void nextQuestion_FirstTime_GeneratesAndPersists() throws Exception {
        mockMvc.perform(get("/api/interviews/" + activeSession.getId() + "/next-question"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.questionText", notNullValue()))
                .andExpect(jsonPath("$.questionSequence", is(1)))
                .andExpect(jsonPath("$.isLastQuestion", is(false)));

        // Verify it was persisted in db as pending
        long count = responseRepository.count();
        org.junit.jupiter.api.Assertions.assertEquals(1, count);
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void nextQuestion_RecallPending_ReturnsSameQuestion() throws Exception {
        // First call
        String response1 = mockMvc.perform(get("/api/interviews/" + activeSession.getId() + "/next-question"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long id1 = objectMapper.readTree(response1).get("id").asLong();
        String text1 = objectMapper.readTree(response1).get("questionText").asText();

        // Second call without answering
        String response2 = mockMvc.perform(get("/api/interviews/" + activeSession.getId() + "/next-question"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long id2 = objectMapper.readTree(response2).get("id").asLong();
        String text2 = objectMapper.readTree(response2).get("questionText").asText();

        // Must be identical
        org.junit.jupiter.api.Assertions.assertEquals(id1, id2);
        org.junit.jupiter.api.Assertions.assertEquals(text1, text2);
        org.junit.jupiter.api.Assertions.assertEquals(1, responseRepository.count());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void submitAnswer_Success() throws Exception {
        // 1. Generate pending question
        responseRepository.save(CandidateResponse.builder()
                .interviewSession(activeSession)
                .questionText("Explain Spring IOC container.")
                .questionSequence(1)
                .build());

        // 2. Submit answer
        AnswerRequest request = new AnswerRequest("It stands for Inversion of Control.", "TEXT", 15, null);

        mockMvc.perform(post("/api/interviews/" + activeSession.getId() + "/answer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseText", is("It stands for Inversion of Control.")))
                .andExpect(jsonPath("$.responseTime", is(15)))
                .andExpect(jsonPath("$.overallScore", notNullValue()))
                .andExpect(jsonPath("$.feedbackText", notNullValue()));

        // Verify in DB that evaluation was stored
        org.junit.jupiter.api.Assertions.assertEquals(1, evaluationRepository.count());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void getResult_Success() throws Exception {
        // Seed an answered question & evaluation
        CandidateResponse resp = responseRepository.save(CandidateResponse.builder()
                .interviewSession(activeSession)
                .questionText("Explain Hibernate caching.")
                .responseText("First level is session based.")
                .questionSequence(1)
                .submittedAt(java.time.LocalDateTime.now())
                .build());

        evaluationRepository.save(Evaluation.builder()
                .candidateResponse(resp)
                .technicalKnowledge(8)
                .communication(9)
                .confidence(7)
                .grammar(9)
                .relevance(8)
                .completeness(8)
                .professionalism(9)
                .overallScore(8.3)
                .feedbackText("Excellent cache description.")
                .build());

        mockMvc.perform(get("/api/interviews/" + activeSession.getId() + "/result"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId", is(activeSession.getId().intValue())))
                .andExpect(jsonPath("$.averageScore", is(8.3)))
                .andExpect(jsonPath("$.totalQuestions", is(1)))
                .andExpect(jsonPath("$.questionsEvaluations", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void uploadAudio_Success() throws Exception {
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "recording.mp3", "audio/mpeg", "mock mp3 voice recording content".getBytes());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/interviews/audio")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.audioPath", org.hamcrest.Matchers.containsString("audio")));
    }
}
