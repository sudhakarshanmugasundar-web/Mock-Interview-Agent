package com.mockinterview.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_sessions")
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Transient
    private String title;

    @Convert(converter = InterviewStatusConverter.class)
    @Column(name = "status", columnDefinition = "ENUM('NOT_STARTED','IN_PROGRESS','COMPLETED','PAUSED','CANCELLED')")
    private InterviewStatus status;

    @Convert(converter = InterviewTypeConverter.class)
    @Column(name = "interview_type", columnDefinition = "ENUM('HR','TECHNICAL','MIXED','CODING')")
    private InterviewType interviewType;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", columnDefinition = "ENUM('EASY','MEDIUM','HARD')")
    private InterviewDifficulty difficulty;

    @Column(name = "start_time")
    private LocalDateTime startedAt;

    @Column(name = "end_time")
    private LocalDateTime endedAt;

    @Transient
    private Integer duration = 0; // Cumulative duration in seconds

    @Transient
    private LocalDateTime createdAt = LocalDateTime.now();

    @Transient
    private LocalDateTime updatedAt = LocalDateTime.now();

    public InterviewSession() {}

    public InterviewSession(Long id, User user, String title, InterviewStatus status, InterviewType interviewType,
                            InterviewDifficulty difficulty, LocalDateTime startedAt, LocalDateTime endedAt,
                            Integer duration, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.status = status;
        this.interviewType = interviewType;
        this.difficulty = difficulty;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        setDuration(duration != null ? duration : 0);
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

    public String getTitle() {
        if (title == null) {
            String typeStr = interviewType != null ? interviewType.name() : "Mock";
            String diffStr = difficulty != null ? difficulty.name() : "";
            return (typeStr + " " + diffStr + " Interview").trim();
        }
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public InterviewStatus getStatus() {
        return status;
    }

    public void setStatus(InterviewStatus status) {
        this.status = status;
    }

    public InterviewType getInterviewType() {
        return interviewType;
    }

    public void setInterviewType(InterviewType interviewType) {
        this.interviewType = interviewType;
    }

    public InterviewDifficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(InterviewDifficulty difficulty) {
        this.difficulty = difficulty;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public Integer getDuration() {
        if (startedAt != null && endedAt != null) {
            return (int) java.time.Duration.between(startedAt, endedAt).toSeconds();
        }
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
        if (duration != null && duration > 0) {
            if (this.startedAt == null) {
                this.startedAt = LocalDateTime.now().minusSeconds(duration);
            }
            if (this.endedAt == null) {
                this.endedAt = this.startedAt.plusSeconds(duration);
            }
        }
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

    public static InterviewSessionBuilder builder() {
        return new InterviewSessionBuilder();
    }

    public static class InterviewSessionBuilder {
        private Long id;
        private User user;
        private String title;
        private InterviewStatus status;
        private InterviewType interviewType;
        private InterviewDifficulty difficulty;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
        private Integer duration = 0;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public InterviewSessionBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public InterviewSessionBuilder user(User user) {
            this.user = user;
            return this;
        }

        public InterviewSessionBuilder title(String title) {
            this.title = title;
            return this;
        }

        public InterviewSessionBuilder status(InterviewStatus status) {
            this.status = status;
            return this;
        }

        public InterviewSessionBuilder interviewType(InterviewType interviewType) {
            this.interviewType = interviewType;
            return this;
        }

        public InterviewSessionBuilder difficulty(InterviewDifficulty difficulty) {
            this.difficulty = difficulty;
            return this;
        }

        public InterviewSessionBuilder startedAt(LocalDateTime startedAt) {
            this.startedAt = startedAt;
            return this;
        }

        public InterviewSessionBuilder endedAt(LocalDateTime endedAt) {
            this.endedAt = endedAt;
            return this;
        }

        public InterviewSessionBuilder duration(Integer duration) {
            this.duration = duration;
            return this;
        }

        public InterviewSessionBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public InterviewSessionBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public InterviewSession build() {
            return new InterviewSession(id, user, title, status, interviewType, difficulty, startedAt, endedAt, duration, createdAt, updatedAt);
        }
    }

    @Converter
    public static class InterviewStatusConverter implements AttributeConverter<InterviewStatus, String> {
        private static Boolean isH2 = null;

        private synchronized boolean checkIsH2() {
            if (isH2 == null) {
                try {
                    javax.sql.DataSource ds = com.mockinterview.config.SpringContextHelper.getBean(javax.sql.DataSource.class);
                    if (ds != null) {
                        try (java.sql.Connection conn = ds.getConnection()) {
                            String url = conn.getMetaData().getURL();
                            isH2 = url != null && url.contains("h2");
                        }
                    }
                } catch (Exception e) {
                    isH2 = true;
                }
            }
            return isH2 != null ? isH2 : true;
        }

        @Override
        public String convertToDatabaseColumn(InterviewStatus attribute) {
            if (attribute == null) return null;
            if (checkIsH2()) {
                return attribute.name();
            }
            switch (attribute) {
                case PAUSED:
                    return "IN_PROGRESS";
                case CANCELLED:
                    return "COMPLETED";
                default:
                    return attribute.name();
            }
        }

        @Override
        public InterviewStatus convertToEntityAttribute(String dbData) {
            if (dbData == null) return null;
            try {
                return InterviewStatus.valueOf(dbData);
            } catch (IllegalArgumentException e) {
                return InterviewStatus.IN_PROGRESS;
            }
        }
    }

    @Converter
    public static class InterviewTypeConverter implements AttributeConverter<InterviewType, String> {
        @Override
        public String convertToDatabaseColumn(InterviewType attribute) {
            if (attribute == null) return null;
            if (attribute == InterviewType.CODING) {
                return "MIXED";
            }
            return attribute.name();
        }

        @Override
        public InterviewType convertToEntityAttribute(String dbData) {
            if (dbData == null) return null;
            if ("MIXED".equalsIgnoreCase(dbData)) {
                return InterviewType.CODING;
            }
            try {
                return InterviewType.valueOf(dbData);
            } catch (IllegalArgumentException e) {
                return InterviewType.TECHNICAL;
            }
        }
    }
}
