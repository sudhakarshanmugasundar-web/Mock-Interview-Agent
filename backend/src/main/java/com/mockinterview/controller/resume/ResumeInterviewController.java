package com.mockinterview.controller.resume;

import com.mockinterview.dto.interview.ResumeQuestionsResponse;
import com.mockinterview.dto.resume.StructuredResumeData;
import com.mockinterview.entity.ExtractedResume;
import com.mockinterview.entity.User;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.repository.ExtractedResumeRepository;
import com.mockinterview.repository.UserRepository;
import com.mockinterview.service.interview.QuestionGenerationService;
import com.mockinterview.service.resume.ResumeStructureExtractor;
import com.mockinterview.service.resume.ResumeTextExtractor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/resume-interview")
public class ResumeInterviewController {

    private final ResumeTextExtractor resumeTextExtractor;
    private final ResumeStructureExtractor resumeStructureExtractor;
    private final ExtractedResumeRepository extractedResumeRepository;
    private final UserRepository userRepository;
    private final QuestionGenerationService questionGenerationService;

    public ResumeInterviewController(ResumeTextExtractor resumeTextExtractor,
                                     ResumeStructureExtractor resumeStructureExtractor,
                                     ExtractedResumeRepository extractedResumeRepository,
                                     UserRepository userRepository,
                                     QuestionGenerationService questionGenerationService) {
        this.resumeTextExtractor = resumeTextExtractor;
        this.resumeStructureExtractor = resumeStructureExtractor;
        this.extractedResumeRepository = extractedResumeRepository;
        this.userRepository = userRepository;
        this.questionGenerationService = questionGenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ResumeQuestionsResponse> generateFromResume(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // 1. Load User
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));

            // 2. Extract raw text from file
            String rawText = resumeTextExtractor.extractText(file);

            // 3. Extract structures
            StructuredResumeData structuredData = resumeStructureExtractor.extractStructure(rawText);

            // 4. Store/Save to DB in structured model
            ExtractedResume entity = new ExtractedResume();
            entity.setUser(user);
            entity.setSkills(joinList(structuredData.skills()));
            entity.setProgrammingLanguages(joinList(structuredData.programmingLanguages()));
            entity.setFrameworks(joinList(structuredData.frameworks()));
            entity.setProjects(joinList(structuredData.projects()));
            entity.setExperience(joinList(structuredData.experience()));
            entity.setEducation(joinList(structuredData.education()));
            entity.setCertifications(joinList(structuredData.certifications()));
            
            extractedResumeRepository.save(entity);

            // 5. Generate Questions
            ResumeQuestionsResponse questions = questionGenerationService.generateQuestions(structuredData);

            return ResponseEntity.ok(questions);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read resume file: " + e.getMessage(), e);
        }
    }

    @PostMapping("/generate-from-json")
    public ResponseEntity<ResumeQuestionsResponse> generateFromJson(
            @RequestBody StructuredResumeData structuredData,
            @AuthenticationPrincipal UserDetails userDetails) {
        // 1. Load User
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));

        // 2. Store/Save to DB in structured model
        ExtractedResume entity = new ExtractedResume();
        entity.setUser(user);
        entity.setSkills(joinList(structuredData.skills()));
        entity.setProgrammingLanguages(joinList(structuredData.programmingLanguages()));
        entity.setFrameworks(joinList(structuredData.frameworks()));
        entity.setProjects(joinList(structuredData.projects()));
        entity.setExperience(joinList(structuredData.experience()));
        entity.setEducation(joinList(structuredData.education()));
        entity.setCertifications(joinList(structuredData.certifications()));

        extractedResumeRepository.save(entity);

        // 3. Generate Questions
        ResumeQuestionsResponse questions = questionGenerationService.generateQuestions(structuredData);

        return ResponseEntity.ok(questions);
    }

    private String joinList(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "";
        }
        return String.join(", ", list);
    }
}
