package com.mockinterview.dto.interview;

import jakarta.validation.constraints.NotNull;

public record SelfIntroductionRequest(
    @NotNull(message = "Session ID must not be null")
    Long sessionId,

    String introductionText,

    Integer durationSeconds
) {}
