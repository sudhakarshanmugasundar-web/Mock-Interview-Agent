package com.mockinterview.dto.auth;

import java.util.List;

public record TokenResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    Long userId,
    String email,
    List<String> roles
) {
    public TokenResponse(String accessToken, String refreshToken, Long userId, String email, List<String> roles) {
        this(accessToken, refreshToken, "Bearer", userId, email, roles);
    }
}
