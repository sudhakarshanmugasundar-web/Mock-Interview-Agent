package com.mockinterview.dto.interview;

import java.util.List;

public record ResumeQuestionsResponse(
    List<String> selfIntroduction,
    List<String> hr,
    List<String> technical,
    List<String> coding
) {}
