package com.mockinterview.service.ai;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class DelegatingAiProvider implements AiProvider {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    private final AiProvider geminiProvider;
    private final AiProvider mockProvider;

    public DelegatingAiProvider(@Qualifier("geminiAiProvider") AiProvider geminiProvider,
                                @Qualifier("mockAiProvider") AiProvider mockProvider) {
        this.geminiProvider = geminiProvider;
        this.mockProvider = mockProvider;
    }

    private AiProvider getActiveProvider() {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            return geminiProvider;
        }
        return mockProvider;
    }

    @Override
    public String generateQuestion(AiQuestionRequest request) {
        return getActiveProvider().generateQuestion(request);
    }

    @Override
    public AiEvaluationResult evaluateResponse(AiEvaluationRequest request) {
        return getActiveProvider().evaluateResponse(request);
    }

    @Override
    public String analyzeContent(String content, String prompt) {
        return getActiveProvider().analyzeContent(content, prompt);
    }
}
