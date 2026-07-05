package com.mockinterview.controller.interview;

import com.mockinterview.dto.interview.*;
import com.mockinterview.service.interview.AiInterviewService;
import com.mockinterview.service.interview.InterviewSessionService;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewSessionService sessionService;
    private final AiInterviewService aiInterviewService;

    public InterviewController(InterviewSessionService sessionService, AiInterviewService aiInterviewService) {
        this.sessionService = sessionService;
        this.aiInterviewService = aiInterviewService;
    }

    @PostMapping("/create")
    public ResponseEntity<InterviewSessionResponse> createSession(@Valid @RequestBody InterviewSessionRequest request,
                                                                  @AuthenticationPrincipal UserDetails userDetails) {
        InterviewSessionResponse response = sessionService.createSession(userDetails.getUsername(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/start/{sessionId}")
    public ResponseEntity<InterviewSessionResponse> startSession(@PathVariable("sessionId") Long sessionId,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        InterviewSessionResponse response = sessionService.startSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pause/{sessionId}")
    public ResponseEntity<InterviewSessionResponse> pauseSession(@PathVariable("sessionId") Long sessionId,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        InterviewSessionResponse response = sessionService.pauseSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resume/{sessionId}")
    public ResponseEntity<InterviewSessionResponse> resumeSession(@PathVariable("sessionId") Long sessionId,
                                                                  @AuthenticationPrincipal UserDetails userDetails) {
        InterviewSessionResponse response = sessionService.resumeSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/complete/{sessionId}")
    public ResponseEntity<InterviewSessionResponse> completeSession(@PathVariable("sessionId") Long sessionId,
                                                                     @AuthenticationPrincipal UserDetails userDetails) {
        InterviewSessionResponse response = sessionService.completeSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cancel/{sessionId}")
    public ResponseEntity<InterviewSessionResponse> cancelSession(@PathVariable("sessionId") Long sessionId,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        InterviewSessionResponse response = sessionService.cancelSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/current")
    public ResponseEntity<InterviewSessionResponse> getCurrentSession(@AuthenticationPrincipal UserDetails userDetails) {
        InterviewSessionResponse response = sessionService.getCurrentSession(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<InterviewHistoryResponse> getHistory(@RequestParam(value = "page", defaultValue = "0") int page,
                                                               @RequestParam(value = "size", defaultValue = "10") int size,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        InterviewHistoryResponse response = sessionService.getUserSessionHistory(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/detailed")
    public ResponseEntity<DetailedHistoryResponse> getDetailedHistory(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        DetailedHistoryResponse response = aiInterviewService.getDetailedHistory(
                userDetails.getUsername(), page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<InterviewSessionResponse> getSessionDetails(@PathVariable("sessionId") Long sessionId,
                                                                      @AuthenticationPrincipal UserDetails userDetails) {
        InterviewSessionResponse response = sessionService.getSessionDetails(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statistics")
    public ResponseEntity<InterviewStatisticsResponse> getStatistics(@AuthenticationPrincipal UserDetails userDetails) {
        InterviewStatisticsResponse response = sessionService.getStatistics(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}/next-question")
    public ResponseEntity<QuestionResponse> getNextQuestion(@PathVariable("sessionId") Long sessionId,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        QuestionResponse response = aiInterviewService.getNextQuestion(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<FeedbackResponse> submitAnswer(@PathVariable("sessionId") Long sessionId,
                                                         @Valid @RequestBody AnswerRequest request,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        FeedbackResponse response = aiInterviewService.submitAnswer(userDetails.getUsername(), sessionId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}/feedback")
    public ResponseEntity<List<FeedbackResponse>> getFeedback(@PathVariable("sessionId") Long sessionId,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        List<FeedbackResponse> response = aiInterviewService.getFeedback(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}/result")
    public ResponseEntity<SessionResultResponse> getResult(@PathVariable("sessionId") Long sessionId,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        SessionResultResponse response = aiInterviewService.getResult(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<InterviewReportResponse> getReport(@PathVariable("sessionId") Long sessionId,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        InterviewReportResponse response = aiInterviewService.generateReport(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/audio")
    public ResponseEntity<AudioUploadResponse> uploadAudio(@RequestParam("file") MultipartFile file,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        String path = aiInterviewService.uploadAudio(userDetails.getUsername(), file);
        return ResponseEntity.ok(new AudioUploadResponse(path));
    }

    @GetMapping("/audio")
    public ResponseEntity<Resource> getAudioFile(@RequestParam("path") String path,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        Resource resource = aiInterviewService.getAudioFile(userDetails.getUsername(), path);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .body(resource);
    }
}
