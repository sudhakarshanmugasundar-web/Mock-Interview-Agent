package com.mockinterview.service.interview;

import com.mockinterview.dto.interview.ResumeQuestionsResponse;
import com.mockinterview.dto.resume.StructuredResumeData;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class MockQuestionGenerationService implements QuestionGenerationService {

    @Override
    public ResumeQuestionsResponse generateQuestions(StructuredResumeData resumeData) {
        if (resumeData == null) {
            return getFallbackQuestions();
        }

        // Extrapolate values with fallbacks
        String skill = getFirstOrFallback(resumeData.skills(), "Software Development");
        String language = getFirstOrFallback(resumeData.programmingLanguages(), "Java");
        String framework = getFirstOrFallback(resumeData.frameworks(), "Spring Boot");
        String project = getFirstOrFallback(resumeData.projects(), "Enterprise API Platform");
        String exp = getFirstOrFallback(resumeData.experience(), "Software Engineer Intern");
        String edu = getFirstOrFallback(resumeData.education(), "Computer Science degree");
        String cert = getFirstOrFallback(resumeData.certifications(), "Professional Developer Certification");

        // 1. Self Introduction Category
        List<String> selfIntroduction = new ArrayList<>();
        selfIntroduction.add("Welcome to the interview. Please walk me through your resume, specifically highlighting your academic background at " + edu + " and how you developed your skills in " + skill + ".");
        selfIntroduction.add("Could you describe your overall professional journey, highlighting the transition from your role as a " + exp + " to the skills you possess today?");

        // 2. HR Category
        List<String> hr = new ArrayList<>();
        hr.add("I see you've worked as a " + exp + ". Can you share a time when you had a disagreement with a team member on a technical decision and how you reached a resolution?");
        hr.add("On your resume, you listed " + project + ". Describe the most challenging deadline you faced during this project and how you prioritized tasks to deliver it.");
        hr.add("You hold the certification: " + cert + ". What motivated you to pursue this certification, and how has it helped you in your practical engineering tasks?");

        // 3. Technical Category
        List<String> technical = new ArrayList<>();
        technical.add("Given your proficiency in " + framework + ", can you explain the core architecture of " + framework + " and how it manages bean generation or component dependencies under the hood?");
        technical.add("You mention experience with " + language + ". How does " + language + " handle concurrency, memory management, or performance optimization compared to other languages you know?");
        technical.add("For a project like " + project + ", what database scaling strategies (indexing, caching, connection pooling) would you implement to handle a sudden 10x spike in concurrent read traffic?");

        // 4. Coding Category
        List<String> coding = new ArrayList<>();
        coding.add("Problem: In your language of choice (such as " + language + "), write a function to reverse a singly linked list in-place. Discuss the time and space complexity of your approach.");
        coding.add("Problem: Design a distributed rate limiter for a microservice backend. Discuss the token bucket algorithm, and write a quick pseudo-code implementation using a key-value database (like Redis) or standard language libraries.");

        return new ResumeQuestionsResponse(selfIntroduction, hr, technical, coding);
    }

    private String getFirstOrFallback(List<String> list, String fallback) {
        if (list == null || list.isEmpty() || list.get(0) == null || list.get(0).trim().isEmpty()) {
            return fallback;
        }
        return list.get(0).trim();
    }

    private ResumeQuestionsResponse getFallbackQuestions() {
        return new ResumeQuestionsResponse(
            List.of("Welcome. Please introduce yourself and walk me through your background and key skills."),
            List.of("Describe a time you faced a tough professional challenge. How did you handle it?", 
                    "Where do you see yourself in five years and how does this role align with your goals?"),
            List.of("Explain the difference between a relational database and a non-relational database.", 
                    "What are the core design patterns you use to build scalable system APIs?"),
            List.of("Write a function to check if a binary tree is a valid Binary Search Tree.", 
                    "Implement a function that resolves the two-sum problem in linear time.")
        );
    }
}
