package com.mockinterview.dto.interview;

public record QuestionResponse(
    Long id,
    String questionText,
    int questionSequence,
    boolean isLastQuestion
) {}
