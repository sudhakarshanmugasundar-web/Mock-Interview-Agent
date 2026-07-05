package com.mockinterview.dto.interview;

import java.time.LocalDateTime;

/**
 * Enriched history item returned by the detailed history endpoint.
 * Each row contains all round scores so the frontend can display
 * a complete summary without extra fetches.
 */
public record HistoryItemResponse(
    Long sessionId,
    String title,
    String interviewType,
    String difficulty,
    String status,
    LocalDateTime startedAt,
    LocalDateTime endedAt,
    Integer durationSeconds,   // actual seconds between start and end

    // Round scores (null = round not yet answered)
    Double resumeScore,
    Double hrScore,
    Double technicalScore,
    Double codingScore,
    Double overallScore        // weighted aggregate
) {}
