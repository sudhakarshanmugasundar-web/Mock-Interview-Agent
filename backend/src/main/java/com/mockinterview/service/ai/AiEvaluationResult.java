package com.mockinterview.service.ai;

public class AiEvaluationResult {

    private int technicalKnowledge;
    private int communication;
    private int confidence;
    private int grammar;
    private int relevance;
    private int completeness;
    private int professionalism;
    private int fluency;
    private double overallScore;
    private String feedbackText;
    private String strengths;
    private String weaknesses;
    private String suggestions;
    private String sampleAnswer;

    public AiEvaluationResult() {}

    public AiEvaluationResult(int technicalKnowledge, int communication, int confidence, int grammar, int relevance,
                              int completeness, int professionalism, int fluency, double overallScore, String feedbackText,
                              String strengths, String weaknesses, String suggestions, String sampleAnswer) {
        this.technicalKnowledge = technicalKnowledge;
        this.communication = communication;
        this.confidence = confidence;
        this.grammar = grammar;
        this.relevance = relevance;
        this.completeness = completeness;
        this.professionalism = professionalism;
        this.fluency = fluency;
        this.overallScore = overallScore;
        this.feedbackText = feedbackText;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.suggestions = suggestions;
        this.sampleAnswer = sampleAnswer;
    }

    public int getTechnicalKnowledge() {
        return technicalKnowledge;
    }

    public void setTechnicalKnowledge(int technicalKnowledge) {
        this.technicalKnowledge = technicalKnowledge;
    }

    public int getCommunication() {
        return communication;
    }

    public void setCommunication(int communication) {
        this.communication = communication;
    }

    public int getConfidence() {
        return confidence;
    }

    public void setConfidence(int confidence) {
        this.confidence = confidence;
    }

    public int getGrammar() {
        return grammar;
    }

    public void setGrammar(int grammar) {
        this.grammar = grammar;
    }

    public int getRelevance() {
        return relevance;
    }

    public void setRelevance(int relevance) {
        this.relevance = relevance;
    }

    public int getCompleteness() {
        return completeness;
    }

    public void setCompleteness(int completeness) {
        this.completeness = completeness;
    }

    public int getProfessionalism() {
        return professionalism;
    }

    public void setProfessionalism(int professionalism) {
        this.professionalism = professionalism;
    }

    public double getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(double overallScore) {
        this.overallScore = overallScore;
    }

    public String getFeedbackText() {
        return feedbackText;
    }

    public void setFeedbackText(String feedbackText) {
        this.feedbackText = feedbackText;
    }

    public String getStrengths() {
        return strengths;
    }

    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }

    public String getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(String weaknesses) {
        this.weaknesses = weaknesses;
    }

    public String getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(String suggestions) {
        this.suggestions = suggestions;
    }

    public int getFluency() {
        return fluency;
    }

    public void setFluency(int fluency) {
        this.fluency = fluency;
    }

    public String getSampleAnswer() {
        return sampleAnswer;
    }

    public void setSampleAnswer(String sampleAnswer) {
        this.sampleAnswer = sampleAnswer;
    }

    public static AiEvaluationResultBuilder builder() {
        return new AiEvaluationResultBuilder();
    }

    public static class AiEvaluationResultBuilder {
        private int technicalKnowledge;
        private int communication;
        private int confidence;
        private int grammar;
        private int relevance;
        private int completeness;
        private int professionalism;
        private int fluency;
        private double overallScore;
        private String feedbackText;
        private String strengths;
        private String weaknesses;
        private String suggestions;
        private String sampleAnswer;

        public AiEvaluationResultBuilder technicalKnowledge(int technicalKnowledge) {
            this.technicalKnowledge = technicalKnowledge;
            return this;
        }

        public AiEvaluationResultBuilder communication(int communication) {
            this.communication = communication;
            return this;
        }

        public AiEvaluationResultBuilder confidence(int confidence) {
            this.confidence = confidence;
            return this;
        }

        public AiEvaluationResultBuilder grammar(int grammar) {
            this.grammar = grammar;
            return this;
        }

        public AiEvaluationResultBuilder relevance(int relevance) {
            this.relevance = relevance;
            return this;
        }

        public AiEvaluationResultBuilder completeness(int completeness) {
            this.completeness = completeness;
            return this;
        }

        public AiEvaluationResultBuilder professionalism(int professionalism) {
            this.professionalism = professionalism;
            return this;
        }

        public AiEvaluationResultBuilder fluency(int fluency) {
            this.fluency = fluency;
            return this;
        }

        public AiEvaluationResultBuilder overallScore(double overallScore) {
            this.overallScore = overallScore;
            return this;
        }

        public AiEvaluationResultBuilder feedbackText(String feedbackText) {
            this.feedbackText = feedbackText;
            return this;
        }

        public AiEvaluationResultBuilder strengths(String strengths) {
            this.strengths = strengths;
            return this;
        }

        public AiEvaluationResultBuilder weaknesses(String weaknesses) {
            this.weaknesses = weaknesses;
            return this;
        }

        public AiEvaluationResultBuilder suggestions(String suggestions) {
            this.suggestions = suggestions;
            return this;
        }

        public AiEvaluationResultBuilder sampleAnswer(String sampleAnswer) {
            this.sampleAnswer = sampleAnswer;
            return this;
        }

        public AiEvaluationResult build() {
            return new AiEvaluationResult(technicalKnowledge, communication, confidence, grammar, relevance, completeness, professionalism, fluency, overallScore, feedbackText, strengths, weaknesses, suggestions, sampleAnswer);
        }
    }
}
