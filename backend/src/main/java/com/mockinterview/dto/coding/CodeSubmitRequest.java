package com.mockinterview.dto.coding;

public record CodeSubmitRequest(
    Long sessionId,
    String questionText,
    String code,
    String difficulty
) {}
