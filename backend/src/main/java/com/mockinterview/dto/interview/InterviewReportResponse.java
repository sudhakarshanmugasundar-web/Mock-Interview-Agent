package com.mockinterview.dto.interview;

import java.util.List;

/**
 * Consolidated interview report combining all round scores with AI-generated
 * qualitative analysis, recommendation, and suggested learning path.
 */
public record InterviewReportResponse(
    // Session metadata
    Long sessionId,
    String candidateName,
    String candidateEmail,
    String title,
    String interviewType,
    String difficulty,

    // Round scores (0–10, null if round not completed)
    Double resumeScore,
    Double hrScore,
    Double technicalScore,
    Double codingScore,
    Double overallScore,

    // Soft skill averages across all rounds (0–10)
    Double communicationAvg,
    Double grammarAvg,
    Double confidenceAvg,
    Double fluencyAvg,
    Double relevanceAvg,
    Double completenessAvg,
    Double professionalismaAvg,

    // Problem-solving proxy (technicalKnowledge average)
    Double problemSolvingAvg,

    // AI qualitative analysis
    String recommendation,       // STRONG_HIRE | HIRE | CONSIDER | NO_HIRE
    String recommendationDetail, // 2-3 sentence justification
    String strongAreas,          // bullet points
    String weakAreas,            // bullet points
    String suggestedLearningPath, // structured 4-6 week plan

    // Per-question breakdown for detail view
    List<FeedbackResponse> questionBreakdown
) {}
