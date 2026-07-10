package com.mockinterview.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component("geminiAiProvider")
public class GeminiAiProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiProvider.class);

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiAiProvider(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    @Override
    public String generateQuestion(AiQuestionRequest request) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }

        String prompt = buildQuestionPrompt(request);
        return callGemini(prompt);
    }

    @Override
    public AiEvaluationResult evaluateResponse(AiEvaluationRequest request) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }

        String prompt = buildEvaluationPrompt(request);
        String responseText = callGemini(prompt);

        try {
            // Clean markdown block tags if the LLM outputted them
            String cleanedJson = responseText.trim();
            if (cleanedJson.startsWith("```json")) {
                cleanedJson = cleanedJson.substring(7);
            }
            if (cleanedJson.startsWith("```")) {
                cleanedJson = cleanedJson.substring(3);
            }
            if (cleanedJson.endsWith("```")) {
                cleanedJson = cleanedJson.substring(0, cleanedJson.length() - 3);
            }
            cleanedJson = cleanedJson.trim();

            return objectMapper.readValue(cleanedJson, AiEvaluationResult.class);
        } catch (Exception e) {
            log.error("Failed to parse evaluation result JSON from Gemini: {}. Raw response: {}", e.getMessage(), responseText);
            // Return fallback default values
            return AiEvaluationResult.builder()
                    .technicalKnowledge(7)
                    .communication(7)
                    .confidence(7)
                    .grammar(8)
                    .relevance(7)
                    .completeness(6)
                    .professionalism(7)
                    .fluency(7)
                    .overallScore(7.0)
                    .feedbackText("Response received. AI evaluation parsing ran into formatting errors. Detailed feedback: " + responseText)
                    .strengths("Basic answer structure is acceptable.")
                    .weaknesses("Unable to parse detailed scores.")
                    .suggestions("Structure your reply clearly to align with the prompt.")
                    .sampleAnswer("A strong answer would clearly address the question with specific examples, structured reasoning, and professional language.")
                    .build();
        }
    }

    @Override
    public String analyzeContent(String content, String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }
        return callGemini(prompt + "\n\nContent:\n" + content);
    }

    private String buildQuestionPrompt(AiQuestionRequest request) {
        StringBuilder sb = new StringBuilder();
        int seq = request.sequenceNumber();
        String type = request.interviewType() != null ? request.interviewType().toUpperCase() : "CODING";
        String diff = request.difficulty() != null ? request.difficulty().toUpperCase() : "MEDIUM";

        // Determine round context from sequence number (CODING = mixed session)
        boolean isTechnicalSequence = (seq == 3 || seq == 4) && ("CODING".equals(type) || "TECHNICAL".equals(type));
        boolean isHrSequence = (seq == 1 || seq == 2) && ("CODING".equals(type) || "HR".equals(type));
        boolean isCodingSequence = seq == 5 && ("CODING".equals(type));

        if (isTechnicalSequence) {
            sb.append("You are a senior tech lead conducting a live, human-like TECHNICAL interview for a Java/Spring Boot role. Your tone is collaborative, expert, and conversational. Refer to the candidate by name: ").append(request.candidateName()).append("\n");
            sb.append("Difficulty: ").append(diff).append(".\n");
            sb.append("Question sequence: ").append(seq).append(" of 5.\n\n");

            if (request.history() != null && !request.history().isEmpty()) {
                sb.append("Previous conversation history:\n");
                for (int i = 0; i < request.history().size(); i++) {
                    HistoryItem item = request.history().get(i);
                    sb.append("Interviewer: ").append(item.questionText()).append("\n");
                    sb.append("Candidate: ").append(item.responseText()).append("\n");
                }
                sb.append("\n");
            }

            sb.append("Generate ONE technical question based on these rules:\n");
            sb.append("1. GREETING/TRANSITION: Start by acknowledging their previous answer warmly (e.g. 'That makes sense', 'Good explanation of that concept'). Then, introduce the next topic naturally.\n");
            sb.append("2. TOPIC POOL — rotate across: Java Core, Spring Boot, SQL & JPA, OOP, REST APIs, Collections, Exception Handling, Multithreading, JVM.\n");
            sb.append("3. DIFFICULTY GUIDELINES:\n");
            if ("EASY".equals(diff)) {
                sb.append("  Easy: Basic definitions, arrays/lists, checking vs unchecked exceptions. e.g. HashMap vs Hashtable, OOP pillars.\n");
            } else if ("MEDIUM".equals(diff)) {
                sb.append("  Medium: Design trade-offs, transactional propagation, N+1 query issue, thread-safety, custom exceptions.\n");
            } else {
                sb.append("  Hard: Deep JVM GC internals, JMM happens-before, virtual threads, distributed locking, deadlock prevention.\n");
            }
            sb.append("4. FOLLOW-UP: If they mentioned a specific tech or framework in their last answer, dig into that instead of shifting topics. Be conversational.\n");
            sb.append("5. Output ONLY the question/prompt text. No numbering or preamble.\n");

        } else if (isCodingSequence) {
            sb.append("You are a senior developer conducting the CODING ROUND of the interview. You are collaborative and helpful. Refer to the candidate by name: ").append(request.candidateName()).append("\n");
            sb.append("Difficulty: ").append(diff).append(".\n\n");
            sb.append("Generate ONE coding or algorithmic problem text. Formulate it naturally, e.g. 'Let's work on a coding puzzle now, ").append(request.candidateName()).append("...'.\n");
            if ("EASY".equals(diff)) {
                sb.append("Easy: String manipulation, simple recursion, array operations.\n");
            } else if ("MEDIUM".equals(diff)) {
                sb.append("Medium: Linked lists, stack/queue operations, binary search, collections.\n");
            } else {
                sb.append("Hard: Advanced data structures, system design algorithms, optimization puzzles.\n");
            }
            sb.append("Output ONLY the problem definition text.\n");

        } else {
            // HR or intro sequence
            sb.append("You are a warm, professional, human-like HR/Behavioural interviewer named Alex. Your tone is conversational, encouraging, yet thorough.\n");
            sb.append("Candidate's Name: ").append(request.candidateName()).append("\n");
            sb.append("Difficulty level: ").append(diff).append(".\n");

            if (request.resumeText() != null && !request.resumeText().trim().isEmpty()) {
                sb.append("Candidate's Resume Content:\n").append(request.resumeText()).append("\n");
            }
            if (request.skillsBio() != null && !request.skillsBio().trim().isEmpty()) {
                sb.append("Candidate's Skills Bio:\n").append(request.skillsBio()).append("\n");
            }
            sb.append("Current question index: ").append(seq).append(" of 5.\n");

            if (request.history() != null && !request.history().isEmpty()) {
                sb.append("Conversation History:\n");
                for (int i = 0; i < request.history().size(); i++) {
                    HistoryItem item = request.history().get(i);
                    sb.append("Interviewer: ").append(item.questionText()).append("\n");
                    sb.append("Candidate: ").append(item.responseText()).append("\n");
                }
            }

            sb.append("\nGenerate the next question/prompt text. Follow these human-like interviewer rules:\n");
            sb.append("1. GREETING (Seq = 1): Greet ").append(request.candidateName()).append(" warmly by name, introduce yourself, mention you've glanced at their resume, and ask a warm introductory question (e.g. asking them to summarize their journey or highlight a project they are proud of).\n");
            sb.append("2. RESUME-AWARENESS & FOLLOW-UPS (Seq = 2, 3, 4): Look at their last answer. Acknowledge what they said with a brief, encouraging phrase (e.g. 'That sounds like a challenging project!', 'Great choice of tech stack.'). Then, ask a deeper follow-up question digging into details of their projects, internships, education, or skills. Do not switch topics abruptly; behave like a real interviewer digging into their experience.\n");
            sb.append("3. PROFESSIONAL CLOSE (Seq = 5): Acknowledge their last answer, tell them this is the final question of the interview, and ask a closing question (e.g. what they seek in their next role, how they keep up with tech, or why they are interested in this position). Keep the wrap-up professional.\n");
            sb.append("4. GENERAL STYLE: Keep the generated text natural and conversational. Avoid robot-like phrasing, numbering, or headers. Output ONLY the question text (including any brief conversational acknowledgment or encouragement at the start).\n");
            sb.append("5. AVOID REPETITION: Do NOT repeat questions already asked in the conversation history.\n");
        }

        return sb.toString();
    }

    private String buildEvaluationPrompt(AiEvaluationRequest request) {
        String type = request.interviewType() != null ? request.interviewType().toUpperCase() : "CODING";
        boolean isTechnicalRound = "TECHNICAL".equals(type) || "CODING".equals(type);

        String roundContext;
        String techKnowledgeDef;
        String scoringWeight;

        if (isTechnicalRound) {
            roundContext = "This is a TECHNICAL interview round covering Java Core, Spring Boot, SQL & JPA, OOP Principles, REST API Design, Collections Framework, Exception Handling, Multithreading & Concurrency, and JVM Internals.";
            techKnowledgeDef = "technicalKnowledge - CORRECTNESS: is the answer factually accurate? DEPTH: does it explain internals, trade-offs, and edge cases? EXPLANATION QUALITY: does the candidate show true understanding vs surface-level recall? (Weight this heavily for technical rounds)";
            scoringWeight = "Scoring weight: technicalKnowledge=40%, relevance=20%, completeness=20%, communication=10%, others shared=10%.";
        } else {
            roundContext = "This is an HR behavioural interview round. Focus on soft skills, communication, professional maturity, and situational judgement.";
            techKnowledgeDef = "technicalKnowledge - Domain awareness and professional knowledge relevant to the behavioural question";
            scoringWeight = "Scoring weight: communication=25%, relevance=20%, professionalism=20%, confidence=15%, others shared=20%.";
        }

        return "You are an expert AI interview evaluator.\n" +
                roundContext + "\n" +
                scoringWeight + "\n\n" +
                "Question: " + request.questionText() + "\n" +
                "Candidate's Response: " + request.responseText() + "\n\n" +
                "Evaluate the response on ALL criteria below (each scored 1-10):\n" +
                "1. " + techKnowledgeDef + "\n" +
                "2. communication - Clarity, articulation, and effective expression of ideas\n" +
                "3. fluency - Smooth and natural language flow; absence of hesitation or filler words\n" +
                "4. confidence - Conviction, assertiveness, and self-assurance in the response\n" +
                "5. grammar - Grammatical correctness and proper sentence construction\n" +
                "6. relevance - How precisely the answer addresses the actual question (penalise vague or off-topic answers)\n" +
                "7. completeness - Whether the answer covers all important sub-aspects of the question\n" +
                "8. professionalism - Appropriate tone, vocabulary, and professional demeanor\n\n" +
                "Additionally provide:\n" +
                "- overallScore: Weighted average out of 10.0 applying the scoring weights above\n" +
                "- feedbackText: 2-3 sentences covering correctness, explanation quality, and one key improvement area\n" +
                "- strengths: What the candidate did well — be specific (1-3 bullet points)\n" +
                "- weaknesses: Gaps: missing concepts, incorrect facts, or poor explanation quality (1-3 bullet points)\n" +
                "- suggestions: Concrete actionable study/practice tips to improve (1-3 bullet points)\n" +
                "- sampleAnswer: A model answer demonstrating best-practice depth and correctness (3-5 sentences)\n\n" +
                "Respond ONLY with a valid JSON object. No markdown, no extra text:\n" +
                "{\n" +
                "  \"technicalKnowledge\": 1-10,\n" +
                "  \"communication\": 1-10,\n" +
                "  \"fluency\": 1-10,\n" +
                "  \"confidence\": 1-10,\n" +
                "  \"grammar\": 1-10,\n" +
                "  \"relevance\": 1-10,\n" +
                "  \"completeness\": 1-10,\n" +
                "  \"professionalism\": 1-10,\n" +
                "  \"overallScore\": 7.5,\n" +
                "  \"feedbackText\": \"Overall assessment here\",\n" +
                "  \"strengths\": \"• Point 1\\n• Point 2\",\n" +
                "  \"weaknesses\": \"• Point 1\\n• Point 2\",\n" +
                "  \"suggestions\": \"• Tip 1\\n• Tip 2\",\n" +
                "  \"sampleAnswer\": \"Model answer text here\"\n" +
                "}";
    }

    private String callGemini(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build Gemini Request Payload
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> partsMap = new HashMap<>();
        partsMap.put("parts", List.of(textPart));

        Map<String, Object> contentsMap = new HashMap<>();
        contentsMap.put("contents", List.of(partsMap));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(contentsMap, headers);

        try {
            String response = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response);
            return root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch (Exception e) {
            log.error("Failed to generate content from Gemini API: {}", e.getMessage());
            throw new RuntimeException("AI provider error: " + e.getMessage(), e);
        }
    }

    @Override
    public SelfIntroductionEvaluationResult evaluateSelfIntroduction(String introductionText, String resumeSummary) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }

        String prompt = "You are an expert recruiter and communication coach. Evaluate the candidate's self-introduction.\n\n" +
                "Candidate's Self-Introduction:\n" + introductionText + "\n\n" +
                "Candidate's Resume/Profile Summary:\n" + (resumeSummary != null ? resumeSummary : "None") + "\n\n" +
                "Please score the introduction on the following criteria (each from 0 to 100):\n" +
                "1. communicationScore - Clarity, pacing, logic, and structure.\n" +
                "2. grammarScore - Grammar correctness, professional vocabulary, and sentence construction.\n" +
                "3. professionalismScore - Professionalism of tone, confidence, and choice of words.\n" +
                "4. resumeRelevanceScore - How relevant the introduction is to the provided resume summary. If no resume summary is provided, base it on standard expectations (e.g. 70).\n" +
                "5. overallScore - Overall effectiveness and impact of the self-introduction.\n\n" +
                "Also provide structured feedback:\n" +
                "- strengths: What the candidate did well (up to 5 bullet points, e.g. \"• Bullet 1\\n• Bullet 2\").\n" +
                "- weaknesses: Gaps or areas of hesitation (up to 5 bullet points).\n" +
                "- missingInformation: Crucial details missing from the self-introduction (e.g. missing skills, missing objective).\n" +
                "- suggestions: Concrete tips to improve.\n" +
                "- improvedText: A polished and refined version of their self-introduction, preserving their original background information.\n\n" +
                "Respond ONLY with a valid JSON object. No markdown block formatting, no extra text:\n" +
                "{\n" +
                "  \"communicationScore\": 85,\n" +
                "  \"grammarScore\": 90,\n" +
                "  \"professionalismScore\": 88,\n" +
                "  \"resumeRelevanceScore\": 80,\n" +
                "  \"overallScore\": 86,\n" +
                "  \"strengths\": \"• Good professional tone\\n• Structured introduction\",\n" +
                "  \"weaknesses\": \"• Lacked specific metrics\",\n" +
                "  \"missingInformation\": \"Mention of key technologies like Spring Boot\",\n" +
                "  \"suggestions\": \"Incorporate metrics and keep it concise\",\n" +
                "  \"improvedText\": \"Polished version of the introduction\"\n" +
                "}";

        String responseText = callGemini(prompt);

        try {
            String cleanedJson = responseText.trim();
            if (cleanedJson.startsWith("```json")) {
                cleanedJson = cleanedJson.substring(7);
            }
            if (cleanedJson.startsWith("```")) {
                cleanedJson = cleanedJson.substring(3);
            }
            if (cleanedJson.endsWith("```")) {
                cleanedJson = cleanedJson.substring(0, cleanedJson.length() - 3);
            }
            cleanedJson = cleanedJson.trim();

            return objectMapper.readValue(cleanedJson, SelfIntroductionEvaluationResult.class);
        } catch (Exception e) {
            log.error("Failed to parse self introduction evaluation JSON from Gemini: {}. Raw response: {}", e.getMessage(), responseText);
            return SelfIntroductionEvaluationResult.builder()
                    .communicationScore(75)
                    .grammarScore(80)
                    .professionalismScore(78)
                    .resumeRelevanceScore(70)
                    .overallScore(76)
                    .strengths("• Delivered basic background details.")
                    .weaknesses("• Formatting issue or parsing failure on LLM response.")
                    .missingInformation("Unable to parse detailed missing information.")
                    .suggestions("Try to restructure the introduction and verify key facts.")
                    .improvedText(introductionText)
                    .build();
        }
    }
}
