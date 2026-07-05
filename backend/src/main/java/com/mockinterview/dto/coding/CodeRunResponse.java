package com.mockinterview.dto.coding;

public record CodeRunResponse(
    String output,
    String error,
    boolean compilationError,
    long executionTimeMs
) {}
