package com.mockinterview.dto.coding;

public record CodingProblemResponse(
    String title,
    String description,
    String difficulty,
    String starterCode,
    int totalTestCases,
    int visibleTestCases
) {}
