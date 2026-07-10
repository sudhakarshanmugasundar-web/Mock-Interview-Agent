package com.mockinterview.dto.interview;

import java.time.LocalDateTime;

public record InterviewSessionResponse(
    Long id,
    String email,
    String title,
    String status,
    String interviewType,
    String difficulty,
    LocalDateTime startedAt,
    LocalDateTime endedAt,
    Integer duration,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    String selfIntroduction,
    String selfIntroductionDraft
) {}

