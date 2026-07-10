package com.mockinterview.service.ai;

public interface AiProvider {
    String generateQuestion(AiQuestionRequest request);
    AiEvaluationResult evaluateResponse(AiEvaluationRequest request);
    String analyzeContent(String content, String prompt);
    SelfIntroductionEvaluationResult evaluateSelfIntroduction(String introductionText, String resumeSummary);
}
