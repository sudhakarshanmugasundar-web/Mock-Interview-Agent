package com.mockinterview.dto.user;

import jakarta.validation.constraints.Size;

public record UserProfileRequest(
    @Size(max = 100, message = "First name must not exceed 100 characters")
    String firstName,

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    String lastName,

    @Size(max = 1000, message = "Bio must not exceed 1000 characters")
    String bio,

    @Size(max = 512, message = "Resume URL must not exceed 512 characters")
    String resumeUrl
) {}
