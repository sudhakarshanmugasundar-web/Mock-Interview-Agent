package com.mockinterview.dto.interview;

import java.util.List;

public record InterviewHistoryResponse(
    List<InterviewSessionResponse> sessions,
    int currentPage,
    long totalItems,
    int totalPages
) {}
