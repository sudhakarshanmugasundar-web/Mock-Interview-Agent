package com.mockinterview.dto.coding;

public record TestCaseResult(
    String name,
    String input,
    String expectedOutput,
    String actualOutput,
    boolean passed,
    long executionTimeMs,
    boolean hidden
) {}
