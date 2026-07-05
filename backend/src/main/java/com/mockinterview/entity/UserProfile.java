package com.mockinterview.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "resume_url", length = 500)
    private String resumeUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UserProfile() {}

    public UserProfile(Long id, User user, String firstName, String lastName, String bio, String resumeUrl, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        setFirstName(firstName);
        setLastName(lastName);
        this.bio = bio;
        this.resumeUrl = resumeUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getFirstName() {
        if (fullName == null) return null;
        String trimmed = fullName.trim();
        int spaceIndex = trimmed.indexOf(' ');
        return spaceIndex > 0 ? trimmed.substring(0, spaceIndex) : trimmed;
    }

    public void setFirstName(String firstName) {
        String last = getLastName();
        String f = firstName != null ? firstName.trim() : "";
        String l = last != null ? last.trim() : "";
        this.fullName = (f + " " + l).trim();
        if (this.fullName.isEmpty()) this.fullName = null;
    }

    public String getLastName() {
        if (fullName == null) return null;
        String trimmed = fullName.trim();
        int spaceIndex = trimmed.indexOf(' ');
        return spaceIndex > 0 ? trimmed.substring(spaceIndex + 1) : "";
    }

    public void setLastName(String lastName) {
        String first = getFirstName();
        String f = first != null ? first.trim() : "";
        String l = lastName != null ? lastName.trim() : "";
        this.fullName = (f + " " + l).trim();
        if (this.fullName.isEmpty()) this.fullName = null;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public void setResumeUrl(String resumeUrl) {
        this.resumeUrl = resumeUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static UserProfileBuilder builder() {
        return new UserProfileBuilder();
    }

    public static class UserProfileBuilder {
        private Long id;
        private User user;
        private String firstName;
        private String lastName;
        private String bio;
        private String resumeUrl;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public UserProfileBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserProfileBuilder user(User user) {
            this.user = user;
            return this;
        }

        public UserProfileBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public UserProfileBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public UserProfileBuilder bio(String bio) {
            this.bio = bio;
            return this;
        }

        public UserProfileBuilder resumeUrl(String resumeUrl) {
            this.resumeUrl = resumeUrl;
            return this;
        }

        public UserProfileBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserProfileBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public UserProfile build() {
            return new UserProfile(id, user, firstName, lastName, bio, resumeUrl, createdAt, updatedAt);
        }
    }
}
