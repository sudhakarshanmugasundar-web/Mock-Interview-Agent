package com.mockinterview.mapper;

import com.mockinterview.dto.interview.SelfIntroductionResponse;
import com.mockinterview.entity.SelfIntroduction;
import org.springframework.stereotype.Component;

@Component
public class SelfIntroductionMapper {

    public SelfIntroductionResponse toResponse(SelfIntroduction entity) {
        if (entity == null) {
            return null;
        }
        return new SelfIntroductionResponse(
                entity.getId(),
                entity.getInterviewSession().getId(),
                entity.getCandidate().getId(),
                entity.getIntroductionText(),
                entity.getWordCount(),
                entity.getDurationSeconds(),
                entity.getSubmissionTime(),
                entity.getStatus().name(),
                entity.getCommunicationScore(),
                entity.getGrammarScore(),
                entity.getProfessionalismScore(),
                entity.getResumeRelevanceScore(),
                entity.getOverallScore(),
                entity.getStrengths(),
                entity.getWeaknesses(),
                entity.getMissingInformation(),
                entity.getSuggestions(),
                entity.getImprovedText()
        );
    }
}
