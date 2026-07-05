package com.mockinterview.dto.interview;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnswerRequest(
    @NotBlank(message = "Answer text must not be blank")
    @Size(max = 5000, message = "Answer text must not exceed 5000 characters")
    String answerText,

    String answerMode, // TEXT or VOICE, optional (defaults to TEXT)

    Integer responseTime, // in seconds, optional

    String audioPath // local path of voice recording
) {}
