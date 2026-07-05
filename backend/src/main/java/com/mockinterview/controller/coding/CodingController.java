package com.mockinterview.controller.coding;

import com.mockinterview.dto.coding.*;
import com.mockinterview.service.coding.CodingInterviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the Coding Interview round.
 *
 * Endpoints:
 *   GET  /api/coding/problem?difficulty=EASY|MEDIUM|HARD
 *   POST /api/coding/run
 *   POST /api/coding/submit
 */
@RestController
@RequestMapping("/api/coding")
public class CodingController {

    private final CodingInterviewService codingService;

    public CodingController(CodingInterviewService codingService) {
        this.codingService = codingService;
    }

    /**
     * Returns the problem description and starter code for the given difficulty.
     */
    @GetMapping("/problem")
    public ResponseEntity<CodingProblemResponse> getProblem(
            @RequestParam(defaultValue = "MEDIUM") String difficulty,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(codingService.getProblem(difficulty));
    }

    /**
     * Compiles and runs the candidate's code as-is (free-form run, no test cases).
     * Returns stdout + stderr.
     */
    @PostMapping("/run")
    public ResponseEntity<CodeRunResponse> runCode(
            @Valid @RequestBody CodeRunRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(codingService.runCode(request.code()));
    }

    /**
     * Runs all test cases against the candidate's code and calls AI for evaluation.
     * Returns detailed test case results + AI scores + feedback.
     */
    @PostMapping("/submit")
    public ResponseEntity<CodeEvaluationResponse> submitCode(
            @Valid @RequestBody CodeSubmitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(codingService.submitCode(request));
    }
}
