package com.mockinterview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.dto.resume.StructuredResumeData;
import com.mockinterview.entity.*;
import com.mockinterview.repository.ExtractedResumeRepository;
import com.mockinterview.repository.RoleRepository;
import com.mockinterview.repository.UserRepository;
import com.mockinterview.service.resume.ResumeTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Import(ResumeInterviewControllerTest.TestConfig.class)
class ResumeInterviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ExtractedResumeRepository extractedResumeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User candidateUser;

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public ResumeTextExtractor testResumeTextExtractor() {
            return new ResumeTextExtractor() {
                @Override
                public String extractText(org.springframework.web.multipart.MultipartFile file) {
                    return "Spring Boot Java Developer Google Intern Stanford University AWS Certified";
                }
            };
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        extractedResumeRepository.deleteAll();
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
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void generateFromJson_Success() throws Exception {
        StructuredResumeData request = new StructuredResumeData(
                List.of("Java", "Spring Boot", "Git"),
                List.of("Java", "TypeScript"),
                List.of("Spring Boot", "React"),
                List.of("E-Commerce Portal"),
                List.of("Backend Developer Intern at Google"),
                List.of("Bachelor of Science in Computer Science"),
                List.of("AWS Certified Developer")
        );

        mockMvc.perform(post("/api/resume-interview/generate-from-json")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selfIntroduction", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.hr", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.technical", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.coding", hasSize(greaterThan(0))));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void generateFromResume_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resume.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "dummy pdf content".getBytes()
        );

        mockMvc.perform(multipart("/api/resume-interview/generate")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selfIntroduction", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.hr", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.technical", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.coding", hasSize(greaterThan(0))));
    }
}
