package com.mockinterview.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "resume_issues")
public class ResumeIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    @JsonIgnore
    private ResumeAnalysis resumeAnalysis;

    @Column(nullable = false, length = 255)
    private String problem;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String suggestion;

    @Column(name = "improved_version", columnDefinition = "TEXT")
    private String improvedVersion;

    @Column(name = "resume_section", length = 100)
    private String resumeSection;

    @Column(name = "original_text", columnDefinition = "TEXT")
    private String originalText;

    @Column(name = "error_type", length = 50)
    private String errorType;

    @Column(length = 20)
    private String severity;

    public ResumeIssue() {}

    public ResumeIssue(String problem, String reason, String suggestion, String improvedVersion) {
        this.problem = problem;
        this.reason = reason;
        this.suggestion = suggestion;
        this.improvedVersion = improvedVersion;
    }

    public ResumeIssue(String problem, String reason, String suggestion, String improvedVersion, 
                       String resumeSection, String originalText, String errorType, String severity) {
        this.problem = problem;
        this.reason = reason;
        this.suggestion = suggestion;
        this.improvedVersion = improvedVersion;
        this.resumeSection = resumeSection;
        this.originalText = originalText;
        this.errorType = errorType;
        this.severity = severity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ResumeAnalysis getResumeAnalysis() {
        return resumeAnalysis;
    }

    public void setResumeAnalysis(ResumeAnalysis resumeAnalysis) {
        this.resumeAnalysis = resumeAnalysis;
    }

    public String getProblem() {
        return problem;
    }

    public void setProblem(String problem) {
        this.problem = problem;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }

    public String getImprovedVersion() {
        return improvedVersion;
    }

    public void setImprovedVersion(String improvedVersion) {
        this.improvedVersion = improvedVersion;
    }

    public String getResumeSection() {
        return resumeSection;
    }

    public void setResumeSection(String resumeSection) {
        this.resumeSection = resumeSection;
    }

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public String getErrorType() {
        return errorType;
    }

    public void setErrorType(String errorType) {
        this.errorType = errorType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }
}
