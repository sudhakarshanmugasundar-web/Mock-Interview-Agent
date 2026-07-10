package com.mockinterview.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "self_introductions")
public class SelfIntroduction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession interviewSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private User candidate;

    @Column(name = "introduction_text", columnDefinition = "TEXT")
    private String introductionText;

    @Column(name = "word_count", nullable = false)
    private Integer wordCount = 0;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds = 0;

    @Column(name = "submission_time")
    private LocalDateTime submissionTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SelfIntroductionStatus status;

    @Column(name = "communication_score")
    private Integer communicationScore;

    @Column(name = "grammar_score")
    private Integer grammarScore;

    @Column(name = "professionalism_score")
    private Integer professionalismScore;

    @Column(name = "resume_relevance_score")
    private Integer resumeRelevanceScore;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "weaknesses", columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "missing_information", columnDefinition = "TEXT")
    private String missingInformation;

    @Column(name = "suggestions", columnDefinition = "TEXT")
    private String suggestions;

    @Column(name = "improved_text", columnDefinition = "TEXT")
    private String improvedText;

    public SelfIntroduction() {}

    public SelfIntroduction(Long id, InterviewSession interviewSession, User candidate, String introductionText,
                            Integer wordCount, Integer durationSeconds, LocalDateTime submissionTime,
                            SelfIntroductionStatus status, Integer communicationScore, Integer grammarScore,
                            Integer professionalismScore, Integer resumeRelevanceScore, Integer overallScore,
                            String strengths, String weaknesses, String missingInformation, String suggestions,
                            String improvedText) {
        this.id = id;
        this.interviewSession = interviewSession;
        this.candidate = candidate;
        this.introductionText = introductionText;
        this.wordCount = wordCount;
        this.durationSeconds = durationSeconds;
        this.submissionTime = submissionTime;
        this.status = status;
        this.communicationScore = communicationScore;
        this.grammarScore = grammarScore;
        this.professionalismScore = professionalismScore;
        this.resumeRelevanceScore = resumeRelevanceScore;
        this.overallScore = overallScore;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.missingInformation = missingInformation;
        this.suggestions = suggestions;
        this.improvedText = improvedText;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InterviewSession getInterviewSession() {
        return interviewSession;
    }

    public void setInterviewSession(InterviewSession interviewSession) {
        this.interviewSession = interviewSession;
    }

    public User getCandidate() {
        return candidate;
    }

    public void setCandidate(User candidate) {
        this.candidate = candidate;
    }

    public String getIntroductionText() {
        return introductionText;
    }

    public void setIntroductionText(String introductionText) {
        this.introductionText = introductionText;
    }

    public Integer getWordCount() {
        return wordCount;
    }

    public void setWordCount(Integer wordCount) {
        this.wordCount = wordCount;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public LocalDateTime getSubmissionTime() {
        return submissionTime;
    }

    public void setSubmissionTime(LocalDateTime submissionTime) {
        this.submissionTime = submissionTime;
    }

    public SelfIntroductionStatus getStatus() {
        return status;
    }

    public void setStatus(SelfIntroductionStatus status) {
        this.status = status;
    }

    public Integer getCommunicationScore() {
        return communicationScore;
    }

    public void setCommunicationScore(Integer communicationScore) {
        this.communicationScore = communicationScore;
    }

    public Integer getGrammarScore() {
        return grammarScore;
    }

    public void setGrammarScore(Integer grammarScore) {
        this.grammarScore = grammarScore;
    }

    public Integer getProfessionalismScore() {
        return professionalismScore;
    }

    public void setProfessionalismScore(Integer professionalismScore) {
        this.professionalismScore = professionalismScore;
    }

    public Integer getResumeRelevanceScore() {
        return resumeRelevanceScore;
    }

    public void setResumeRelevanceScore(Integer resumeRelevanceScore) {
        this.resumeRelevanceScore = resumeRelevanceScore;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
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

    public String getMissingInformation() {
        return missingInformation;
    }

    public void setMissingInformation(String missingInformation) {
        this.missingInformation = missingInformation;
    }

    public String getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(String suggestions) {
        this.suggestions = suggestions;
    }

    public String getImprovedText() {
        return improvedText;
    }

    public void setImprovedText(String improvedText) {
        this.improvedText = improvedText;
    }

    public static SelfIntroductionBuilder builder() {
        return new SelfIntroductionBuilder();
    }

    public static class SelfIntroductionBuilder {
        private Long id;
        private InterviewSession interviewSession;
        private User candidate;
        private String introductionText;
        private Integer wordCount = 0;
        private Integer durationSeconds = 0;
        private LocalDateTime submissionTime;
        private SelfIntroductionStatus status;
        private Integer communicationScore;
        private Integer grammarScore;
        private Integer professionalismScore;
        private Integer resumeRelevanceScore;
        private Integer overallScore;
        private String strengths;
        private String weaknesses;
        private String missingInformation;
        private String suggestions;
        private String improvedText;

        public SelfIntroductionBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public SelfIntroductionBuilder interviewSession(InterviewSession interviewSession) {
            this.interviewSession = interviewSession;
            return this;
        }

        public SelfIntroductionBuilder candidate(User candidate) {
            this.candidate = candidate;
            return this;
        }

        public SelfIntroductionBuilder introductionText(String introductionText) {
            this.introductionText = introductionText;
            return this;
        }

        public SelfIntroductionBuilder wordCount(Integer wordCount) {
            this.wordCount = wordCount;
            return this;
        }

        public SelfIntroductionBuilder durationSeconds(Integer durationSeconds) {
            this.durationSeconds = durationSeconds;
            return this;
        }

        public SelfIntroductionBuilder submissionTime(LocalDateTime submissionTime) {
            this.submissionTime = submissionTime;
            return this;
        }

        public SelfIntroductionBuilder status(SelfIntroductionStatus status) {
            this.status = status;
            return this;
        }

        public SelfIntroductionBuilder communicationScore(Integer communicationScore) {
            this.communicationScore = communicationScore;
            return this;
        }

        public SelfIntroductionBuilder grammarScore(Integer grammarScore) {
            this.grammarScore = grammarScore;
            return this;
        }

        public SelfIntroductionBuilder professionalismScore(Integer professionalismScore) {
            this.professionalismScore = professionalismScore;
            return this;
        }

        public SelfIntroductionBuilder resumeRelevanceScore(Integer resumeRelevanceScore) {
            this.resumeRelevanceScore = resumeRelevanceScore;
            return this;
        }

        public SelfIntroductionBuilder overallScore(Integer overallScore) {
            this.overallScore = overallScore;
            return this;
        }

        public SelfIntroductionBuilder strengths(String strengths) {
            this.strengths = strengths;
            return this;
        }

        public SelfIntroductionBuilder weaknesses(String weaknesses) {
            this.weaknesses = weaknesses;
            return this;
        }

        public SelfIntroductionBuilder missingInformation(String missingInformation) {
            this.missingInformation = missingInformation;
            return this;
        }

        public SelfIntroductionBuilder suggestions(String suggestions) {
            this.suggestions = suggestions;
            return this;
        }

        public SelfIntroductionBuilder improvedText(String improvedText) {
            this.improvedText = improvedText;
            return this;
        }

        public SelfIntroduction build() {
            return new SelfIntroduction(id, interviewSession, candidate, introductionText, wordCount, durationSeconds, submissionTime, status,
                    communicationScore, grammarScore, professionalismScore, resumeRelevanceScore, overallScore,
                    strengths, weaknesses, missingInformation, suggestions, improvedText);
        }
    }
}
