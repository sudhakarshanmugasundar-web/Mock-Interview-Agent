package com.mockinterview.dto.interview;

public record InterviewStatisticsResponse(
    long totalSessions,
    long completedSessions,
    long cancelledSessions,
    long inProgressSessions,
    double averageDurationSeconds
) {}
