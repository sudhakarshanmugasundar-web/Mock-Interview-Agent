package com.mockinterview.controller.interview;

import com.mockinterview.dto.interview.SelfIntroductionRequest;
import com.mockinterview.dto.interview.SelfIntroductionResponse;
import com.mockinterview.dto.interview.SelfIntroductionEvaluateRequest;
import com.mockinterview.service.interview.SelfIntroductionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interview/self-introduction")
public class SelfIntroductionController {

    private final SelfIntroductionService selfIntroductionService;

    public SelfIntroductionController(SelfIntroductionService selfIntroductionService) {
        this.selfIntroductionService = selfIntroductionService;
    }

    @PostMapping("/save")
    public ResponseEntity<SelfIntroductionResponse> saveDraft(@Valid @RequestBody SelfIntroductionRequest request,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        SelfIntroductionResponse response = selfIntroductionService.saveDraft(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/submit")
    public ResponseEntity<SelfIntroductionResponse> submitIntroduction(@Valid @RequestBody SelfIntroductionRequest request,
                                                                        @AuthenticationPrincipal UserDetails userDetails) {
        SelfIntroductionResponse response = selfIntroductionService.submitIntroduction(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SelfIntroductionResponse> getSelfIntroduction(@PathVariable("sessionId") Long sessionId,
                                                                        @AuthenticationPrincipal UserDetails userDetails) {
        SelfIntroductionResponse response = selfIntroductionService.getSelfIntroduction(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<SelfIntroductionResponse> evaluateSelfIntroduction(@Valid @RequestBody SelfIntroductionEvaluateRequest request,
                                                                             @AuthenticationPrincipal UserDetails userDetails) {
        SelfIntroductionResponse response = selfIntroductionService.evaluateSelfIntroduction(userDetails.getUsername(), request.sessionId());
        return ResponseEntity.ok(response);
    }
}
