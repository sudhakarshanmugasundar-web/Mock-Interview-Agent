package com.mockinterview.service.interview;

import com.mockinterview.dto.interview.ResumeQuestionsResponse;
import com.mockinterview.dto.resume.StructuredResumeData;

public interface QuestionGenerationService {
    ResumeQuestionsResponse generateQuestions(StructuredResumeData resumeData);
}
