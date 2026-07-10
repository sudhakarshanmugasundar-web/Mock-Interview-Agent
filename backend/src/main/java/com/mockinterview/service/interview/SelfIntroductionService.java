package com.mockinterview.service.interview;

import com.mockinterview.dto.interview.SelfIntroductionRequest;
import com.mockinterview.dto.interview.SelfIntroductionResponse;
import com.mockinterview.entity.*;
import com.mockinterview.exception.InvalidSessionStateException;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.mapper.SelfIntroductionMapper;
import com.mockinterview.repository.InterviewSessionRepository;
import com.mockinterview.repository.ResumeAnalysisRepository;
import com.mockinterview.repository.SelfIntroductionRepository;
import com.mockinterview.repository.UserProfileRepository;
import com.mockinterview.repository.UserRepository;
import com.mockinterview.service.ai.AiProvider;
import com.mockinterview.service.ai.SelfIntroductionEvaluationResult;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SelfIntroductionService {

    private final SelfIntroductionRepository selfIntroductionRepository;
    private final InterviewSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SelfIntroductionMapper mapper;
    private final AiProvider aiProvider;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final UserProfileRepository userProfileRepository;

    public SelfIntroductionService(SelfIntroductionRepository selfIntroductionRepository,
                                   InterviewSessionRepository sessionRepository,
                                   UserRepository userRepository,
                                   SelfIntroductionMapper mapper,
                                   AiProvider aiProvider,
                                   ResumeAnalysisRepository resumeAnalysisRepository,
                                   UserProfileRepository userProfileRepository) {
        this.selfIntroductionRepository = selfIntroductionRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
        this.aiProvider = aiProvider;
        this.resumeAnalysisRepository = resumeAnalysisRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public SelfIntroductionResponse saveDraft(String email, SelfIntroductionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        InterviewSession session = sessionRepository.findById(request.sessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with ID: " + request.sessionId()));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this session.");
        }

        SelfIntroduction selfIntroduction = selfIntroductionRepository.findByInterviewSession(session)
                .orElse(null);

        String text = request.introductionText() != null ? request.introductionText() : "";
        int wordCount = countWords(text);
        int duration = request.durationSeconds() != null ? request.durationSeconds() : 0;

        if (selfIntroduction == null) {
            selfIntroduction = SelfIntroduction.builder()
                    .interviewSession(session)
                    .candidate(user)
                    .introductionText(text)
                    .wordCount(wordCount)
                    .durationSeconds(duration)
                    .status(SelfIntroductionStatus.DRAFT)
                    .build();
        } else {
            if (selfIntroduction.getStatus() == SelfIntroductionStatus.SUBMITTED) {
                throw new InvalidSessionStateException("Self introduction has already been submitted and cannot be modified.");
            }
            selfIntroduction.setIntroductionText(text);
            selfIntroduction.setWordCount(wordCount);
            selfIntroduction.setDurationSeconds(duration);
        }

        SelfIntroduction saved = selfIntroductionRepository.save(selfIntroduction);

        // Sync with InterviewSession
        session.setSelfIntroductionDraft(text);
        sessionRepository.save(session);

        return mapper.toResponse(saved);
    }

    @Transactional
    public SelfIntroductionResponse submitIntroduction(String email, SelfIntroductionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        InterviewSession session = sessionRepository.findById(request.sessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with ID: " + request.sessionId()));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this session.");
        }

        String text = request.introductionText();
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Introduction text must not be blank");
        }

        int wordCount = countWords(text);
        if (wordCount < 80 || wordCount > 500) {
            throw new IllegalArgumentException("Self introduction must be between 80 and 500 words. Current: " + wordCount + " words.");
        }

        SelfIntroduction selfIntroduction = selfIntroductionRepository.findByInterviewSession(session)
                .orElse(null);

        int duration = request.durationSeconds() != null ? request.durationSeconds() : 0;

        if (selfIntroduction == null) {
            selfIntroduction = SelfIntroduction.builder()
                    .interviewSession(session)
                    .candidate(user)
                    .introductionText(text)
                    .wordCount(wordCount)
                    .durationSeconds(duration)
                    .submissionTime(LocalDateTime.now())
                    .status(SelfIntroductionStatus.SUBMITTED)
                    .build();
        } else {
            if (selfIntroduction.getStatus() == SelfIntroductionStatus.SUBMITTED) {
                throw new InvalidSessionStateException("Self introduction has already been submitted and cannot be modified.");
            }
            selfIntroduction.setIntroductionText(text);
            selfIntroduction.setWordCount(wordCount);
            selfIntroduction.setDurationSeconds(duration);
            selfIntroduction.setSubmissionTime(LocalDateTime.now());
            selfIntroduction.setStatus(SelfIntroductionStatus.SUBMITTED);
        }

        SelfIntroduction saved = selfIntroductionRepository.save(selfIntroduction);

        // Sync with InterviewSession
        session.setSelfIntroduction(text);
        session.setSelfIntroductionDraft(text);
        sessionRepository.save(session);

        return mapper.toResponse(saved);
    }

    @Transactional
    public SelfIntroductionResponse evaluateSelfIntroduction(String email, Long sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this session.");
        }

        SelfIntroduction selfIntroduction = selfIntroductionRepository.findByInterviewSession(session)
                .orElseThrow(() -> new ResourceNotFoundException("Self introduction not found for session ID: " + sessionId));

        if (selfIntroduction.getStatus() != SelfIntroductionStatus.SUBMITTED) {
            throw new InvalidSessionStateException("Self introduction must be submitted before generating an evaluation.");
        }

        // Get resume summary from ResumeAnalysis if available, fallback to profile bio/skills
        String resumeSummary = resumeAnalysisRepository.findFirstByUserEmailOrderByCreatedAtDesc(email)
                .map(ResumeAnalysis::getRawText)
                .orElse("");

        if (resumeSummary.isEmpty()) {
            resumeSummary = userProfileRepository.findByUserEmail(email)
                    .map(UserProfile::getBio)
                    .orElse("");
        }

        // Call AI Provider to evaluate
        SelfIntroductionEvaluationResult aiResult;
        try {
            aiResult = aiProvider.evaluateSelfIntroduction(selfIntroduction.getIntroductionText(), resumeSummary);
        } catch (Exception e) {
            throw new RuntimeException("AI evaluation failed: " + e.getMessage(), e);
        }

        // Store scores and qualitative details
        selfIntroduction.setCommunicationScore(aiResult.getCommunicationScore());
        selfIntroduction.setGrammarScore(aiResult.getGrammarScore());
        selfIntroduction.setProfessionalismScore(aiResult.getProfessionalismScore());
        selfIntroduction.setResumeRelevanceScore(aiResult.getResumeRelevanceScore());
        selfIntroduction.setOverallScore(aiResult.getOverallScore());
        selfIntroduction.setStrengths(aiResult.getStrengths());
        selfIntroduction.setWeaknesses(aiResult.getWeaknesses());
        selfIntroduction.setMissingInformation(aiResult.getMissingInformation());
        selfIntroduction.setSuggestions(aiResult.getSuggestions());
        selfIntroduction.setImprovedText(aiResult.getImprovedText());

        SelfIntroduction saved = selfIntroductionRepository.save(selfIntroduction);
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SelfIntroductionResponse getSelfIntroduction(String email, Long sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to access this session.");
        }

        SelfIntroduction selfIntroduction = selfIntroductionRepository.findByInterviewSession(session)
                .orElseThrow(() -> new ResourceNotFoundException("Self introduction not found for session ID: " + sessionId));

        return mapper.toResponse(selfIntroduction);
    }

    private int countWords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }
}
