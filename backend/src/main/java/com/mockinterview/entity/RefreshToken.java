package com.mockinterview.entity;

import java.time.Instant;

public class RefreshToken {

    private Long id;

    private User user;

    private String token;

    private Instant expiryDate;

    private boolean revoked = false;

    public boolean isExpired() {
        return expiryDate.isBefore(Instant.now());
    }

    public RefreshToken() {}

    public RefreshToken(Long id, User user, String token, Instant expiryDate, boolean revoked) {
        this.id = id;
        this.user = user;
        this.token = token;
        this.expiryDate = expiryDate;
        this.revoked = revoked;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Instant expiryDate) {
        this.expiryDate = expiryDate;
    }

    public boolean isRevoked() {
        return revoked;
    }

    public void setRevoked(boolean revoked) {
        this.revoked = revoked;
    }

    public static RefreshTokenBuilder builder() {
        return new RefreshTokenBuilder();
    }

    public static class RefreshTokenBuilder {
        private Long id;
        private User user;
        private String token;
        private Instant expiryDate;
        private boolean revoked = false;

        public RefreshTokenBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public RefreshTokenBuilder user(User user) {
            this.user = user;
            return this;
        }

        public RefreshTokenBuilder token(String token) {
            this.token = token;
            return this;
        }

        public RefreshTokenBuilder expiryDate(Instant expiryDate) {
            this.expiryDate = expiryDate;
            return this;
        }

        public RefreshTokenBuilder revoked(boolean revoked) {
            this.revoked = revoked;
            return this;
        }

        public RefreshToken build() {
            return new RefreshToken(id, user, token, expiryDate, revoked);
        }
    }
}
