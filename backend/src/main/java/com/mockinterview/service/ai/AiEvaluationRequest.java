package com.mockinterview.service.ai;

public record AiEvaluationRequest(
    String questionText,
    String responseText,
    String interviewType
) {}
