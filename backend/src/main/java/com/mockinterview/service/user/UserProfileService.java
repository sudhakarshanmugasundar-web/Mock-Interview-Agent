package com.mockinterview.service.user;

import com.mockinterview.dto.user.UserProfileRequest;
import com.mockinterview.dto.user.UserProfileResponse;
import com.mockinterview.entity.User;
import com.mockinterview.entity.UserProfile;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.repository.UserProfileRepository;
import com.mockinterview.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.net.MalformedURLException;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfileService(UserProfileRepository userProfileRepository, UserRepository userRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        UserProfile profile = userProfileRepository.findByUserEmail(email)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
                    UserProfile transientProfile = new UserProfile();
                    transientProfile.setUser(user);
                    return transientProfile;
                });
        return mapToResponse(profile);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UserProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        profile.setFirstName(request.firstName());
        profile.setLastName(request.lastName());
        profile.setBio(request.bio());
        profile.setResumeUrl(request.resumeUrl());

        UserProfile savedProfile = userProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    @Transactional
    public UserProfileResponse uploadResume(String email, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 5MB");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("Invalid file name");
        }
        String ext = "";
        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex >= 0) {
            ext = originalFilename.substring(dotIndex).toLowerCase();
        }
        if (!ext.equals(".pdf") && !ext.equals(".docx")) {
            throw new IllegalArgumentException("Unsupported file type. Only PDF and DOCX are allowed.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        try {
            Path uploadDir = Paths.get("uploads/resumes");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            
            // Delete old file
            String oldUrl = profile.getResumeUrl();
            if (oldUrl != null && oldUrl.contains(":uploads/resumes/")) {
                int colonIdx = oldUrl.indexOf(":uploads/resumes/");
                Path oldPath = Paths.get(oldUrl.substring(colonIdx + 1));
                Files.deleteIfExists(oldPath);
            }

            String filename = user.getId() + "_" + System.currentTimeMillis() + ext;
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String storedValue = originalFilename + ":" + filePath.toString();
            profile.setResumeUrl(storedValue);
            
            UserProfile savedProfile = userProfileRepository.save(profile);
            return mapToResponse(savedProfile);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store resume file: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Resource getResumeFile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user: " + email));

        String url = profile.getResumeUrl();
        if (url == null || !url.contains(":uploads/resumes/")) {
            throw new ResourceNotFoundException("No resume file uploaded");
        }

        int colonIndex = url.indexOf(":uploads/resumes/");
        String originalName = url.substring(0, colonIndex);
        String filePathStr = url.substring(colonIndex + 1);

        try {
            Path path = Paths.get(filePathStr);
            if (!Files.exists(path)) {
                throw new ResourceNotFoundException("Resume file not found on disk");
            }
            return new UrlResource(path.toUri()) {
                @Override
                public String getFilename() {
                    return originalName;
                }
            };
        } catch (MalformedURLException e) {
            throw new RuntimeException("Failed to read resume file path: " + e.getMessage(), e);
        }
    }

    private UserProfileResponse mapToResponse(UserProfile profile) {
        String url = profile.getResumeUrl();
        if (url != null && url.contains(":uploads/resumes/")) {
            int colonIndex = url.indexOf(":uploads/resumes/");
            String originalName = url.substring(0, colonIndex);
            url = "/api/users/profile/resume?filename=" + org.springframework.web.util.UriUtils.encode(originalName, java.nio.charset.StandardCharsets.UTF_8);
        }
        return new UserProfileResponse(
                profile.getId(),
                profile.getUser().getEmail(),
                profile.getFirstName(),
                profile.getLastName(),
                profile.getBio(),
                url
        );
    }
}
