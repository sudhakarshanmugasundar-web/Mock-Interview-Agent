package com.mockinterview.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "hr_questions")
public class HrQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long id;

    @Column(name = "question", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "category", length = 100)
    private String category;

    public HrQuestion() {}

    public HrQuestion(Long id, String questionText, String category) {
        this.id = id;
        this.questionText = questionText;
        this.category = category;
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
}
