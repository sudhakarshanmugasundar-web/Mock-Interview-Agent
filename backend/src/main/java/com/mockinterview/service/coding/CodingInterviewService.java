package com.mockinterview.service.coding;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockinterview.dto.coding.*;
import com.mockinterview.service.ai.AiProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates the coding interview round:
 *  1. Returns the CodingProblem for a given difficulty
 *  2. Compiles and runs code for "Run" requests
 *  3. Runs all test cases + calls AI for evaluation on "Submit" requests
 */
@Service
public class CodingInterviewService {

    private static final Logger log = LoggerFactory.getLogger(CodingInterviewService.class);

    private final JavaCodeExecutor executor;
    private final CodingProblemBank problemBank;
    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper;

    public CodingInterviewService(
            JavaCodeExecutor executor,
            CodingProblemBank problemBank,
            @Qualifier("geminiAiProvider") AiProvider aiProvider,
            ObjectMapper objectMapper
    ) {
        this.executor = executor;
        this.problemBank = problemBank;
        this.aiProvider = aiProvider;
        this.objectMapper = objectMapper;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Problem lookup
    // ─────────────────────────────────────────────────────────────────────────

    public CodingProblemResponse getProblem(String difficulty) {
        CodingProblemBank.CodingProblem p = problemBank.getByDifficulty(difficulty);
        long visible = p.testCases().stream().filter(tc -> !tc.hidden()).count();
        return new CodingProblemResponse(
            p.title(),
            p.description(),
            p.difficulty(),
            p.starterCode(),
            p.testCases().size(),
            (int) visible
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Run Code (free-form execution, no test harness)
    // ─────────────────────────────────────────────────────────────────────────

    public CodeRunResponse runCode(String code) {
        JavaCodeExecutor.ExecutionResult result = executor.runSolution(code);
        return new CodeRunResponse(
            result.output(),
            result.error(),
            result.compilationError(),
            result.executionTimeMs()
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Submit Code (test cases + AI evaluation)
    // ─────────────────────────────────────────────────────────────────────────

    public CodeEvaluationResponse submitCode(CodeSubmitRequest request) {
        CodingProblemBank.CodingProblem problem = problemBank.getByDifficulty(request.difficulty());

        // ── 1. Compile + run with test harness ────────────────────────────
        JavaCodeExecutor.ExecutionResult harnessResult =
            executor.runWithHarness(request.code(), problem.testHarnessCode());

        if (harnessResult.compilationError()) {
            return new CodeEvaluationResponse(
                List.of(),
                0,
                problem.testCases().size(),
                false,
                harnessResult.error(),
                0, 0, 0, 0, 0,
                "N/A", "N/A",
                "Code did not compile. Fix the compilation errors before re-submitting.",
                "", "", ""
            );
        }

        // ── 2. Match each output line to a test case ───────────────────────
        String[] lines = harnessResult.output().isEmpty()
            ? new String[0]
            : harnessResult.output().split("\n", -1);

        List<TestCaseResult> testResults = new ArrayList<>();
        List<CodingProblemBank.TestCase> cases = problem.testCases();
        int passed = 0;

        for (int i = 0; i < cases.size(); i++) {
            CodingProblemBank.TestCase tc = cases.get(i);
            String actual = (i < lines.length) ? lines[i].trim() : "(no output)";
            boolean ok = actual.equals(tc.expectedOutput().trim());
            if (ok) passed++;

            testResults.add(new TestCaseResult(
                tc.name(),
                "",                                          // input not exposed for security
                tc.hidden() ? "***" : tc.expectedOutput(),  // hide expected for hidden tests
                tc.hidden() && !ok ? "***" : actual,        // hide wrong answer for hidden
                ok,
                harnessResult.executionTimeMs() / cases.size(),
                tc.hidden()
            ));
        }

        // ── 3. AI code evaluation ─────────────────────────────────────────
        String testSummary = passed + "/" + cases.size() + " test cases passed.";
        CodeAiEval aiEval = evaluateWithAi(problem.title(), problem.description(), request.code(), testSummary);

        return new CodeEvaluationResponse(
            testResults,
            passed,
            cases.size(),
            true,
            "",
            aiEval.codeQuality(),
            aiEval.namingConvention(),
            aiEval.optimization(),
            aiEval.correctness(),
            aiEval.overall(),
            aiEval.timeComplexity(),
            aiEval.spaceComplexity(),
            aiEval.feedback(),
            aiEval.strengths(),
            aiEval.improvements(),
            aiEval.optimizedApproach()
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AI evaluation
    // ─────────────────────────────────────────────────────────────────────────

    private record CodeAiEval(
        int codeQuality, int namingConvention, int optimization, int correctness, int overall,
        String timeComplexity, String spaceComplexity,
        String feedback, String strengths, String improvements, String optimizedApproach
    ) {}

    private CodeAiEval evaluateWithAi(String title, String description, String code, String testSummary) {
        String prompt = buildAiPrompt(title, description, code, testSummary);
        try {
            String rawJson = aiProvider.analyzeContent(code, prompt);
            // Strip any markdown fencing
            String cleaned = rawJson.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
            }
            JsonNode node = objectMapper.readTree(cleaned);
            return new CodeAiEval(
                node.path("codeQualityScore").asInt(6),
                node.path("namingConventionScore").asInt(7),
                node.path("optimizationScore").asInt(6),
                node.path("correctnessScore").asInt(5),
                node.path("overallScore").asInt(6),
                node.path("timeComplexity").asText("O(?)"),
                node.path("spaceComplexity").asText("O(?)"),
                node.path("aiFeedback").asText("Evaluation unavailable."),
                node.path("strengths").asText(""),
                node.path("improvements").asText(""),
                node.path("optimizedApproach").asText("")
            );
        } catch (Exception e) {
            log.warn("AI code evaluation failed: {}", e.getMessage());
            return fallbackEval(testSummary);
        }
    }

    private String buildAiPrompt(String title, String description, String code, String testSummary) {
        return """
You are an expert Java interviewer evaluating a candidate's solution.

Problem: %s
Test Results: %s

Candidate's Java Code:
```java
%s
```

Evaluate this Java solution on the following criteria and respond ONLY with a valid JSON object (no markdown, no extra text):

{
  "codeQualityScore": <1-10, overall code structure, readability, comments, design>,
  "namingConventionScore": <1-10, Java naming conventions: camelCase, descriptive names, constants in UPPER_CASE>,
  "optimizationScore": <1-10, time/space efficiency, use of appropriate data structures, avoiding redundant work>,
  "correctnessScore": <1-10, logical correctness, handling edge cases, correctness of algorithm>,
  "overallScore": <1-10, weighted average prioritising correctness and optimization>,
  "timeComplexity": "<Big-O string e.g. O(n), O(n log n), O(n²)>",
  "spaceComplexity": "<Big-O string e.g. O(1), O(n)>",
  "aiFeedback": "<2-3 sentences assessing correctness, algorithmic approach, and code quality>",
  "strengths": "<bullet-point strengths, e.g. • Good use of HashMap\\n• Clear variable names>",
  "improvements": "<bullet-point improvements, e.g. • Handle null input\\n• Avoid nested loops>",
  "optimizedApproach": "<1-2 sentences describing the optimal solution approach for this problem>"
}
""".formatted(title, testSummary, code);
    }

    private CodeAiEval fallbackEval(String testSummary) {
        return new CodeAiEval(
            6, 7, 5, 5, 6,
            "O(n)", "O(n)",
            "Code submitted. " + testSummary + " AI detailed evaluation is temporarily unavailable.",
            "• Code was submitted successfully",
            "• Review your algorithm for edge cases\n• Ensure optimal time complexity",
            "Review the problem constraints and consider the most efficient data structure for the task."
        );
    }
}
