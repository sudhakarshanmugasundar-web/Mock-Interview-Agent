package com.mockinterview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.dto.interview.SelfIntroductionRequest;
import com.mockinterview.dto.interview.SelfIntroductionEvaluateRequest;
import com.mockinterview.entity.*;
import com.mockinterview.repository.InterviewSessionRepository;
import com.mockinterview.repository.RoleRepository;
import com.mockinterview.repository.SelfIntroductionRepository;
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

import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SelfIntroductionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private InterviewSessionRepository sessionRepository;

    @Autowired
    private SelfIntroductionRepository selfIntroductionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User candidateUser;
    private User otherUser;
    private InterviewSession candidateSession;
    private InterviewSession otherSession;

    @BeforeEach
    void setUp() {
        selfIntroductionRepository.deleteAll();
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

        candidateSession = sessionRepository.save(InterviewSession.builder()
                .user(candidateUser)
                .title("Candidate Interview")
                .status(InterviewStatus.NOT_STARTED)
                .interviewType(InterviewType.HR)
                .difficulty(InterviewDifficulty.MEDIUM)
                .duration(0)
                .build());

        otherSession = sessionRepository.save(InterviewSession.builder()
                .user(otherUser)
                .title("Other Interview")
                .status(InterviewStatus.NOT_STARTED)
                .interviewType(InterviewType.TECHNICAL)
                .difficulty(InterviewDifficulty.HARD)
                .duration(0)
                .build());
    }

    private String generateWords(int count) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < count; i++) {
            sb.append("word").append(i).append(" ");
        }
        return sb.toString().trim();
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void saveDraft_Success() throws Exception {
        SelfIntroductionRequest request = new SelfIntroductionRequest(candidateSession.getId(), "My draft introduction", 30);

        mockMvc.perform(post("/api/interview/self-introduction/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.sessionId", is(candidateSession.getId().intValue())))
                .andExpect(jsonPath("$.introductionText", is("My draft introduction")))
                .andExpect(jsonPath("$.wordCount", is(3)))
                .andExpect(jsonPath("$.durationSeconds", is(30)))
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void saveDraft_EmptyText_Success() throws Exception {
        // Saving an empty draft is allowed
        SelfIntroductionRequest request = new SelfIntroductionRequest(candidateSession.getId(), "", 0);

        mockMvc.perform(post("/api/interview/self-introduction/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.introductionText", is("")))
                .andExpect(jsonPath("$.wordCount", is(0)))
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void saveDraft_SessionBelongsToOther_Forbidden() throws Exception {
        SelfIntroductionRequest request = new SelfIntroductionRequest(otherSession.getId(), "Access denied text", 10);

        mockMvc.perform(post("/api/interview/self-introduction/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void submitIntroduction_Success() throws Exception {
        String introText = generateWords(100); // 100 words, valid (80-500)
        SelfIntroductionRequest request = new SelfIntroductionRequest(candidateSession.getId(), introText, 120);

        mockMvc.perform(put("/api/interview/self-introduction/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.sessionId", is(candidateSession.getId().intValue())))
                .andExpect(jsonPath("$.introductionText", is(introText)))
                .andExpect(jsonPath("$.wordCount", is(100)))
                .andExpect(jsonPath("$.durationSeconds", is(120)))
                .andExpect(jsonPath("$.status", is("SUBMITTED")))
                .andExpect(jsonPath("$.submissionTime", notNullValue()));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void submitIntroduction_TooShort_BadRequest() throws Exception {
        String introText = generateWords(79); // 79 words, invalid (<80)
        SelfIntroductionRequest request = new SelfIntroductionRequest(candidateSession.getId(), introText, 120);

        mockMvc.perform(put("/api/interview/self-introduction/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void submitIntroduction_TooLong_BadRequest() throws Exception {
        String introText = generateWords(501); // 501 words, invalid (>500)
        SelfIntroductionRequest request = new SelfIntroductionRequest(candidateSession.getId(), introText, 120);

        mockMvc.perform(put("/api/interview/self-introduction/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void submitIntroduction_Empty_BadRequest() throws Exception {
        SelfIntroductionRequest request = new SelfIntroductionRequest(candidateSession.getId(), "", 120);

        mockMvc.perform(put("/api/interview/self-introduction/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void getSelfIntroduction_NotFound() throws Exception {
        mockMvc.perform(get("/api/interview/self-introduction/" + candidateSession.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void getSelfIntroduction_Success() throws Exception {
        // Seed draft
        SelfIntroduction draft = selfIntroductionRepository.save(SelfIntroduction.builder()
                .interviewSession(candidateSession)
                .candidate(candidateUser)
                .introductionText("Already drafted self introduction")
                .wordCount(4)
                .durationSeconds(15)
                .status(SelfIntroductionStatus.DRAFT)
                .build());

        mockMvc.perform(get("/api/interview/self-introduction/" + candidateSession.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(draft.getId().intValue())))
                .andExpect(jsonPath("$.introductionText", is("Already drafted self introduction")))
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void submitIntroduction_OnlyOneSubmissionAllowed() throws Exception {
        // Seed submitted self introduction
        selfIntroductionRepository.save(SelfIntroduction.builder()
                .interviewSession(candidateSession)
                .candidate(candidateUser)
                .introductionText(generateWords(100))
                .wordCount(100)
                .durationSeconds(120)
                .status(SelfIntroductionStatus.SUBMITTED)
                .build());

        SelfIntroductionRequest request = new SelfIntroductionRequest(candidateSession.getId(), generateWords(100), 120);

        // Try to submit again, should fail
        mockMvc.perform(put("/api/interview/self-introduction/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void evaluateSelfIntroduction_Success() throws Exception {
        // Seed submitted self introduction
        selfIntroductionRepository.save(SelfIntroduction.builder()
                .interviewSession(candidateSession)
                .candidate(candidateUser)
                .introductionText("Hello, this is my final self introduction that has exactly one hundred words to pass validation checks perfectly.")
                .wordCount(18)
                .durationSeconds(45)
                .status(SelfIntroductionStatus.SUBMITTED)
                .build());

        SelfIntroductionEvaluateRequest request = new SelfIntroductionEvaluateRequest(candidateSession.getId());

        mockMvc.perform(post("/api/interview/self-introduction/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId", is(candidateSession.getId().intValue())))
                .andExpect(jsonPath("$.status", is("SUBMITTED")))
                .andExpect(jsonPath("$.communicationScore", notNullValue()))
                .andExpect(jsonPath("$.grammarScore", notNullValue()))
                .andExpect(jsonPath("$.professionalismScore", notNullValue()))
                .andExpect(jsonPath("$.resumeRelevanceScore", notNullValue()))
                .andExpect(jsonPath("$.overallScore", notNullValue()))
                .andExpect(jsonPath("$.strengths", notNullValue()))
                .andExpect(jsonPath("$.weaknesses", notNullValue()))
                .andExpect(jsonPath("$.missingInformation", notNullValue()))
                .andExpect(jsonPath("$.suggestions", notNullValue()))
                .andExpect(jsonPath("$.improvedText", notNullValue()));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void evaluateSelfIntroduction_NotSubmitted_BadRequest() throws Exception {
        // Seed draft self introduction
        selfIntroductionRepository.save(SelfIntroduction.builder()
                .interviewSession(candidateSession)
                .candidate(candidateUser)
                .introductionText("Draft introduction text")
                .wordCount(3)
                .durationSeconds(10)
                .status(SelfIntroductionStatus.DRAFT)
                .build());

        SelfIntroductionEvaluateRequest request = new SelfIntroductionEvaluateRequest(candidateSession.getId());

        mockMvc.perform(post("/api/interview/self-introduction/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void evaluateSelfIntroduction_Forbidden() throws Exception {
        SelfIntroductionEvaluateRequest request = new SelfIntroductionEvaluateRequest(otherSession.getId());

        mockMvc.perform(post("/api/interview/self-introduction/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
