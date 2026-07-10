package com.mockinterview.service.ai;

import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Component("mockAiProvider")
public class MockAiProvider implements AiProvider {

    private static class ResumeInfo {
        String university = "your university";
        String mainProject = "your core project";
        String topSkill = "your primary technology";
        String company = "your internship organization";
        String role = "Intern";
        String certification = "your certification";

        public ResumeInfo(String text) {
            if (text == null || text.trim().isEmpty()) {
                return;
            }
            String lower = text.toLowerCase();

            // Extract primary tech skill
            if (lower.contains("spring boot") || lower.contains("springboot")) {
                topSkill = "Spring Boot";
            } else if (lower.contains("react")) {
                topSkill = "React";
            } else if (lower.contains("kubernetes")) {
                topSkill = "Kubernetes";
            } else if (lower.contains("docker")) {
                topSkill = "Docker";
            } else if (lower.contains("aws") || lower.contains("amazon web services")) {
                topSkill = "AWS";
            } else if (lower.contains("java")) {
                topSkill = "Java";
            } else if (lower.contains("python")) {
                topSkill = "Python";
            } else if (lower.contains("sql") || lower.contains("mysql")) {
                topSkill = "SQL Databases";
            }

            // Extract education
            if (lower.contains("stanford")) {
                university = "Stanford University";
            } else if (lower.contains("mit") || lower.contains("massachusetts institute")) {
                university = "MIT";
            } else if (lower.contains("berkeley")) {
                university = "UC Berkeley";
            } else if (lower.contains("carnegie mellon") || lower.contains("cmu")) {
                university = "Carnegie Mellon University";
            } else if (lower.contains("university") || lower.contains("college") || lower.contains("institute")) {
                int idx = lower.indexOf("university");
                if (idx == -1) idx = lower.indexOf("college");
                if (idx == -1) idx = lower.indexOf("institute");
                if (idx != -1) {
                    int start = Math.max(0, idx - 15);
                    int end = Math.min(lower.length(), idx + 10);
                    String sub = text.substring(start, end).trim();
                    university = sub.replaceAll("\r?\n", " ");
                }
            }

            // Extract Project
            if (lower.contains("e-commerce") || lower.contains("ecommerce")) {
                mainProject = "an E-Commerce portal";
            } else if (lower.contains("chat") || lower.contains("messenger")) {
                mainProject = "a real-time messaging system";
            } else if (lower.contains("analytics") || lower.contains("dashboard")) {
                mainProject = "an Analytics Dashboard platform";
            } else if (lower.contains("rate limiter") || lower.contains("ratelimiter")) {
                mainProject = "a Distributed Rate Limiter service";
            } else if (lower.contains("project")) {
                int idx = lower.indexOf("project");
                int start = Math.max(0, idx - 10);
                int end = Math.min(lower.length(), idx + 10);
                mainProject = "your " + text.substring(start, end).trim().replaceAll("\r?\n", " ") + " project";
            }

            // Extract Experience/Internship
            if (lower.contains("google")) {
                company = "Google";
                role = "Software Engineering Intern";
            } else if (lower.contains("microsoft")) {
                company = "Microsoft";
                role = "Technical Intern";
            } else if (lower.contains("amazon")) {
                company = "Amazon";
                role = "SDE Intern";
            } else if (lower.contains("meta") || lower.contains("facebook")) {
                company = "Meta";
                role = "Engineering Intern";
            } else if (lower.contains("netflix")) {
                company = "Netflix";
                role = "Software Intern";
            } else if (lower.contains("internship") || lower.contains("intern")) {
                company = "your previous company";
                role = "Intern";
            }

            // Extract Certification
            if (lower.contains("aws certified") || lower.contains("aws certification")) {
                certification = "AWS Certified Solutions Architect";
            } else if (lower.contains("scrum master") || lower.contains("csm")) {
                certification = "Certified Scrum Master";
            } else if (lower.contains("java certified") || lower.contains("ocjp")) {
                certification = "Oracle Certified Java Professional";
            } else if (lower.contains("kubernetes certified") || lower.contains("cka")) {
                certification = "Certified Kubernetes Administrator";
            } else if (lower.contains("certified") || lower.contains("certification")) {
                certification = "your professional certification";
            }
        }
    }

    @Override
    public String generateQuestion(AiQuestionRequest request) {
        if (request.sequenceNumber() == 1) {
            return "Welcome to your mock interview! Could you please introduce yourself and summarize your professional background?";
        }
        
        String typeStr = request.interviewType().toUpperCase();
        String diffStr = request.difficulty().toUpperCase();

        // Initialize resume-aware parser
        String combinedSource = (request.resumeText() != null ? request.resumeText() : "") + " " +
                                (request.skillsBio() != null ? request.skillsBio() : "");
        ResumeInfo info = new ResumeInfo(combinedSource);
        
        if ("CODING".equals(typeStr)) {
            switch (request.sequenceNumber()) {
                case 2:
                    return "I noticed you completed an internship as a " + info.role + " at " + info.company + ", working on " + info.mainProject + ". Could you share what key responsibilities you had there and how you resolved team conflicts?";
                case 3:
                    if ("EASY".equals(diffStr)) {
                        return "Explain the difference between HashMap and Hashtable in Java.";
                    } else if ("MEDIUM".equals(diffStr)) {
                        return "What is the difference between Optimistic and Pessimistic locking in JPA/Hibernate?";
                    } else {
                        return "How does the Java Memory Model enforce thread safety via the happens-before relationship?";
                    }
                case 4:
                    if ("EASY".equals(diffStr)) {
                        return "What is the purpose of Spring Boot auto-configuration?";
                    } else if ("MEDIUM".equals(diffStr)) {
                        return "How do you handle transactional rollback strategies in Spring Boot services?";
                    } else {
                        return "Explain JVM garbage collection algorithm differences: G1 vs ZGC.";
                    }
                case 5:
                default:
                    if ("EASY".equals(diffStr)) {
                        return "Write a function to find the first non-repeated character in a string.";
                    } else if ("MEDIUM".equals(diffStr)) {
                        return "Write a Java method to reverse a singly linked list in-place.";
                    } else {
                        return "Design a distributed rate limiter for microservices. Write or describe the Redis/Token Bucket algorithm.";
                    }
            }
        }
        
        if ("HR".equals(typeStr)) {
            switch (request.sequenceNumber()) {
                case 2:
                    return "I see in your background that you studied at " + info.university + " and developed skills in " + info.topSkill + ". How did your academic projects prepare you to apply " + info.topSkill + " in a professional setting?";
                case 3:
                    if (!"your internship organization".equals(info.company) && !"your previous company".equals(info.company)) {
                        return "I noticed you completed an internship as a " + info.role + " at " + info.company + ". Can you share a key achievement or project you delivered there and how you managed project deadlines?";
                    } else {
                        return "I see you worked on " + info.mainProject + ". Can you tell me about the team dynamics, how tasks were divided, and what you personally delivered?";
                    }
                case 4:
                    // Context-aware follow-up question based on sequence 3 candidate answer
                    String lastAns = "";
                    if (request.history() != null && !request.history().isEmpty()) {
                        HistoryItem lastItem = request.history().get(request.history().size() - 1);
                        lastAns = lastItem.responseText() != null ? lastItem.responseText().toLowerCase() : "";
                    }
                    if (lastAns.contains("challenge") || lastAns.contains("difficult") || lastAns.contains("issue") || lastAns.contains("bug") || lastAns.contains("problem")) {
                        return "Following up on the challenge you mentioned: what did you learn from resolving that issue, and how do you prevent similar problems today?";
                    } else {
                        return "In your last answer, you mentioned delivering your project. Can you describe how you handled feedback or code reviews from teammates or mentors on that work?";
                    }
                case 5:
                default:
                    return "Based on your project work on " + info.mainProject + " and your background, how does this role align with your long-term career goals, and what values do you hope to bring to our engineering team?";
            }
        } else { // TECHNICAL
            // Build a rich topic-rotating question bank
            String lastAnswer = "";
            if (request.history() != null && !request.history().isEmpty()) {
                HistoryItem last = request.history().get(request.history().size() - 1);
                lastAnswer = last.responseText() != null ? last.responseText().toLowerCase() : "";
            }

            // Follow-up detection: if last answer mentions specific concepts, drill deeper
            if (!lastAnswer.isEmpty()) {
                if (lastAnswer.contains("hashmap") || lastAnswer.contains("linkedhashmap") || lastAnswer.contains("treemap")) {
                    return "Great — can you explain the internal bucket structure of HashMap, and what happens when the load factor threshold is exceeded?";
                } else if (lastAnswer.contains("spring boot") || lastAnswer.contains("autoconfiguration") || lastAnswer.contains("bean")) {
                    return "You mentioned Spring Boot — can you explain how @ConditionalOnMissingBean works in auto-configuration and give a scenario where you'd use it?";
                } else if (lastAnswer.contains("thread") || lastAnswer.contains("synchronize") || lastAnswer.contains("concurrency") || lastAnswer.contains("executor")) {
                    return "Following up on concurrency: how does Java's happens-before relationship in the Memory Model prevent visibility problems between threads?";
                } else if (lastAnswer.contains("exception") || lastAnswer.contains("catch") || lastAnswer.contains("throws")) {
                    return "You mentioned exceptions — can you explain the difference between try-with-resources and traditional finally blocks, and when you'd prefer one over the other?";
                } else if (lastAnswer.contains("gc") || lastAnswer.contains("garbage") || lastAnswer.contains("heap") || lastAnswer.contains("jvm")) {
                    return "Diving deeper into JVM memory: can you explain the difference between Young Generation, Old Generation, and Metaspace, and how G1GC manages them?";
                } else if (lastAnswer.contains("sql") || lastAnswer.contains("join") || lastAnswer.contains("index") || lastAnswer.contains("query")) {
                    return "Following up on SQL: how does a composite index differ from individual column indexes, and in what situation would a query NOT use an index even if it exists?";
                } else if (lastAnswer.contains("rest") || lastAnswer.contains("api") || lastAnswer.contains("http") || lastAnswer.contains("endpoint")) {
                    return "You mentioned REST APIs — can you explain the difference between PUT and PATCH semantics, and how you'd design an idempotent API endpoint?";
                } else if (lastAnswer.contains("oop") || lastAnswer.contains("interface") || lastAnswer.contains("abstract") || lastAnswer.contains("inherit")) {
                    return "Following up on OOP: when would you prefer composition over inheritance in Java, and can you give a real design scenario that illustrates this choice?";
                }
            }

            // Topic-rotating question bank (sequences map to different topic areas)
            int seq = request.sequenceNumber();
            // Rotate topic based on sequence so consecutive questions cover different areas
            int topicIdx = (seq - 2) % 9; // sequences 2-4 = technical, spread across 9 topics

            if ("EASY".equals(diffStr)) {
                String[] easyQuestions = {
                    "What are the four pillars of OOP? Give a one-sentence definition for each.",
                    "What is the difference between ArrayList and LinkedList in Java? When would you use each?",
                    "What does @RestController do in Spring Boot, and how does it differ from @Controller?",
                    "Explain the difference between checked and unchecked exceptions in Java with examples.",
                    "What is the purpose of the HashMap.put() method? What happens if you add a duplicate key?",
                    "What are the main HTTP methods (GET, POST, PUT, DELETE) and what does each represent in REST?",
                    "What is SQL JOIN? Explain the difference between INNER JOIN and LEFT JOIN.",
                    "What is a thread in Java? How do you create one using Runnable vs extending Thread?",
                    "What is the difference between the JVM, JRE, and JDK?"
                };
                return easyQuestions[topicIdx];
            } else if ("MEDIUM".equals(diffStr)) {
                String[] mediumQuestions = {
                    "How does Java achieve runtime polymorphism using method overriding? Explain dynamic dispatch.",
                    "What is the difference between HashMap and ConcurrentHashMap? How does ConcurrentHashMap avoid locking the entire map?",
                    "What is Spring Boot auto-configuration, and how does @ConditionalOnClass drive it?",
                    "How would you design a custom exception hierarchy in a Spring Boot REST API? Explain @ControllerAdvice and @ExceptionHandler.",
                    "What is the difference between fail-fast and fail-safe iterators in Java collections?",
                    "What is the Richardson Maturity Model for REST APIs? Describe the four levels.",
                    "What is the N+1 query problem in JPA? How do you solve it using @EntityGraph or JOIN FETCH?",
                    "What is the difference between synchronized method and ReentrantLock in Java? When would you use each?",
                    "Explain JVM Just-In-Time (JIT) compilation. How does HotSpot decide what to compile?"
                };
                return mediumQuestions[topicIdx];
            } else { // HARD
                String[] hardQuestions = {
                    "Explain the SOLID principles. Give a concrete Java example for each principle violation and how to fix it.",
                    "How does Java's HashMap internally handle hash collisions? Explain treeification and when it triggers in Java 8+.",
                    "How do you implement a custom Spring Boot auto-configuration starter with conditional beans and META-INF/spring.factories?",
                    "Describe a strategy for handling distributed exceptions across microservices using a circuit breaker (Resilience4j). How do fallbacks work?",
                    "Explain the time complexity trade-offs of TreeMap vs HashMap vs LinkedHashMap for get, put, and iteration. When does each shine?",
                    "How would you design a versioned REST API that supports backward compatibility while deprecating old endpoints without breaking clients?",
                    "How do database isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) affect concurrent transactions? Which does MySQL InnoDB default to?",
                    "Explain Java's ForkJoinPool and the work-stealing algorithm. How does CompletableFuture leverage it under the hood?",
                    "Compare G1GC, ZGC, and Shenandoah garbage collectors in terms of pause time guarantees and heap size suitability."
                };
                return hardQuestions[topicIdx];
            }
        }
    }

    @Override
    public AiEvaluationResult evaluateResponse(AiEvaluationRequest request) {
        String answer = request.responseText() != null ? request.responseText().trim() : "";
        String question = request.questionText() != null ? request.questionText().trim() : "";
        
        // 1. Detect meaningless or empty response
        boolean isMeaningless = answer.isEmpty() || answer.length() < 8;
        String lowercaseAnswer = answer.toLowerCase();
        
        if (!isMeaningless) {
            // Check for common filler/meaningless phrases
            List<String> fillers = List.of("don't know", "i dont know", "i do not know", "skip", "test", "hello", "yes", "no", "ok", "okay", "bye", "nothing", "pass", "no idea", "unsure");
            for (String filler : fillers) {
                if (lowercaseAnswer.equals(filler) || lowercaseAnswer.equals(filler + ".")) {
                    isMeaningless = true;
                    break;
                }
            }
        }

        if (isMeaningless) {
            return AiEvaluationResult.builder()
                    .technicalKnowledge(1)
                    .communication(1)
                    .confidence(1)
                    .grammar(1)
                    .relevance(1)
                    .completeness(1)
                    .professionalism(1)
                    .fluency(1)
                    .overallScore(1.0)
                    .feedbackText("The response provided was too short, empty, or lacked any meaningful substance to evaluate.")
                    .strengths("No strengths could be identified from the response.")
                    .weaknesses("The answer did not address the question and was insufficient.")
                    .suggestions("Please try to formulate a complete response utilizing professional concepts and transition words.")
                    .sampleAnswer("A strong answer would clearly articulate your experience with specific examples and concrete outcomes.")
                    .build();
        }

        // 2. Score calculations based on rules
        // Relevance Score: check keywords from question matching in answer
        int relevance = 5; // Base score
        String lowercaseQuestion = question.toLowerCase();
        
        // Dynamic relevance keyword checking
        if (lowercaseQuestion.contains("jvm") && (lowercaseAnswer.contains("virtual") || lowercaseAnswer.contains("memory") || lowercaseAnswer.contains("compile") || lowercaseAnswer.contains("bytecode") || lowercaseAnswer.contains("run"))) {
            relevance = 9;
        } else if (lowercaseQuestion.contains("oop") && (lowercaseAnswer.contains("object") || lowercaseAnswer.contains("class") || lowercaseAnswer.contains("inheritance") || lowercaseAnswer.contains("polymorphism") || lowercaseAnswer.contains("encapsulation"))) {
            relevance = 9;
        } else if (lowercaseQuestion.contains("spring") && (lowercaseAnswer.contains("bean") || lowercaseAnswer.contains("framework") || lowercaseAnswer.contains("dependency") || lowercaseAnswer.contains("injection") || lowercaseAnswer.contains("ioc") || lowercaseAnswer.contains("boot"))) {
            relevance = 9;
        } else if (lowercaseQuestion.contains("lock") && (lowercaseAnswer.contains("locking") || lowercaseAnswer.contains("optimistic") || lowercaseAnswer.contains("pessimistic") || lowercaseAnswer.contains("version") || lowercaseAnswer.contains("database"))) {
            relevance = 9;
        } else if (lowercaseQuestion.contains("introduce") && (lowercaseAnswer.contains("experience") || lowercaseAnswer.contains("work") || lowercaseAnswer.contains("developer") || lowercaseAnswer.contains("engineer") || lowercaseAnswer.contains("project"))) {
            relevance = 9;
        } else if (lowercaseQuestion.contains("conflict") && (lowercaseAnswer.contains("team") || lowercaseAnswer.contains("resolved") || lowercaseAnswer.contains("communicate") || lowercaseAnswer.contains("listen") || lowercaseAnswer.contains("agreement"))) {
            relevance = 9;
        } else if (lowercaseQuestion.contains("pressure") && (lowercaseAnswer.contains("prioritize") || lowercaseAnswer.contains("deadline") || lowercaseAnswer.contains("calm") || lowercaseAnswer.contains("plan") || lowercaseAnswer.contains("schedule"))) {
            relevance = 9;
        } else {
            // Check general semantic overlaps
            String[] words = question.split("\\s+");
            int matches = 0;
            for (String w : words) {
                if (w.length() > 3 && lowercaseAnswer.contains(w.toLowerCase())) {
                    matches++;
                }
            }
            relevance = Math.min(10, 5 + matches);
        }

        // Grammar Score
        int grammar = 5;
        if (Character.isUpperCase(answer.charAt(0))) {
            grammar += 2;
        }
        if (answer.endsWith(".") || answer.endsWith("!") || answer.endsWith("?")) {
            grammar += 1;
        }
        if (!lowercaseAnswer.contains(" i ") && !lowercaseAnswer.contains(" dont ") && !lowercaseAnswer.contains(" cant ")) {
            grammar += 2;
        }
        grammar = Math.min(10, grammar);

        // Completeness Score
        int completeness = 3;
        if (answer.length() > 250) {
            completeness = 10;
        } else if (answer.length() > 120) {
            completeness = 8;
        } else if (answer.length() > 50) {
            completeness = 6;
        }

        // Communication Score
        int communication = 5;
        List<String> transitionWords = List.of("because", "therefore", "firstly", "secondly", "however", "although", "for example", "furthermore", "consequently", "specifically");
        int transitionsCount = 0;
        for (String tWord : transitionWords) {
            if (lowercaseAnswer.contains(tWord)) {
                transitionsCount += 2;
            }
        }
        communication = Math.min(10, communication + transitionsCount);

        // Professionalism Score
        int professionalism = 6;
        List<String> unprofessionalWords = List.of("like", "stuff", "dunno", "yolo", "basically", "kid", "guy", "whatever");
        for (String uWord : unprofessionalWords) {
            if (lowercaseAnswer.contains(uWord)) {
                professionalism -= 1;
            }
        }
        professionalism = Math.max(2, professionalism);
        if (lowercaseAnswer.contains("project") || lowercaseAnswer.contains("professional") || lowercaseAnswer.contains("architecture") || lowercaseAnswer.contains("implement")) {
            professionalism = Math.min(10, professionalism + 2);
        }

        // Technical / HR Relevance
        int techOrHr = "HR".equals(request.interviewType().toUpperCase()) ? 8 : 7;
        if (lowercaseAnswer.contains("java") || lowercaseAnswer.contains("class") || lowercaseAnswer.contains("spring") || lowercaseAnswer.contains("design")) {
            techOrHr = Math.min(10, techOrHr + 2);
        }

        // Confidence
        int confidence = 7;
        if (answer.length() > 100) {
            confidence += 1;
        }
        if (lowercaseAnswer.contains("confident") || lowercaseAnswer.contains("definitely") || lowercaseAnswer.contains("certainly") || lowercaseAnswer.contains("ensure")) {
            confidence = Math.min(10, confidence + 1);
        }

        double overall = (techOrHr + communication + confidence + grammar + relevance + completeness + professionalism) / 7.0;
        overall = Math.round(overall * 10.0) / 10.0;

        // Structured strengths, weaknesses and suggestions
        String strengths = "Clear structure and good professional tone.";
        if (relevance >= 8) {
            strengths = "Excellent mapping of relevant keywords to the question prompt.";
        }
        if (grammar >= 8 && communication >= 8) {
            strengths = "Strong communication structure with correct syntax and transitional words.";
        }

        String weaknesses = "The answer was a bit brief.";
        if (completeness < 6) {
            weaknesses = "Lacks detailed architectural explanation or background context.";
        } else if (relevance < 7) {
            weaknesses = "Some concepts discussed deviate slightly from the core question focus.";
        }

        String suggestions = "Focus on providing concrete, real-world examples using the STAR method.";
        if (grammar < 7) {
            suggestions = "Pay attention to sentence boundaries, capitalization, and grammar pacing.";
        } else if (completeness < 7) {
            suggestions = "Try to explain 'why' and 'how' in more detail to improve response completeness.";
        }

        return AiEvaluationResult.builder()
                .technicalKnowledge(techOrHr)
                .communication(communication)
                .confidence(confidence)
                .grammar(grammar)
                .relevance(relevance)
                .completeness(completeness)
                .professionalism(professionalism)
                .fluency(7)
                .overallScore(overall)
                .feedbackText("Properly structured answer showing clear familiarity with core concepts.")
                .strengths(strengths)
                .weaknesses(weaknesses)
                .suggestions(suggestions)
                .sampleAnswer("A strong answer would clearly articulate your experience with specific examples and concrete outcomes.")
                .build();
    }

    @Override
    public String analyzeContent(String content, String prompt) {
        if (content == null) {
            content = "";
        }
        
        String lowerContent = content.toLowerCase();

        // 1. Check Missing Sections
        boolean hasExperience = lowerContent.contains("experience") || lowerContent.contains("employment") || lowerContent.contains("work history") || lowerContent.contains("experience:");
        boolean hasEducation = lowerContent.contains("education") || lowerContent.contains("academic") || lowerContent.contains("university") || lowerContent.contains("college");
        boolean hasSkills = lowerContent.contains("skills") || lowerContent.contains("technologies") || lowerContent.contains("expertise") || lowerContent.contains("skillset");
        boolean hasProjects = lowerContent.contains("projects") || lowerContent.contains("personal projects") || lowerContent.contains("academic projects");
        boolean hasCertifications = lowerContent.contains("certifications") || lowerContent.contains("certificates") || lowerContent.contains("credentials") || lowerContent.contains("courses");

        List<Map<String, Object>> issues = new ArrayList<>();

        int atsScore = 82;
        int grammarScore = 96;
        int skillsScore = 65;
        int professionalismScore = 88;
        int resumeQualityScore = 85;

        // Deductions for missing sections
        if (!hasExperience) {
            atsScore -= 15;
            resumeQualityScore -= 10;
            issues.add(Map.of(
                "problem", "Missing Professional Experience Section",
                "reason", "Employers and ATS parsers prioritize your professional work history to measure your career experience.",
                "suggestion", "Add a dedicated 'Work Experience' or 'Professional Experience' section containing your jobs, dates, and responsibilities.",
                "improvedVersion", "### WORK EXPERIENCE\n[Job Title] | [Company Name] | [Start Date] - [End Date]\n- Highlight key responsibilities and impact.",
                "resumeSection", "Experience",
                "originalText", "None",
                "errorType", "Completeness",
                "severity", "High"
            ));
        }

        if (!hasEducation) {
            atsScore -= 10;
            resumeQualityScore -= 8;
            issues.add(Map.of(
                "problem", "Missing Education Records",
                "reason", "ATS filters and recruiters look for academic background details to verify degrees and credentials.",
                "suggestion", "Create an 'Education' section detailing your degrees, university name, major, and graduation year.",
                "improvedVersion", "### EDUCATION\nBachelor of Science in Computer Science | University Name (Graduation Year)",
                "resumeSection", "Education",
                "originalText", "None",
                "errorType", "Completeness",
                "severity", "High"
            ));
        }

        if (!hasSkills) {
            atsScore -= 20;
            resumeQualityScore -= 12;
            issues.add(Map.of(
                "problem", "Missing Technical Skills Section",
                "reason", "ATS scanners scan for dedicated skills tables to match your profile against job description keywords.",
                "suggestion", "Add a 'Skills' section listing your programming languages, frameworks, databases, and developer tools.",
                "improvedVersion", "### TECHNICAL SKILLS\n- Languages: Java, JavaScript, SQL\n- Frameworks: Spring Boot, React",
                "resumeSection", "Skills",
                "originalText", "None",
                "errorType", "Completeness",
                "severity", "High"
            ));
        }

        if (!hasProjects) {
            resumeQualityScore -= 10;
            issues.add(Map.of(
                "problem", "Missing Projects Section",
                "reason", "A lack of personal or professional engineering projects makes it hard to measure practical application of technical skills.",
                "suggestion", "Create a 'Projects' section highlighting 2-3 key technical projects, technologies used, and outcomes.",
                "improvedVersion", "### PROJECTS\n- **Mock Interview Agent**: E2E interview simulator built using React and Spring Boot.",
                "resumeSection", "Projects",
                "originalText", "None",
                "errorType", "Completeness",
                "severity", "Medium"
            ));
        }

        if (!hasCertifications) {
            resumeQualityScore -= 5;
            issues.add(Map.of(
                "problem", "Missing Certifications Section",
                "reason", "Professional certificates validate specialized training and industry knowledge.",
                "suggestion", "Include a 'Certifications' section listing relevant credentials (e.g. AWS, Oracle, Google Cloud).",
                "improvedVersion", "### CERTIFICATIONS\n- AWS Certified Developer - Associate (2025)",
                "resumeSection", "Certifications",
                "originalText", "None",
                "errorType", "Completeness",
                "severity", "Low"
            ));
        }

        // 2. Check technical keywords
        String[] keywords = {"java", "python", "javascript", "react", "sql", "html", "css", "typescript", "aws", "git", "docker", "kubernetes", "spring", "node", "angular"};
        int matchedKeywordsCount = 0;
        for (String kw : keywords) {
            if (lowerContent.contains(kw)) {
                matchedKeywordsCount++;
            }
        }
        skillsScore = 40 + (matchedKeywordsCount * 4);
        if (skillsScore > 100) skillsScore = 100;

        if (matchedKeywordsCount < 4) {
            atsScore -= 10;
            issues.add(Map.of(
                "problem", "Low Technical Keyword Density",
                "reason", "ATS search indexes score candidate profile relevance based on the density of target keywords.",
                "suggestion", "Ensure your skills section lists foundational technologies (e.g. Java, Git, SQL, React) matching standard developer roles.",
                "improvedVersion", "Languages & Frameworks: Java, Python, Spring Boot, React, SQL, Git",
                "resumeSection", "Skills",
                "originalText", "None",
                "errorType", "ATS Keyword",
                "severity", "Medium"
            ));
        }

        // 3. Scan for weak action verbs
        if (lowerContent.contains("worked on")) {
            professionalismScore -= 8;
            issues.add(Map.of(
                "problem", "Passive Verb 'worked on'",
                "reason", "The phrase 'worked on' is passive and fails to communicate ownership, responsibility, or leadership.",
                "suggestion", "Substitute 'worked on' with a strong action verb such as 'Engineered', 'Developed', or 'Spearheaded'.",
                "improvedVersion", "Engineered and refactored core backend modules.",
                "resumeSection", "Experience",
                "originalText", "worked on",
                "errorType", "Action Verb",
                "severity", "Medium"
            ));
        }

        if (lowerContent.contains("helped")) {
            professionalismScore -= 6;
            issues.add(Map.of(
                "problem", "Vague Action Verb 'helped'",
                "reason", "'Helped' sounds supportive rather than showing individual technical contribution.",
                "suggestion", "Use active, collaborative verbs like 'Collaborated on', 'Facilitated', or 'Optimized'.",
                "improvedVersion", "Collaborated with cross-functional engineering teams to deploy microservices.",
                "resumeSection", "Experience",
                "originalText", "helped",
                "errorType", "Action Verb",
                "severity", "Medium"
            ));
        }

        if (lowerContent.contains("responsible for")) {
            professionalismScore -= 7;
            issues.add(Map.of(
                "problem", "Passive Phrase 'responsible for'",
                "reason", "'Responsible for' lists duties instead of accomplishments. Recruiter indexes value action-driven descriptions.",
                "suggestion", "Directly state the actions using active verbs like 'Spearheaded', 'Oversaw', or 'Designed'.",
                "improvedVersion", "Spearheaded the migration of legacy architecture to serverless cloud functions.",
                "resumeSection", "Experience",
                "originalText", "responsible for",
                "errorType", "Action Verb",
                "severity", "Medium"
            ));
        }

        // 4. Scan spelling typos
        Map<String, String> commonTypos = Map.of(
            "expereince", "experience",
            "recieve", "receive",
            "seperate", "separate",
            "definately", "definitely",
            "goverment", "government",
            "wether", "whether",
            "devlopment", "development"
        );

        for (Map.Entry<String, String> entry : commonTypos.entrySet()) {
            String typo = entry.getKey();
            String correction = entry.getValue();
            if (lowerContent.contains(typo)) {
                grammarScore -= 8;
                // Find where it is in the text roughly
                int index = lowerContent.indexOf(typo);
                int start = Math.max(0, index - 20);
                int end = Math.min(content.length(), index + typo.length() + 20);
                String context = content.substring(start, end).replace("\n", " ");
                issues.add(Map.of(
                    "problem", "Spelling Typo '" + typo + "'",
                    "reason", "Spelling mistakes look unprofessional and can lead to immediate rejection by screening recruiters.",
                    "suggestion", "Correct the typo '" + typo + "' to '" + correction + "'.",
                    "improvedVersion", context.replace(content.substring(index, index + typo.length()), correction),
                    "resumeSection", "Experience",
                    "originalText", content.substring(index, index + typo.length()),
                    "errorType", "Spelling",
                    "severity", "High"
                ));
            }
        }

        // 5. Measurable Achievements Heuristic
        boolean hasMetrics = lowerContent.contains("%") || content.matches(".*\\d+.*");
        if (!hasMetrics) {
            resumeQualityScore -= 12;
            issues.add(Map.of(
                "problem", "Lack of Measurable Achievements",
                "reason", "Without numbers or percentages, it is hard to measure the actual business value or scale of your contributions.",
                "suggestion", "Quantify accomplishments (e.g. 'improved efficiency by 20%', 'served 10k+ monthly active users').",
                "improvedVersion", "Optimized database query performance, reducing page load latency by 35%.",
                "resumeSection", "Experience",
                "originalText", "None",
                "errorType", "Completeness",
                "severity", "Medium"
            ));
        }

        // Guard score minimums
        if (atsScore < 30) atsScore = 30;
        if (grammarScore < 30) grammarScore = 30;
        if (skillsScore < 30) skillsScore = 30;
        if (professionalismScore < 30) professionalismScore = 30;
        if (resumeQualityScore < 30) resumeQualityScore = 30;

        // Build JSON response
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"atsScore\": ").append(atsScore).append(",\n");
        json.append("  \"grammarScore\": ").append(grammarScore).append(",\n");
        json.append("  \"skillsScore\": ").append(skillsScore).append(",\n");
        json.append("  \"professionalismScore\": ").append(professionalismScore).append(",\n");
        json.append("  \"resumeQualityScore\": ").append(resumeQualityScore).append(",\n");
        json.append("  \"issues\": [\n");

        for (int i = 0; i < issues.size(); i++) {
            Map<String, Object> issue = issues.get(i);
            json.append("    {\n");
            json.append("      \"problem\": \"").append(escapeJson(issue.get("problem").toString())).append("\",\n");
            json.append("      \"reason\": \"").append(escapeJson(issue.get("reason").toString())).append("\",\n");
            json.append("      \"suggestion\": \"").append(escapeJson(issue.get("suggestion").toString())).append("\",\n");
            json.append("      \"improvedVersion\": \"").append(escapeJson(issue.get("improvedVersion").toString())).append("\",\n");
            json.append("      \"resumeSection\": \"").append(escapeJson(issue.get("resumeSection").toString())).append("\",\n");
            json.append("      \"originalText\": \"").append(escapeJson(issue.get("originalText").toString())).append("\",\n");
            json.append("      \"errorType\": \"").append(escapeJson(issue.get("errorType").toString())).append("\",\n");
            json.append("      \"severity\": \"").append(escapeJson(issue.get("severity").toString())).append("\"\n");
            json.append("    }");
            if (i < issues.size() - 1) {
                json.append(",");
            }
            json.append("\n");
        }
        json.append("  ]\n");
        json.append("}");

        return json.toString();
    }

    private String escapeJson(String raw) {
        if (raw == null) return "";
        return raw.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\b", "\\b")
                  .replace("\f", "\\f")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    @Override
    public SelfIntroductionEvaluationResult evaluateSelfIntroduction(String introductionText, String resumeSummary) {
        if (introductionText == null) {
            introductionText = "";
        }
        int wordCount = introductionText.trim().isEmpty() ? 0 : introductionText.trim().split("\\s+").length;

        int communication = 85;
        int grammar = 90;
        int professionalism = 88;
        int relevance = 80;

        if (wordCount < 100) {
            communication -= 10;
        } else if (wordCount > 300) {
            communication -= 5;
        }

        if (resumeSummary == null || resumeSummary.isEmpty()) {
            relevance = 50;
        } else {
            String lowerIntro = introductionText.toLowerCase();
            String[] skills = {"java", "spring", "react", "sql", "aws", "docker", "kubernetes", "python", "javascript", "typescript"};
            int matches = 0;
            for (String skill : skills) {
                if (lowerIntro.contains(skill) && resumeSummary.toLowerCase().contains(skill)) {
                    matches++;
                }
            }
            relevance = 60 + Math.min(matches * 8, 40);
        }

        int overall = (communication + grammar + professionalism + relevance) / 4;

        String strengths = "• Clear and professional tone.\n• Good logical flow in explaining your background.\n• Highlights key experience effectively.";
        String weaknesses = "• Could include more measurable metrics/achievements.\n• Minor phrasing improvements could increase fluency.";
        String missing = "• Measurable business outcomes of previous projects.\n• Explicit mention of your career objectives in this role.";
        String suggestions = "• Add specific metrics (e.g. 'improved performance by 20%').\n• Practice smooth transitions between academic history and work experience.";
        String improved = "Hello, I am a professional software engineer with a strong background in developing scalable applications. In my previous roles, I successfully designed APIs and worked with cloud technologies, improving efficiency by 25%. I am excited to apply my skills to help solve your technical challenges.";

        return SelfIntroductionEvaluationResult.builder()
                .communicationScore(communication)
                .grammarScore(grammar)
                .professionalismScore(professionalism)
                .resumeRelevanceScore(relevance)
                .overallScore(overall)
                .strengths(strengths)
                .weaknesses(weaknesses)
                .missingInformation(missing)
                .suggestions(suggestions)
                .improvedText(improved)
                .build();
    }
}
