package com.mockinterview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.dto.user.UserProfileRequest;
import com.mockinterview.entity.Role;
import com.mockinterview.entity.RoleName;
import com.mockinterview.entity.User;
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

import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role candidateRole = roleRepository.save(Role.builder().name(RoleName.ROLE_CANDIDATE).build());

        Set<Role> roles = new HashSet<>();
        roles.add(candidateRole);

        testUser = User.builder()
                .email("candidate@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .roles(roles)
                .enabled(true)
                .build();
        userRepository.save(testUser);
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void getProfile_DefaultEmptyValues_Success() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("candidate@test.com")))
                .andExpect(jsonPath("$.firstName", nullValue()))
                .andExpect(jsonPath("$.bio", nullValue()));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void updateProfile_Success() throws Exception {
        UserProfileRequest request = new UserProfileRequest("John", "Doe", "AI software developer", "https://resume.url");

        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("candidate@test.com")))
                .andExpect(jsonPath("$.firstName", is("John")))
                .andExpect(jsonPath("$.lastName", is("Doe")))
                .andExpect(jsonPath("$.bio", is("AI software developer")))
                .andExpect(jsonPath("$.resumeUrl", is("https://resume.url")));
    }

    @Test
    void getProfile_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void uploadResume_Success() throws Exception {
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "myresume.pdf", MediaType.APPLICATION_PDF_VALUE, "PDF content".getBytes());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/users/profile/resume")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeUrl", org.hamcrest.Matchers.containsString("filename=myresume.pdf")));
    }

    @Test
    @WithMockUser(username = "candidate@test.com")
    void uploadResume_InvalidExtension_BadRequest() throws Exception {
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "myresume.exe", MediaType.APPLICATION_OCTET_STREAM_VALUE, "content".getBytes());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/users/profile/resume")
                        .file(file))
                .andExpect(status().isBadRequest());
    }
}
