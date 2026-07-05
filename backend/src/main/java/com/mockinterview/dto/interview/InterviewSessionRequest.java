package com.mockinterview.dto.interview;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InterviewSessionRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    String title,

    @NotBlank(message = "Interview type is required (e.g. HR, TECHNICAL, CODING)")
    String interviewType,

    @NotBlank(message = "Difficulty level is required (e.g. EASY, MEDIUM, HARD)")
    String difficulty
) {}
