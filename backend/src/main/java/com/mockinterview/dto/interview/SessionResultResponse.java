package com.mockinterview.dto.interview;

import java.util.List;

public record SessionResultResponse(
    Long sessionId,
    String title,
    String status,
    String interviewType,
    String difficulty,
    double averageScore,
    int totalQuestions,
    List<FeedbackResponse> questionsEvaluations
) {}
