package com.mockinterview.dto.interview;

import java.util.List;

/**
 * Paginated wrapper for the detailed history endpoint.
 */
public record DetailedHistoryResponse(
    List<HistoryItemResponse> sessions,
    int currentPage,
    long totalItems,
    int totalPages
) {}
