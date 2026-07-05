package com.mockinterview.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "technical_questions")
public class TechnicalQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long id;

    @Column(name = "question", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "subject", length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty")
    private InterviewDifficulty difficulty;

    public TechnicalQuestion() {}

    public TechnicalQuestion(Long id, String questionText, String category, InterviewDifficulty difficulty) {
        this.id = id;
        this.questionText = questionText;
        this.category = category;
        this.difficulty = difficulty;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public InterviewDifficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(InterviewDifficulty difficulty) {
        this.difficulty = difficulty;
    }
}
