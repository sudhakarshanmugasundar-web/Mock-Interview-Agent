package com.mockinterview.dto.resume;

import java.util.List;

public record StructuredResumeData(
    List<String> skills,
    List<String> programmingLanguages,
    List<String> frameworks,
    List<String> projects,
    List<String> experience,
    List<String> education,
    List<String> certifications
) {}
