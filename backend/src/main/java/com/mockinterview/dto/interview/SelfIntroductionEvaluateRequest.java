package com.mockinterview.dto.interview;

import jakarta.validation.constraints.NotNull;

public record SelfIntroductionEvaluateRequest(
    @NotNull(message = "Session ID must not be null")
    Long sessionId
) {}
