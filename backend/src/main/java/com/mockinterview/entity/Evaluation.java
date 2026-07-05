package com.mockinterview.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import com.mockinterview.config.SpringContextHelper;
import org.springframework.jdbc.core.JdbcTemplate;

@Entity
@Table(name = "evaluations")
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evaluation_id")
    private Long id;

    @Transient
    private CandidateResponse candidateResponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession interviewSession;

    @Column(name = "technical_score", precision = 5, scale = 2)
    private BigDecimal technicalKnowledge; // Persistent BigDecimal score

    @Column(name = "communication_score", precision = 5, scale = 2)
    private BigDecimal communication; // Persistent BigDecimal score

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidence; // Persistent BigDecimal score

    @Column(name = "grammar_score", precision = 5, scale = 2)
    private BigDecimal grammar; // Persistent BigDecimal score

    @Column(name = "fluency_score", precision = 5, scale = 2)
    private BigDecimal fluency;

    @Transient
    private Integer relevance; // Score out of 10

    @Transient
    private Integer completeness; // Score out of 10

    @Transient
    private Integer professionalism; // Score out of 10

    @Column(name = "overall_score", precision = 5, scale = 2)
    private BigDecimal overallScore; // Calculated out of 10.0

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedbackText;

    @Transient
    private String strengths;

    @Transient
    private String weaknesses;

    @Transient
    private String suggestions;

    @Transient
    private String sampleAnswer;

    @Column(name = "evaluated_at", nullable = false)
    private LocalDateTime evaluatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        evaluatedAt = LocalDateTime.now();
        
        // Sync candidateResponse session link if set
        if (this.candidateResponse != null && this.interviewSession == null) {
            this.interviewSession = this.candidateResponse.getInterviewSession();
        }

        // Pack strengths, weaknesses, suggestions into feedback text column
        StringBuilder packed = new StringBuilder();
        if (this.feedbackText != null && !this.feedbackText.isEmpty()) {
            packed.append("Feedback: ").append(this.feedbackText).append("\n");
        }
        if (this.strengths != null && !this.strengths.isEmpty()) {
            packed.append("Strengths: ").append(this.strengths).append("\n");
        }
        if (this.weaknesses != null && !this.weaknesses.isEmpty()) {
            packed.append("Weaknesses: ").append(this.weaknesses).append("\n");
        }
        if (this.suggestions != null && !this.suggestions.isEmpty()) {
            packed.append("Suggestions: ").append(this.suggestions).append("\n");
        }
        if (this.sampleAnswer != null && !this.sampleAnswer.isEmpty()) {
            packed.append("SampleAnswer: ").append(this.sampleAnswer).append("\n");
        }
        if (packed.length() > 0) {
            this.feedbackText = packed.toString();
        }
    }

    @PostLoad
    protected void onLoad() {
        // Parse packed qualitative feedback text column back into transient properties
        if (this.feedbackText != null) {
            String[] lines = this.feedbackText.split("\n");
            for (String line : lines) {
                if (line.startsWith("Feedback: ")) {
                    this.feedbackText = line.substring(10);
                } else if (line.startsWith("Strengths: ")) {
                    this.strengths = line.substring(11);
                } else if (line.startsWith("Weaknesses: ")) {
                    this.weaknesses = line.substring(12);
                } else if (line.startsWith("Suggestions: ")) {
                    this.suggestions = line.substring(13);
                } else if (line.startsWith("SampleAnswer: ")) {
                    this.sampleAnswer = line.substring(14);
                }
            }
        }

        // Hydrate candidateResponse placeholder for session if transient context requested
        if (this.interviewSession != null && this.candidateResponse == null) {
            try {
                JdbcTemplate jdbcTemplate = SpringContextHelper.getBean(JdbcTemplate.class);
                if (jdbcTemplate != null) {
                    List<Long> respIds = jdbcTemplate.queryForList(
                            "SELECT response_id FROM candidate_responses WHERE session_id = ? ORDER BY response_id ASC LIMIT 1",
                            Long.class, this.interviewSession.getId());
                    if (!respIds.isEmpty()) {
                        CandidateResponse resp = new CandidateResponse();
                        resp.setId(respIds.get(0));
                        resp.setInterviewSession(this.interviewSession);
                        this.candidateResponse = resp;
                    }
                }
            } catch (Exception e) {
                // Ignore fallback
            }
        }
    }

    public Evaluation() {}

    public Evaluation(Long id, CandidateResponse candidateResponse, Integer technicalKnowledge, Integer communication,
                      Integer confidence, Integer grammar, Integer fluency, Integer relevance, Integer completeness, Integer professionalism,
                      Double overallScore, String feedbackText, String strengths, String weaknesses, String suggestions,
                      String sampleAnswer, LocalDateTime evaluatedAt) {
        this.id = id;
        setCandidateResponse(candidateResponse);
        setTechnicalKnowledge(technicalKnowledge);
        setCommunication(communication);
        setConfidence(confidence);
        setGrammar(grammar);
        setFluency(fluency);
        this.relevance = relevance;
        this.completeness = completeness;
        this.professionalism = professionalism;
        setOverallScore(overallScore);
        this.feedbackText = feedbackText;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.suggestions = suggestions;
        this.sampleAnswer = sampleAnswer;
        this.evaluatedAt = evaluatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CandidateResponse getCandidateResponse() {
        return candidateResponse;
    }

    public void setCandidateResponse(CandidateResponse candidateResponse) {
        this.candidateResponse = candidateResponse;
        if (candidateResponse != null && this.interviewSession == null) {
            this.interviewSession = candidateResponse.getInterviewSession();
        }
    }

    public InterviewSession getInterviewSession() {
        return interviewSession;
    }

    public void setInterviewSession(InterviewSession interviewSession) {
        this.interviewSession = interviewSession;
    }

    public Integer getTechnicalKnowledge() {
        return technicalKnowledge != null ? technicalKnowledge.intValue() : null;
    }

    public void setTechnicalKnowledge(Integer technicalKnowledge) {
        this.technicalKnowledge = technicalKnowledge != null ? BigDecimal.valueOf(technicalKnowledge) : null;
    }

    public Integer getCommunication() {
        return communication != null ? communication.intValue() : null;
    }

    public void setCommunication(Integer communication) {
        this.communication = communication != null ? BigDecimal.valueOf(communication) : null;
    }

    public Integer getConfidence() {
        return confidence != null ? confidence.intValue() : null;
    }

    public void setConfidence(Integer confidence) {
        this.confidence = confidence != null ? BigDecimal.valueOf(confidence) : null;
    }

    public Integer getGrammar() {
        return grammar != null ? grammar.intValue() : null;
    }

    public void setGrammar(Integer grammar) {
        this.grammar = grammar != null ? BigDecimal.valueOf(grammar) : null;
    }

    public Integer getFluency() {
        return fluency != null ? fluency.intValue() : null;
    }

    public void setFluency(Integer fluency) {
        this.fluency = fluency != null ? BigDecimal.valueOf(fluency) : null;
    }

    public Integer getRelevance() {
        return relevance;
    }

    public void setRelevance(Integer relevance) {
        this.relevance = relevance;
    }

    public Integer getCompleteness() {
        return completeness;
    }

    public void setCompleteness(Integer completeness) {
        this.completeness = completeness;
    }

    public Integer getProfessionalism() {
        return professionalism;
    }

    public void setProfessionalism(Integer professionalism) {
        this.professionalism = professionalism;
    }

    public Double getOverallScore() {
        return overallScore != null ? overallScore.doubleValue() : null;
    }

    public void setOverallScore(Double overallScore) {
        this.overallScore = overallScore != null ? BigDecimal.valueOf(overallScore) : null;
    }

    public String getFeedbackText() {
        return feedbackText;
    }

    public void setFeedbackText(String feedbackText) {
        this.feedbackText = feedbackText;
    }

    public String getStrengths() {
        return strengths;
    }

    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }

    public String getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(String weaknesses) {
        this.weaknesses = weaknesses;
    }

    public String getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(String suggestions) {
        this.suggestions = suggestions;
    }

    public String getSampleAnswer() {
        return sampleAnswer;
    }

    public void setSampleAnswer(String sampleAnswer) {
        this.sampleAnswer = sampleAnswer;
    }

    public LocalDateTime getEvaluatedAt() {
        return evaluatedAt;
    }

    public void setEvaluatedAt(LocalDateTime evaluatedAt) {
        this.evaluatedAt = evaluatedAt;
    }

    public static EvaluationBuilder builder() {
        return new EvaluationBuilder();
    }

    public static class EvaluationBuilder {
        private Long id;
        private CandidateResponse candidateResponse;
        private Integer technicalKnowledge;
        private Integer communication;
        private Integer confidence;
        private Integer grammar;
        private Integer fluency;
        private Integer relevance;
        private Integer completeness;
        private Integer professionalism;
        private Double overallScore;
        private String feedbackText;
        private String strengths;
        private String weaknesses;
        private String suggestions;
        private String sampleAnswer;
        private LocalDateTime evaluatedAt;

        public EvaluationBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public EvaluationBuilder candidateResponse(CandidateResponse candidateResponse) {
            this.candidateResponse = candidateResponse;
            return this;
        }

        public EvaluationBuilder technicalKnowledge(Integer technicalKnowledge) {
            this.technicalKnowledge = technicalKnowledge;
            return this;
        }

        public EvaluationBuilder communication(Integer communication) {
            this.communication = communication;
            return this;
        }

        public EvaluationBuilder confidence(Integer confidence) {
            this.confidence = confidence;
            return this;
        }

        public EvaluationBuilder grammar(Integer grammar) {
            this.grammar = grammar;
            return this;
        }

        public EvaluationBuilder fluency(Integer fluency) {
            this.fluency = fluency;
            return this;
        }

        public EvaluationBuilder relevance(Integer relevance) {
            this.relevance = relevance;
            return this;
        }

        public EvaluationBuilder completeness(Integer completeness) {
            this.completeness = completeness;
            return this;
        }

        public EvaluationBuilder professionalism(Integer professionalism) {
            this.professionalism = professionalism;
            return this;
        }

        public EvaluationBuilder overallScore(Double overallScore) {
            this.overallScore = overallScore;
            return this;
        }

        public EvaluationBuilder feedbackText(String feedbackText) {
            this.feedbackText = feedbackText;
            return this;
        }

        public EvaluationBuilder strengths(String strengths) {
            this.strengths = strengths;
            return this;
        }

        public EvaluationBuilder weaknesses(String weaknesses) {
            this.weaknesses = weaknesses;
            return this;
        }

        public EvaluationBuilder suggestions(String suggestions) {
            this.suggestions = suggestions;
            return this;
        }

        public EvaluationBuilder sampleAnswer(String sampleAnswer) {
            this.sampleAnswer = sampleAnswer;
            return this;
        }

        public EvaluationBuilder evaluatedAt(LocalDateTime evaluatedAt) {
            this.evaluatedAt = evaluatedAt;
            return this;
        }

        public Evaluation build() {
            return new Evaluation(id, candidateResponse, technicalKnowledge, communication, confidence, grammar, fluency, relevance, completeness, professionalism, overallScore, feedbackText, strengths, weaknesses, suggestions, sampleAnswer, evaluatedAt);
        }
    }
}
