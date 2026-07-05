package com.mockinterview.controller.user;

import com.mockinterview.dto.user.UserProfileRequest;
import com.mockinterview.dto.user.UserProfileResponse;
import com.mockinterview.service.user.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.util.UriUtils;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;

    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse response = userProfileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UserProfileRequest request,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse response = userProfileService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile/resume")
    public ResponseEntity<UserProfileResponse> uploadResume(@RequestParam("file") MultipartFile file,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse response = userProfileService.uploadResume(userDetails.getUsername(), file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile/resume")
    public ResponseEntity<Resource> getResumeFile(@AuthenticationPrincipal UserDetails userDetails) {
        Resource fileResource = userProfileService.getResumeFile(userDetails.getUsername());
        String filename = fileResource.getFilename() != null ? fileResource.getFilename() : "resume.pdf";
        String contentType = "application/pdf";
        if (filename.toLowerCase().endsWith(".docx")) {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + UriUtils.encode(filename, StandardCharsets.UTF_8) + "\"")
                .body(fileResource);
    }
}
