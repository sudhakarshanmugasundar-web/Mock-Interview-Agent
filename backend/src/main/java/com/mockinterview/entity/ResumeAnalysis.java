package com.mockinterview.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resume_analyses")
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "resume_url", nullable = false, length = 500)
    private String resumeUrl;

    @Column(name = "raw_text", columnDefinition = "LONGTEXT")
    private String rawText;

    @Column(name = "ats_score", nullable = false)
    private int atsScore;

    @Column(name = "grammar_score", nullable = false)
    private int grammarScore;

    @Column(name = "professionalism_score", nullable = false)
    private int professionalismScore;

    @Column(name = "resume_quality_score", nullable = false)
    private int resumeQualityScore;

    @Column(name = "skills_score", nullable = false)
    private int skillsScore;

    @Column(name = "optimized_resume", columnDefinition = "LONGTEXT")
    private String optimizedResume;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "resumeAnalysis", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeIssue> issues = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public ResumeAnalysis() {}

    public ResumeAnalysis(User user, String resumeUrl, String rawText, int atsScore, int grammarScore, int professionalismScore, int resumeQualityScore, String optimizedResume) {
        this.user = user;
        this.resumeUrl = resumeUrl;
        this.rawText = rawText;
        this.atsScore = atsScore;
        this.grammarScore = grammarScore;
        this.professionalismScore = professionalismScore;
        this.resumeQualityScore = resumeQualityScore;
        this.optimizedResume = optimizedResume;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public void setResumeUrl(String resumeUrl) {
        this.resumeUrl = resumeUrl;
    }

    public String getRawText() {
        return rawText;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }

    public int getAtsScore() {
        return atsScore;
    }

    public void setAtsScore(int atsScore) {
        this.atsScore = atsScore;
    }

    public int getGrammarScore() {
        return grammarScore;
    }

    public void setGrammarScore(int grammarScore) {
        this.grammarScore = grammarScore;
    }

    public int getProfessionalismScore() {
        return professionalismScore;
    }

    public void setProfessionalismScore(int professionalismScore) {
        this.professionalismScore = professionalismScore;
    }

    public int getResumeQualityScore() {
        return resumeQualityScore;
    }

    public void setResumeQualityScore(int resumeQualityScore) {
        this.resumeQualityScore = resumeQualityScore;
    }

    public int getSkillsScore() {
        return skillsScore;
    }

    public void setSkillsScore(int skillsScore) {
        this.skillsScore = skillsScore;
    }

    public String getOptimizedResume() {
        return optimizedResume;
    }

    public void setOptimizedResume(String optimizedResume) {
        this.optimizedResume = optimizedResume;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<ResumeIssue> getIssues() {
        return issues;
    }

    public void setIssues(List<ResumeIssue> issues) {
        this.issues = issues;
    }

    public void addIssue(ResumeIssue issue) {
        issues.add(issue);
        issue.setResumeAnalysis(this);
    }

    public void removeIssue(ResumeIssue issue) {
        issues.remove(issue);
        issue.setResumeAnalysis(null);
    }
}
