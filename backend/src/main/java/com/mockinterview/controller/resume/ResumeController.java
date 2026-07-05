package com.mockinterview.controller.resume;

import com.mockinterview.entity.ResumeAnalysis;
import com.mockinterview.service.resume.ResumeAnalysisService;
import com.mockinterview.service.resume.ResumeGeneratorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeAnalysisService resumeAnalysisService;
    private final ResumeGeneratorService resumeGeneratorService;

    public ResumeController(ResumeAnalysisService resumeAnalysisService,
                            ResumeGeneratorService resumeGeneratorService) {
        this.resumeAnalysisService = resumeAnalysisService;
        this.resumeGeneratorService = resumeGeneratorService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<ResumeAnalysis> analyzeResume(@RequestParam("file") MultipartFile file,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ResumeAnalysis analysis = resumeAnalysisService.analyzeResume(userDetails.getUsername(), file);
            return ResponseEntity.ok(analysis);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read resume file: " + e.getMessage(), e);
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<ResumeAnalysis> getLatestAnalysis(@AuthenticationPrincipal UserDetails userDetails) {
        ResumeAnalysis latest = resumeAnalysisService.getLatestAnalysis(userDetails.getUsername());
        if (latest == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(latest);
    }

    @PostMapping("/generate")
    public ResponseEntity<java.util.Map<String, String>> generateResume(@RequestBody java.util.Map<String, String> corrections,
                                                                        @AuthenticationPrincipal UserDetails userDetails) {
        try {
            java.util.Map<String, String> files = resumeGeneratorService.generateImprovedResume(userDetails.getUsername(), corrections);
            java.util.Map<String, String> urls = java.util.Map.of(
                "pdfUrl", "/resumes/download?format=pdf&file=" + files.get("pdfFile"),
                "docxUrl", "/resumes/download?format=docx&file=" + files.get("docxFile")
            );
            return ResponseEntity.ok(urls);
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate resume: " + e.getMessage(), e);
        }
    }

    @GetMapping("/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(@RequestParam("format") String format,
                                                                             @RequestParam("file") String fileName,
                                                                             @AuthenticationPrincipal UserDetails userDetails) {
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        try {
            java.nio.file.Path path = java.nio.file.Paths.get("uploads/resumes").resolve(fileName);
            if (!java.nio.file.Files.exists(path)) {
                return ResponseEntity.notFound().build();
            }

            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
            String contentType = format.equals("pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
