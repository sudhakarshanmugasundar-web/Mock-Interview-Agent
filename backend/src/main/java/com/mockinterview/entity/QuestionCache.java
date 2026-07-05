package com.mockinterview.entity;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

public class QuestionCache {
    private static final Map<Long, String> hrQuestions = new ConcurrentHashMap<>();
    private static final Map<Long, String> techQuestions = new ConcurrentHashMap<>();

    static {
        // Seed default fallback values to ensure logic works even before DB load
        hrQuestions.put(1L, "Tell me about yourself.");
        hrQuestions.put(2L, "Why should we hire you?");
        hrQuestions.put(3L, "Describe a challenge you faced.");
        hrQuestions.put(4L, "Where do you see yourself in 5 years?");
        hrQuestions.put(5L, "What are your strengths and weaknesses?");

        techQuestions.put(1L, "What is JVM?");
        techQuestions.put(2L, "Explain OOP Principles.");
        techQuestions.put(3L, "Difference between DELETE, TRUNCATE and DROP?");
        techQuestions.put(4L, "Explain Binary Search.");
        techQuestions.put(5L, "What is Dependency Injection?");
    }

    public static void putHrQuestion(Long id, String text) {
        if (id != null && text != null) {
            hrQuestions.put(id, text);
        }
    }

    public static void putTechQuestion(Long id, String text) {
        if (id != null && text != null) {
            techQuestions.put(id, text);
        }
    }

    public static String getQuestion(Long id, InterviewType type) {
        if (id == null) return null;
        if (type == InterviewType.HR) {
            return hrQuestions.get(id);
        } else {
            return techQuestions.get(id);
        }
    }

    public static String getQuestion(Long id) {
        if (id == null) return null;
        String text = hrQuestions.get(id);
        if (text == null) {
            text = techQuestions.get(id);
        }
        return text;
    }
}
