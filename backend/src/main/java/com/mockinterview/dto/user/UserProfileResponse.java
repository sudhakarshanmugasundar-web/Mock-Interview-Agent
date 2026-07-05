package com.mockinterview.dto.user;

public record UserProfileResponse(
    Long id,
    String email,
    String firstName,
    String lastName,
    String bio,
    String resumeUrl
) {}
