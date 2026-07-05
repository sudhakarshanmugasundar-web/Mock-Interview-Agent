package com.mockinterview.dto.coding;

import java.util.List;

public record CodeEvaluationResponse(
    // Test execution
    List<TestCaseResult> testCaseResults,
    int testsPassed,
    int testsTotal,
    boolean compilationSuccess,
    String compilationError,
    // AI evaluation scores (1-10)
    int codeQualityScore,
    int namingConventionScore,
    int optimizationScore,
    int correctnessScore,
    int overallScore,
    // AI textual analysis
    String timeComplexity,
    String spaceComplexity,
    String aiFeedback,
    String strengths,
    String improvements,
    String optimizedApproach
) {}
