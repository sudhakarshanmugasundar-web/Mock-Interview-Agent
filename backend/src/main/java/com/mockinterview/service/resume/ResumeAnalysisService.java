package com.mockinterview.service.resume;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.entity.ResumeAnalysis;
import com.mockinterview.entity.ResumeIssue;
import com.mockinterview.entity.User;
import com.mockinterview.entity.UserProfile;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.repository.ResumeAnalysisRepository;
import com.mockinterview.repository.UserProfileRepository;
import com.mockinterview.repository.UserRepository;
import com.mockinterview.service.ai.AiProvider;
import com.mockinterview.service.user.UserProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class ResumeAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(ResumeAnalysisService.class);

    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileService userProfileService;
    private final ResumeTextExtractor resumeTextExtractor;
    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper;

    public ResumeAnalysisService(ResumeAnalysisRepository resumeAnalysisRepository,
                                 UserRepository userRepository,
                                 UserProfileRepository userProfileRepository,
                                 UserProfileService userProfileService,
                                 ResumeTextExtractor resumeTextExtractor,
                                 AiProvider aiProvider,
                                 ObjectMapper objectMapper) {
        this.resumeAnalysisRepository = resumeAnalysisRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userProfileService = userProfileService;
        this.resumeTextExtractor = resumeTextExtractor;
        this.aiProvider = aiProvider;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ResumeAnalysis analyzeResume(String email, MultipartFile file) throws IOException {
        // 1. Upload and save the resume to the profile
        userProfileService.uploadResume(email, file);

        // 2. Load the User and UserProfile details
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + email));

        // 3. Extract raw text from document
        String rawText = resumeTextExtractor.extractText(file);

        // 4. Construct AI Prompt
        String prompt = "You are an expert ATS (Applicant Tracking System) scanner, technical recruiter, and professional resume editor.\n" +
                "Perform a thorough audit of the following candidate resume text.\n" +
                "Detect:\n" +
                "- Grammar, spelling, and typing mistakes.\n" +
                "- Weak, passive, or unprofessional sentences.\n" +
                "- Poor formatting or structural defects.\n" +
                "- Missing sections (e.g. Projects, Certifications, Experience, Skills).\n" +
                "- Duplicate or unnecessary content.\n" +
                "- Weak action verbs and missing critical technical keywords.\n\n" +
                "Evaluate the resume and calculate five scores from 0 to 100:\n" +
                "- atsScore: ATS parsing compatibility and keyword alignment.\n" +
                "- grammarScore: spelling, typo, and grammar correctness.\n" +
                "- skillsScore: evaluation of technical skills and programming tools.\n" +
                "- professionalismScore: style, tone, and action verb index.\n" +
                "- resumeQualityScore: overall completeness and readability rating.\n\n" +
                "Also identify a detailed list of individual issues/mistakes. For every issue/mistake, provide:\n" +
                "- problem: name of the issue (e.g. \"Spelling typo 'expereince'\").\n" +
                "- reason: why it hinders the candidate's screening.\n" +
                "- suggestion: steps to fix the issue.\n" +
                "- improvedVersion: a revised sentence, keyword set, or layout to replace the issue with.\n" +
                "- resumeSection: the specific section of the resume (e.g. \"Work Experience\", \"Education\", \"Skills\", \"Summary\", \"Projects\", \"Certifications\", \"Header\").\n" +
                "- originalText: the exact text segment containing the issue from the candidate's original resume (set to \"None\" if it is a missing section/field).\n" +
                "- errorType: category of mistake (e.g. \"Grammar\", \"Spelling\", \"Formatting\", \"ATS Keyword\", \"Action Verb\", \"Completeness\").\n" +
                "- severity: severity level (either \"Low\", \"Medium\", or \"High\").\n\n" +
                "Respond ONLY with a valid JSON object matching the following structure:\n" +
                "{\n" +
                "  \"atsScore\": 85,\n" +
                "  \"grammarScore\": 90,\n" +
                "  \"skillsScore\": 82,\n" +
                "  \"professionalismScore\": 88,\n" +
                "  \"resumeQualityScore\": 86,\n" +
                "  \"issues\": [\n" +
                "    {\n" +
                "      \"problem\": \"...\",\n" +
                "      \"reason\": \"...\",\n" +
                "      \"suggestion\": \"...\",\n" +
                "      \"improvedVersion\": \"...\",\n" +
                "      \"resumeSection\": \"...\",\n" +
                "      \"originalText\": \"...\",\n" +
                "      \"errorType\": \"...\",\n" +
                "      \"severity\": \"...\"\n" +
                "    }\n" +
                "  ]\n" +
                "}\n" +
                "Do not include markdown code block characters (like ```json) or any conversational text before or after the JSON.";

        // 5. Call AI Provider
        String aiResponse = aiProvider.analyzeContent(rawText, prompt);

        // 6. Clean markdown JSON formatting if necessary
        String cleanedJson = aiResponse.trim();
        if (cleanedJson.startsWith("```json")) {
            cleanedJson = cleanedJson.substring(7);
        }
        if (cleanedJson.startsWith("```")) {
            cleanedJson = cleanedJson.substring(3);
        }
        if (cleanedJson.endsWith("```")) {
            cleanedJson = cleanedJson.substring(0, cleanedJson.length() - 3);
        }
        cleanedJson = cleanedJson.trim();

        // 7. Parse and populate ResumeAnalysis entity
        ResumeAnalysis analysis = new ResumeAnalysis();
        analysis.setUser(user);
        analysis.setResumeUrl(profile.getResumeUrl());
        analysis.setRawText(rawText);

        try {
            JsonNode rootNode = objectMapper.readTree(cleanedJson);
            analysis.setAtsScore(rootNode.path("atsScore").asInt(70));
            analysis.setGrammarScore(rootNode.path("grammarScore").asInt(75));
            analysis.setSkillsScore(rootNode.path("skillsScore").asInt(70));
            analysis.setProfessionalismScore(rootNode.path("professionalismScore").asInt(75));
            analysis.setResumeQualityScore(rootNode.path("resumeQualityScore").asInt(70));

            JsonNode issuesNode = rootNode.path("issues");
            if (issuesNode.isArray()) {
                for (JsonNode issueNode : issuesNode) {
                    ResumeIssue issue = new ResumeIssue(
                            issueNode.path("problem").asText("Resume Issue"),
                            issueNode.path("reason").asText("Poorly phrased content."),
                            issueNode.path("suggestion").asText("Revise this block for clarity."),
                            issueNode.path("improvedVersion").asText(""),
                            issueNode.path("resumeSection").asText("Summary"),
                            issueNode.path("originalText").asText("N/A"),
                            issueNode.path("errorType").asText("Formatting"),
                            issueNode.path("severity").asText("Medium")
                    );
                    analysis.addIssue(issue);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse resume analysis JSON from AI: {}. Raw response: {}", e.getMessage(), aiResponse);
            // Default fallbacks
            analysis.setAtsScore(65);
            analysis.setGrammarScore(70);
            analysis.setSkillsScore(68);
            analysis.setProfessionalismScore(70);
            analysis.setResumeQualityScore(68);
            
            ResumeIssue fallbackIssue = new ResumeIssue(
                    "AI Parsing Error",
                    "We encountered an issue parsing the AI's detailed response layout.",
                    "Review your resume content for non-standard characters or reload.",
                    "",
                    "System",
                    "N/A",
                    "System Error",
                    "High"
            );
            analysis.addIssue(fallbackIssue);
        }

        return resumeAnalysisRepository.save(analysis);
    }

    @Transactional(readOnly = true)
    public ResumeAnalysis getLatestAnalysis(String email) {
        return resumeAnalysisRepository.findFirstByUserEmailOrderByCreatedAtDesc(email)
                .orElse(null);
    }
}
