package com.mockinterview.service.ai;

import java.util.List;

public record AiQuestionRequest(
    String resumeText,
    String skillsBio,
    String interviewType,
    String difficulty,
    int sequenceNumber,
    List<HistoryItem> history,
    String candidateName
) {}
