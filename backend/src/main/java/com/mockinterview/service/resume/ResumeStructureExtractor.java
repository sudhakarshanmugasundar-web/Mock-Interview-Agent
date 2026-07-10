package com.mockinterview.service.resume;

import com.mockinterview.dto.resume.StructuredResumeData;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ResumeStructureExtractor {

    public StructuredResumeData extractStructure(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new StructuredResumeData(
                List.of("Software Development"),
                List.of("Java"),
                List.of("Spring Boot"),
                List.of("Enterprise API Platform"),
                List.of("Software Engineer Intern"),
                List.of("Bachelor of Science in Computer Science"),
                List.of("Professional Developer Certification")
            );
        }

        String lower = text.toLowerCase();

        // 1. Languages
        List<String> languages = new ArrayList<>();
        String[] possibleLanguages = {"java", "python", "javascript", "typescript", "c++", "go", "rust", "scala", "ruby", "swift", "c#", "php"};
        for (String lang : possibleLanguages) {
            if (lower.contains(lang)) {
                languages.add(capitalize(lang));
            }
        }
        if (languages.isEmpty()) {
            languages.add("Java");
        }

        // 2. Frameworks
        List<String> frameworks = new ArrayList<>();
        String[] possibleFrameworks = {"spring boot", "springboot", "react", "angular", "vue", "django", "flask", "express", "hibernate", "next.js", "nest.js", "laravel", "rails"};
        for (String fw : possibleFrameworks) {
            if (lower.contains(fw)) {
                frameworks.add(capitalize(fw.replace("springboot", "spring boot")));
            }
        }
        if (frameworks.isEmpty()) {
            frameworks.add("Spring Boot");
        }

        // 3. Skills (General technical skills)
        List<String> skills = new ArrayList<>();
        String[] possibleSkills = {"git", "docker", "kubernetes", "aws", "mysql", "postgresql", "mongodb", "redis", "rest api", "microservices", "ci/cd", "agile", "jira", "graphql"};
        for (String skill : possibleSkills) {
            if (lower.contains(skill)) {
                skills.add(skill.toUpperCase().replace("API", "API").replace("CD", "CD").replace("CI", "CI"));
            }
        }
        if (skills.isEmpty()) {
            skills.add("REST API");
            skills.add("Docker");
            skills.add("AWS");
        }

        // 4. Projects
        List<String> projects = new ArrayList<>();
        if (lower.contains("e-commerce") || lower.contains("ecommerce")) {
            projects.add("E-Commerce Web Portal");
        }
        if (lower.contains("chat") || lower.contains("messaging")) {
            projects.add("Real-time Chat Application");
        }
        if (lower.contains("rate limiter")) {
            projects.add("Distributed Rate Limiter");
        }
        if (lower.contains("dashboard") || lower.contains("analytics")) {
            projects.add("Real-time Analytics Dashboard");
        }
        if (projects.isEmpty()) {
            projects.add("Enterprise API Platform");
        }

        // 5. Experience
        List<String> experience = new ArrayList<>();
        if (lower.contains("google")) {
            experience.add("Software Engineering Intern at Google");
        }
        if (lower.contains("microsoft")) {
            experience.add("Technical Analyst Intern at Microsoft");
        }
        if (lower.contains("amazon")) {
            experience.add("SDE Intern at Amazon");
        }
        if (lower.contains("meta") || lower.contains("facebook")) {
            experience.add("Engineering Intern at Meta");
        }
        if (experience.isEmpty()) {
            experience.add("Software Engineer Intern");
        }

        // 6. Education
        List<String> education = new ArrayList<>();
        if (lower.contains("stanford")) {
            education.add("Stanford University");
        } else if (lower.contains("mit") || lower.contains("massachusetts institute")) {
            education.add("MIT");
        } else if (lower.contains("berkeley")) {
            education.add("UC Berkeley");
        } else if (lower.contains("carnegie mellon")) {
            education.add("Carnegie Mellon University");
        } else if (lower.contains("bachelor") || lower.contains("b.s.") || lower.contains("degree")) {
            education.add("Bachelor of Science in Computer Science");
        } else {
            education.add("University Graduate");
        }

        // 7. Certifications
        List<String> certifications = new ArrayList<>();
        if (lower.contains("aws certified") || lower.contains("aws certification")) {
            certifications.add("AWS Certified Solutions Architect");
        }
        if (lower.contains("scrum master") || lower.contains("csm")) {
            certifications.add("Certified Scrum Master (CSM)");
        }
        if (lower.contains("kubernetes certified") || lower.contains("cka")) {
            certifications.add("Certified Kubernetes Administrator (CKA)");
        }
        if (certifications.isEmpty()) {
            certifications.add("Professional Developer Certification");
        }

        return new StructuredResumeData(
            skills,
            languages,
            frameworks,
            projects,
            experience,
            education,
            certifications
        );
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        if (str.equals("c++")) return "C++";
        if (str.equals("go")) return "Go";
        if (str.equals("c#")) return "C#";
        if (str.equals("spring boot")) return "Spring Boot";
        if (str.equals("react")) return "React";
        if (str.equals("angular")) return "Angular";
        if (str.equals("django")) return "Django";
        if (str.equals("hibernate")) return "Hibernate";
        
        String[] words = str.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (w.length() > 0) {
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1)).append(" ");
            }
        }
        return sb.toString().trim();
    }
}
