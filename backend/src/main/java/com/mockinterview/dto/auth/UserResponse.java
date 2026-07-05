package com.mockinterview.dto.auth;

import java.util.List;

public record UserResponse(
    Long id,
    String email,
    List<String> roles
) {}
