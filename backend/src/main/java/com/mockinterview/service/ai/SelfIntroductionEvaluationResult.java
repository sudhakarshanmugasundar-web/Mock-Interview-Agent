package com.mockinterview.service.ai;

public class SelfIntroductionEvaluationResult {
    private int communicationScore;
    private int grammarScore;
    private int professionalismScore;
    private int resumeRelevanceScore;
    private int overallScore;
    private String strengths;
    private String weaknesses;
    private String missingInformation;
    private String suggestions;
    private String improvedText;

    public SelfIntroductionEvaluationResult() {}

    public SelfIntroductionEvaluationResult(int communicationScore, int grammarScore, int professionalismScore,
                                           int resumeRelevanceScore, int overallScore, String strengths,
                                           String weaknesses, String missingInformation, String suggestions,
                                           String improvedText) {
        this.communicationScore = communicationScore;
        this.grammarScore = grammarScore;
        this.professionalismScore = professionalismScore;
        this.resumeRelevanceScore = resumeRelevanceScore;
        this.overallScore = overallScore;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.missingInformation = missingInformation;
        this.suggestions = suggestions;
        this.improvedText = improvedText;
    }

    public int getCommunicationScore() {
        return communicationScore;
    }

    public void setCommunicationScore(int communicationScore) {
        this.communicationScore = communicationScore;
    }

    public int getGrammarScore() {
        return grammarScore;
    }

    public void setGrammarScore(int grammarScore) {
        this.grammarScore = grammarScore;
    }

    public int getProfessionalismScore() {
        return professionalismScore;
    }

    public void setProfessionalismScore(int professionalismScore) {
        this.professionalismScore = professionalismScore;
    }

    public int getResumeRelevanceScore() {
        return resumeRelevanceScore;
    }

    public void setResumeRelevanceScore(int resumeRelevanceScore) {
        this.resumeRelevanceScore = resumeRelevanceScore;
    }

    public int getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(int overallScore) {
        this.overallScore = overallScore;
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

    public String getMissingInformation() {
        return missingInformation;
    }

    public void setMissingInformation(String missingInformation) {
        this.missingInformation = missingInformation;
    }

    public String getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(String suggestions) {
        this.suggestions = suggestions;
    }

    public String getImprovedText() {
        return improvedText;
    }

    public void setImprovedText(String improvedText) {
        this.improvedText = improvedText;
    }

    public static SelfIntroductionEvaluationResultBuilder builder() {
        return new SelfIntroductionEvaluationResultBuilder();
    }

    public static class SelfIntroductionEvaluationResultBuilder {
        private int communicationScore;
        private int grammarScore;
        private int professionalismScore;
        private int resumeRelevanceScore;
        private int overallScore;
        private String strengths;
        private String weaknesses;
        private String missingInformation;
        private String suggestions;
        private String improvedText;

        public SelfIntroductionEvaluationResultBuilder communicationScore(int communicationScore) {
            this.communicationScore = communicationScore;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder grammarScore(int grammarScore) {
            this.grammarScore = grammarScore;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder professionalismScore(int professionalismScore) {
            this.professionalismScore = professionalismScore;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder resumeRelevanceScore(int resumeRelevanceScore) {
            this.resumeRelevanceScore = resumeRelevanceScore;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder overallScore(int overallScore) {
            this.overallScore = overallScore;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder strengths(String strengths) {
            this.strengths = strengths;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder weaknesses(String weaknesses) {
            this.weaknesses = weaknesses;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder missingInformation(String missingInformation) {
            this.missingInformation = missingInformation;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder suggestions(String suggestions) {
            this.suggestions = suggestions;
            return this;
        }

        public SelfIntroductionEvaluationResultBuilder improvedText(String improvedText) {
            this.improvedText = improvedText;
            return this;
        }

        public SelfIntroductionEvaluationResult build() {
            return new SelfIntroductionEvaluationResult(communicationScore, grammarScore, professionalismScore,
                    resumeRelevanceScore, overallScore, strengths, weaknesses, missingInformation, suggestions, improvedText);
        }
    }
}
