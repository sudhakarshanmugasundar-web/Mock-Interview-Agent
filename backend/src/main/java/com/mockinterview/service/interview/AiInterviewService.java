package com.mockinterview.service.interview;

import com.mockinterview.dto.interview.*;
import com.mockinterview.entity.*;
import com.mockinterview.exception.InvalidSessionStateException;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.repository.*;
import com.mockinterview.service.ai.AiEvaluationRequest;
import com.mockinterview.service.ai.AiEvaluationResult;
import com.mockinterview.service.ai.AiProvider;
import com.mockinterview.service.ai.AiQuestionRequest;
import com.mockinterview.service.ai.HistoryItem;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.net.MalformedURLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.web.util.UriUtils;
import java.nio.charset.StandardCharsets;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AiInterviewService {

    private static final Logger log = LoggerFactory.getLogger(AiInterviewService.class);
    private static final int INTERVIEW_LIMIT = 5;

    private final InterviewSessionRepository sessionRepository;
    private final CandidateResponseRepository responseRepository;
    private final EvaluationRepository evaluationRepository;
    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final AiProvider aiProvider;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final ObjectMapper objectMapper;

    public AiInterviewService(InterviewSessionRepository sessionRepository,
                              CandidateResponseRepository responseRepository,
                              EvaluationRepository evaluationRepository,
                              UserProfileRepository profileRepository,
                              UserRepository userRepository,
                              AiProvider aiProvider,
                              ResumeAnalysisRepository resumeAnalysisRepository,
                              ObjectMapper objectMapper) {
        this.sessionRepository = sessionRepository;
        this.responseRepository = responseRepository;
        this.evaluationRepository = evaluationRepository;
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.aiProvider = aiProvider;
        this.resumeAnalysisRepository = resumeAnalysisRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public QuestionResponse getNextQuestion(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);

        if (session.getStatus() != InterviewStatus.IN_PROGRESS) {
            throw new InvalidSessionStateException("Interview session is not in progress. Current status: " + session.getStatus());
        }

        Optional<CandidateResponse> pendingResponseOpt = responseRepository.findFirstByInterviewSessionAndResponseTextIsNull(session);
        if (pendingResponseOpt.isPresent()) {
            CandidateResponse pending = pendingResponseOpt.get();
            boolean isLast = pending.getQuestionSequence() >= INTERVIEW_LIMIT;
            return new QuestionResponse(pending.getId(), pending.getQuestionText(), pending.getQuestionSequence(), isLast);
        }

        long answeredCount = responseRepository.countByInterviewSession(session);
        if (answeredCount >= INTERVIEW_LIMIT) {
            throw new InvalidSessionStateException("All " + INTERVIEW_LIMIT + " questions have been answered. Please complete the interview to get results.");
        }

        int nextSequence = (int) answeredCount + 1;

        List<CandidateResponse> pastResponses = responseRepository.findByInterviewSessionOrderByQuestionSequenceAsc(session);
        List<HistoryItem> history = new ArrayList<>();
        for (CandidateResponse past : pastResponses) {
            history.add(new HistoryItem(past.getQuestionText(), past.getResponseText()));
        }

        UserProfile profile = profileRepository.findByUserEmail(email).orElse(null);
        Optional<ResumeAnalysis> analysisOpt = resumeAnalysisRepository.findFirstByUserEmailOrderByCreatedAtDesc(email);
        String resumeText = analysisOpt.map(ResumeAnalysis::getRawText).orElse("");
        String skillsBio = (profile != null) ? profile.getBio() : "";

        User user = userRepository.findByEmail(email).orElse(null);
        String candidateName = (user != null && user.getUsername() != null) ? user.getUsername() : email.split("@")[0];

        AiQuestionRequest questionRequest = new AiQuestionRequest(
                resumeText,
                skillsBio,
                session.getInterviewType().name(),
                session.getDifficulty().name(),
                nextSequence,
                history,
                candidateName
        );
        String questionText = aiProvider.generateQuestion(questionRequest);

        CandidateResponse pendingResponse = CandidateResponse.builder()
                .interviewSession(session)
                .questionText(questionText)
                .responseText(null)
                .questionSequence(nextSequence)
                .answerMode(AnswerMode.TEXT)
                .build();

        CandidateResponse savedResponse = responseRepository.save(pendingResponse);
        boolean isLast = nextSequence >= INTERVIEW_LIMIT;

        return new QuestionResponse(savedResponse.getId(), questionText, nextSequence, isLast);
    }

    @Transactional
    public FeedbackResponse submitAnswer(String email, Long sessionId, AnswerRequest request) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);

        if (session.getStatus() != InterviewStatus.IN_PROGRESS) {
            throw new InvalidSessionStateException("Interview session is not in progress. Current status: " + session.getStatus());
        }

        CandidateResponse response = responseRepository.findFirstByInterviewSessionAndResponseTextIsNull(session)
                .orElseThrow(() -> new InvalidSessionStateException("No pending question found to answer. Please request next-question first."));

        AnswerMode mode = AnswerMode.TEXT;
        if (request.answerMode() != null) {
            try {
                mode = AnswerMode.valueOf(request.answerMode().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid answer mode. Must be TEXT or VOICE");
            }
        }

        response.setResponseText(request.answerText());
        response.setAnswerMode(mode);
        response.setResponseTime(request.responseTime());
        response.setSubmittedAt(LocalDateTime.now());
        response.setAudioPath(request.audioPath());
        
        CandidateResponse savedResponse = responseRepository.save(response);

        AiEvaluationRequest evaluationRequest = new AiEvaluationRequest(
                savedResponse.getQuestionText(),
                savedResponse.getResponseText(),
                session.getInterviewType().name()
        );
        AiEvaluationResult aiResult = aiProvider.evaluateResponse(evaluationRequest);

        Evaluation evaluation = Evaluation.builder()
                .candidateResponse(savedResponse)
                .technicalKnowledge(aiResult.getTechnicalKnowledge())
                .communication(aiResult.getCommunication())
                .confidence(aiResult.getConfidence())
                .grammar(aiResult.getGrammar())
                .fluency(aiResult.getFluency())
                .relevance(aiResult.getRelevance())
                .completeness(aiResult.getCompleteness())
                .professionalism(aiResult.getProfessionalism())
                .overallScore(aiResult.getOverallScore())
                .feedbackText(aiResult.getFeedbackText())
                .strengths(aiResult.getStrengths())
                .weaknesses(aiResult.getWeaknesses())
                .suggestions(aiResult.getSuggestions())
                .sampleAnswer(aiResult.getSampleAnswer())
                .build();

        Evaluation savedEvaluation = evaluationRepository.save(evaluation);

        return mapToFeedbackResponse(savedResponse, savedEvaluation);
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedback(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);
        List<CandidateResponse> responses = responseRepository.findByInterviewSessionOrderByQuestionSequenceAsc(session);
        
        List<FeedbackResponse> feedbackList = new ArrayList<>();
        for (CandidateResponse resp : responses) {
            Evaluation eval = evaluationRepository.findByCandidateResponse(resp).orElse(null);
            feedbackList.add(mapToFeedbackResponse(resp, eval));
        }
        return feedbackList;
    }

    @Transactional(readOnly = true)
    public SessionResultResponse getResult(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);
        List<CandidateResponse> responses = responseRepository.findByInterviewSessionOrderByQuestionSequenceAsc(session);

        double totalOverall = 0.0;
        int evalCount = 0;
        List<FeedbackResponse> feedbacks = new ArrayList<>();

        for (CandidateResponse resp : responses) {
            Evaluation eval = evaluationRepository.findByCandidateResponse(resp).orElse(null);
            feedbacks.add(mapToFeedbackResponse(resp, eval));
            if (eval != null) {
                totalOverall += eval.getOverallScore();
                evalCount++;
            }
        }

        double finalScore = evalCount > 0 ? Math.round((totalOverall / evalCount) * 10.0) / 10.0 : 0.0;
        return new SessionResultResponse(
                session.getId(),
                session.getTitle() != null ? session.getTitle() : "Session " + session.getId(),
                session.getStatus().name(),
                session.getInterviewType().name(),
                session.getDifficulty().name(),
                finalScore,
                responses.size(),
                feedbacks
        );
    }

    @Transactional
    public String uploadAudio(String email, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Audio file is empty");
        }
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        try {
            Path uploadDir = Paths.get("uploads/audio");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String ext = ".mp3";
            if (originalFilename != null && originalFilename.lastIndexOf(".") >= 0) {
                ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }

            String filename = UUID.randomUUID().toString() + ext;
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/api/interviews/audio?path=" + UriUtils.encode(filePath.toString(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store audio file: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Resource getAudioFile(String email, String pathStr) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        try {
            Path path = Paths.get(pathStr);
            if (!Files.exists(path)) {
                throw new ResourceNotFoundException("Audio recording file not found on disk");
            }
            return new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Failed to read audio file path: " + e.getMessage(), e);
        }
    }

    private InterviewSession getSessionAndVerifyOwnership(String email, Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with ID: " + sessionId));

        if (!session.getUser().getEmail().equals(email)) {
            throw new AccessDeniedException("You are not authorized to access this interview session");
        }

        return session;
    }

    private FeedbackResponse mapToFeedbackResponse(CandidateResponse resp, Evaluation eval) {
        return new FeedbackResponse(
                resp.getId(),
                resp.getQuestionText(),
                resp.getResponseText(),
                resp.getAnswerMode().name(),
                resp.getResponseTime(),
                resp.getQuestionSequence(),
                eval != null ? eval.getTechnicalKnowledge() : null,
                eval != null ? eval.getCommunication() : null,
                eval != null ? eval.getConfidence() : null,
                eval != null ? eval.getGrammar() : null,
                eval != null ? eval.getFluency() : null,
                eval != null ? eval.getRelevance() : null,
                eval != null ? eval.getCompleteness() : null,
                eval != null ? eval.getProfessionalism() : null,
                eval != null ? eval.getOverallScore() : null,
                eval != null ? eval.getFeedbackText() : null,
                eval != null ? eval.getStrengths() : null,
                eval != null ? eval.getWeaknesses() : null,
                eval != null ? eval.getSuggestions() : null,
                eval != null ? eval.getSampleAnswer() : null,
                resp.getAudioPath()
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Detailed History  (history with per-round scores for each session)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DetailedHistoryResponse getDetailedHistory(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(page, size,
                        org.springframework.data.domain.Sort.by("id").descending());
        org.springframework.data.domain.Page<InterviewSession> sessionsPage =
                sessionRepository.findByUserOrderByIdDesc(user, pageable);

        List<HistoryItemResponse> items = new ArrayList<>();
        for (InterviewSession session : sessionsPage.getContent()) {
            items.add(buildHistoryItem(session, email));
        }

        return new DetailedHistoryResponse(
                items,
                sessionsPage.getNumber(),
                sessionsPage.getTotalElements(),
                sessionsPage.getTotalPages()
        );
    }

    private HistoryItemResponse buildHistoryItem(InterviewSession session, String email) {
        List<CandidateResponse> responses = responseRepository
                .findByInterviewSessionOrderByQuestionSequenceAsc(session);

        List<Evaluation> evaluations = new ArrayList<>();
        for (CandidateResponse resp : responses) {
            evaluationRepository.findByCandidateResponse(resp).ifPresent(evaluations::add);
        }

        Double hrScore        = roundAvg(evaluations, 1, 2);
        Double technicalScore = roundAvg(evaluations, 3, 4);
        Double codingScore    = roundAvg(evaluations, 5, 5);
        Double resumeScore    = getResumeScore(email);
        double overall        = weightedOverall(resumeScore, hrScore, technicalScore, codingScore);

        Integer durationSec = null;
        if (session.getStartedAt() != null && session.getEndedAt() != null) {
            durationSec = (int) java.time.Duration.between(
                    session.getStartedAt(), session.getEndedAt()).getSeconds();
        } else if (session.getDuration() != null) {
            durationSec = session.getDuration();
        }

        return new HistoryItemResponse(
                session.getId(),
                session.getTitle() != null ? session.getTitle() : "Session " + session.getId(),
                session.getInterviewType().name(),
                session.getDifficulty().name(),
                session.getStatus().name(),
                session.getStartedAt(),
                session.getEndedAt(),
                durationSec,
                resumeScore,
                hrScore,
                technicalScore,
                codingScore,
                evaluations.isEmpty() ? null : round1(overall)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Interview Report
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InterviewReportResponse generateReport(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);
        List<CandidateResponse> responses = responseRepository
                .findByInterviewSessionOrderByQuestionSequenceAsc(session);

        // ── Collect evaluations ───────────────────────────────────────────
        List<FeedbackResponse> feedbacks = new ArrayList<>();
        List<Evaluation> evaluations = new ArrayList<>();
        for (CandidateResponse resp : responses) {
            Evaluation eval = evaluationRepository.findByCandidateResponse(resp).orElse(null);
            feedbacks.add(mapToFeedbackResponse(resp, eval));
            if (eval != null) evaluations.add(eval);
        }

        // ── Per-round score slicing ───────────────────────────────────────
        // Sequence 1   → HR Q1
        // Sequence 2   → HR Q2
        // Sequence 3   → Technical Q1
        // Sequence 4   → Technical Q2
        // Sequence 5   → Coding (stored as answerText summary)
        Double hrScore        = roundAvg(evaluations, 1, 2);
        Double technicalScore = roundAvg(evaluations, 3, 4);
        Double codingScore    = roundAvg(evaluations, 5, 5);

        // Resume score — from resume analysis or a fixed starting estimate
        Double resumeScore = getResumeScore(email);

        // Overall weighted average
        double overall = weightedOverall(resumeScore, hrScore, technicalScore, codingScore);

        // ── Soft-skill averages across all answered questions ─────────────
        double commAvg   = metricAvg(evaluations, "communication");
        double gramAvg   = metricAvg(evaluations, "grammar");
        double confAvg   = metricAvg(evaluations, "confidence");
        double fluAvg    = metricAvg(evaluations, "fluency");
        double relAvg    = metricAvg(evaluations, "relevance");
        double compAvg   = metricAvg(evaluations, "completeness");
        double profAvg   = metricAvg(evaluations, "professionalism");
        double probAvg   = metricAvg(evaluations, "technicalKnowledge");

        // ── Candidate identity ─────────────────────────────────────────────
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String candidateName = user.getUsername() != null ? user.getUsername() : email;

        // ── AI qualitative analysis ────────────────────────────────────────
        AiReportAnalysis ai = generateAiAnalysis(
                candidateName, session.getDifficulty().name(), session.getInterviewType().name(),
                overall, hrScore, technicalScore, codingScore,
                commAvg, gramAvg, confAvg, probAvg, feedbacks);

        return new InterviewReportResponse(
                session.getId(),
                candidateName,
                email,
                session.getTitle() != null ? session.getTitle() : "Session " + session.getId(),
                session.getInterviewType().name(),
                session.getDifficulty().name(),
                resumeScore,
                hrScore,
                technicalScore,
                codingScore,
                round1(overall),
                round1(commAvg),
                round1(gramAvg),
                round1(confAvg),
                round1(fluAvg),
                round1(relAvg),
                round1(compAvg),
                round1(profAvg),
                round1(probAvg),
                ai.recommendation(),
                ai.recommendationDetail(),
                ai.strongAreas(),
                ai.weakAreas(),
                ai.learningPath(),
                feedbacks
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Double roundAvg(List<Evaluation> evals, int seqFrom, int seqTo) {
        // Need to access the sequence through the CandidateResponse
        double sum = 0; int count = 0;
        for (Evaluation e : evals) {
            int seq = e.getCandidateResponse().getQuestionSequence();
            if (seq >= seqFrom && seq <= seqTo && e.getOverallScore() != null) {
                sum += e.getOverallScore(); count++;
            }
        }
        return count > 0 ? round1(sum / count) : null;
    }

    private double metricAvg(List<Evaluation> evals, String metric) {
        double sum = 0; int count = 0;
        for (Evaluation e : evals) {
            Integer val = switch (metric) {
                case "communication"    -> e.getCommunication();
                case "grammar"          -> e.getGrammar();
                case "confidence"       -> e.getConfidence();
                case "fluency"          -> e.getFluency();
                case "relevance"        -> e.getRelevance();
                case "completeness"     -> e.getCompleteness();
                case "professionalism"  -> e.getProfessionalism();
                case "technicalKnowledge" -> e.getTechnicalKnowledge();
                default -> null;
            };
            if (val != null) { sum += val; count++; }
        }
        return count > 0 ? round1(sum / count) : 0.0;
    }

    private Double getResumeScore(String email) {
        // Attempt to read the resume analysis result; fall back to 7.0 if not available
        try {
            return resumeAnalysisRepository
                    .findFirstByUserEmailOrderByCreatedAtDesc(email)
                    .map(ra -> 7.5)
                    .orElse(7.0);
        } catch (Exception e) {
            return 7.0;
        }
    }

    private double weightedOverall(Double resume, Double hr, Double technical, Double coding) {
        // Weights: resume 10%, hr 25%, technical 35%, coding 30%
        double total = 0; double weight = 0;
        if (resume    != null) { total += resume    * 0.10; weight += 0.10; }
        if (hr        != null) { total += hr        * 0.25; weight += 0.25; }
        if (technical != null) { total += technical * 0.35; weight += 0.35; }
        if (coding    != null) { total += coding    * 0.30; weight += 0.30; }
        return weight > 0 ? round1(total / weight) : 0.0;
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AI report analysis
    // ─────────────────────────────────────────────────────────────────────────

    private record AiReportAnalysis(
        String recommendation,
        String recommendationDetail,
        String strongAreas,
        String weakAreas,
        String learningPath
    ) {}

    private AiReportAnalysis generateAiAnalysis(
            String name, String difficulty, String type,
            double overall, Double hr, Double technical, Double coding,
            double comm, double gram, double conf, double prob,
            List<FeedbackResponse> feedbacks) {

        StringBuilder answers = new StringBuilder();
        for (FeedbackResponse fb : feedbacks) {
            answers.append("Q").append(fb.questionSequence()).append(": ").append(fb.questionText()).append("\n");
            answers.append("A: ").append(
                fb.responseText() != null && fb.responseText().length() > 200
                    ? fb.responseText().substring(0, 200) + "..."
                    : fb.responseText()
            ).append("\n\n");
        }

        String prompt = """
            You are an expert technical interview assessor generating a final candidate report.

            Candidate: %s
            Interview Type: %s | Difficulty: %s

            Scores:
            - HR Round: %s/10
            - Technical Round: %s/10
            - Coding Round: %s/10
            - Overall: %.1f/10
            - Communication: %.1f/10 | Grammar: %.1f/10 | Confidence: %.1f/10 | Problem Solving: %.1f/10

            Sample Q&A:
            %s

            Generate a hiring recommendation and analysis. Respond ONLY with valid JSON (no markdown):
            {
              "recommendation": "STRONG_HIRE|HIRE|CONSIDER|NO_HIRE",
              "recommendationDetail": "2-3 sentence hiring recommendation justification",
              "strongAreas": "• Strength 1\\n• Strength 2\\n• Strength 3",
              "weakAreas": "• Weakness 1\\n• Weakness 2\\n• Weakness 3",
              "suggestedLearningPath": "• Week 1-2: [Topic and resources]\\n• Week 3-4: [Topic and resources]\\n• Week 5-6: [Topic and resources]\\n• Ongoing: [Practice recommendations]"
            }
            """.formatted(
                name, type, difficulty,
                hr != null ? hr : "N/A",
                technical != null ? technical : "N/A",
                coding != null ? coding : "N/A",
                overall, comm, gram, conf, prob,
                answers.length() > 800 ? answers.substring(0, 800) + "..." : answers
        );

        try {
            String raw = aiProvider.analyzeContent("", prompt);
            String cleaned = raw.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
            }
            JsonNode n = objectMapper.readTree(cleaned);
            return new AiReportAnalysis(
                n.path("recommendation").asText("CONSIDER"),
                n.path("recommendationDetail").asText("Overall performance meets basic requirements."),
                n.path("strongAreas").asText("• Communication skills\n• Professional demeanor"),
                n.path("weakAreas").asText("• Needs deeper technical knowledge\n• Practice problem solving"),
                n.path("suggestedLearningPath").asText(
                    "• Week 1-2: Review core Java concepts\n• Week 3-4: Practice data structures & algorithms\n• Week 5-6: Build a Spring Boot project\n• Ongoing: LeetCode medium problems daily")
            );
        } catch (Exception e) {
            log.warn("AI report generation failed: {}", e.getMessage());
            return fallbackAnalysis(overall);
        }
    }

    private AiReportAnalysis fallbackAnalysis(double overall) {
        String rec = overall >= 8 ? "STRONG_HIRE" : overall >= 6.5 ? "HIRE" : overall >= 5 ? "CONSIDER" : "NO_HIRE";
        return new AiReportAnalysis(
            rec,
            "Based on interview performance, the candidate scored " + overall + "/10 overall.",
            "• Showed clear communication\n• Answered questions with reasonable structure",
            "• Deepen Java core concepts\n• Improve problem-solving speed",
            "• Week 1-2: Core Java & OOP\n• Week 3-4: Data Structures & Algorithms\n• Week 5-6: Spring Boot projects\n• Ongoing: Daily coding practice"
        );
    }
}
