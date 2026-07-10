package com.mockinterview.dto.interview;

import java.time.LocalDateTime;

public record SelfIntroductionResponse(
    Long id,
    Long sessionId,
    Long candidateId,
    String introductionText,
    Integer wordCount,
    Integer durationSeconds,
    LocalDateTime submissionTime,
    String status,
    Integer communicationScore,
    Integer grammarScore,
    Integer professionalismScore,
    Integer resumeRelevanceScore,
    Integer overallScore,
    String strengths,
    String weaknesses,
    String missingInformation,
    String suggestions,
    String improvedText
) {}
