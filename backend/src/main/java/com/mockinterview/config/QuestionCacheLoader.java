package com.mockinterview.config;

import com.mockinterview.entity.QuestionCache;
import com.mockinterview.repository.HrQuestionRepository;
import com.mockinterview.repository.TechnicalQuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class QuestionCacheLoader implements CommandLineRunner {

    private final HrQuestionRepository hrQuestionRepository;
    private final TechnicalQuestionRepository technicalQuestionRepository;

    public QuestionCacheLoader(HrQuestionRepository hrQuestionRepository,
                               TechnicalQuestionRepository technicalQuestionRepository) {
        this.hrQuestionRepository = hrQuestionRepository;
        this.technicalQuestionRepository = technicalQuestionRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            hrQuestionRepository.findAll().forEach(q -> 
                QuestionCache.putHrQuestion(q.getId(), q.getQuestionText())
            );
        } catch (Exception e) {
            // Log it but don't fail startup if the tables aren't populated yet
            System.err.println("Could not load HR questions: " + e.getMessage());
        }

        try {
            technicalQuestionRepository.findAll().forEach(q -> 
                QuestionCache.putTechQuestion(q.getId(), q.getQuestionText())
            );
        } catch (Exception e) {
            System.err.println("Could not load Technical questions: " + e.getMessage());
        }
    }
}
