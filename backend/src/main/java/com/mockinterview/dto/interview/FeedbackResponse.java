package com.mockinterview.dto.interview;

public record FeedbackResponse(
    Long responseId,
    String questionText,
    String responseText,
    String answerMode,
    Integer responseTime,
    int questionSequence,
    Integer technicalKnowledge,
    Integer communication,
    Integer confidence,
    Integer grammar,
    Integer fluency,
    Integer relevance,
    Integer completeness,
    Integer professionalism,
    Double overallScore,
    String feedbackText,
    String strengths,
    String weaknesses,
    String suggestions,
    String sampleAnswer,
    String audioPath
) {}
