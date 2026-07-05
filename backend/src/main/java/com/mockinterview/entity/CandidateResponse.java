package com.mockinterview.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import com.mockinterview.config.SpringContextHelper;
import org.springframework.jdbc.core.JdbcTemplate;

@Entity
@Table(name = "candidate_responses")
public class CandidateResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession interviewSession;

    @Transient
    private String questionText;

    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "answer", columnDefinition = "TEXT")
    private String responseText;

    @Transient
    private AnswerMode answerMode = AnswerMode.TEXT;

    @Transient
    private Integer responseTime = 0; // response time in seconds

    @Transient
    private Integer questionSequence;

    @Column(name = "response_time")
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "audio_path")
    private String audioPath;

    public CandidateResponse() {}

    public CandidateResponse(Long id, InterviewSession interviewSession, String questionText, String responseText,
                             AnswerMode answerMode, Integer responseTime, Integer questionSequence, LocalDateTime submittedAt,
                             String audioPath) {
        this.id = id;
        this.interviewSession = interviewSession;
        this.questionSequence = questionSequence;
        setQuestionText(questionText);
        this.responseText = responseText;
        this.answerMode = answerMode != null ? answerMode : AnswerMode.TEXT;
        this.responseTime = responseTime;
        this.submittedAt = submittedAt != null ? submittedAt : LocalDateTime.now();
        this.audioPath = audioPath;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InterviewSession getInterviewSession() {
        return interviewSession;
    }

    public void setInterviewSession(InterviewSession interviewSession) {
        this.interviewSession = interviewSession;
    }

    public String getQuestionText() {
        if (questionText == null && questionId != null) {
            if (questionId <= 5) {
                InterviewType type = (interviewSession != null) ? interviewSession.getInterviewType() : null;
                questionText = QuestionCache.getQuestion(questionId, type);
            } else {
                try {
                    JdbcTemplate jdbcTemplate = SpringContextHelper.getBean(JdbcTemplate.class);
                    if (jdbcTemplate != null) {
                        String typeStr = "HR";
                        if (this.interviewSession != null && this.interviewSession.getInterviewType() != null) {
                            typeStr = this.interviewSession.getInterviewType().name();
                        }
                        if ("TECHNICAL".equals(typeStr) || "CODING".equals(typeStr)) {
                            List<String> textList = jdbcTemplate.queryForList(
                                    "SELECT question FROM technical_questions WHERE question_id = ?", String.class, this.questionId);
                            if (!textList.isEmpty()) {
                                this.questionText = textList.get(0);
                            }
                        } else {
                            List<String> textList = jdbcTemplate.queryForList(
                                    "SELECT question FROM hr_questions WHERE question_id = ?", String.class, this.questionId);
                            if (!textList.isEmpty()) {
                                this.questionText = textList.get(0);
                            }
                        }
                    }
                } catch (Exception e) {
                    // Ignore fallback
                }
            }
        }
        if (questionText == null) {
            questionText = "Standard interview question";
        }
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
        if (questionText != null) {
            InterviewType type = (interviewSession != null) ? interviewSession.getInterviewType() : null;
            for (long i = 1; i <= 5; i++) {
                String q = QuestionCache.getQuestion(i, type);
                if (q != null && q.trim().equalsIgnoreCase(questionText.trim())) {
                    this.questionId = i;
                    return;
                }
            }
            try {
                JdbcTemplate jdbcTemplate = SpringContextHelper.getBean(JdbcTemplate.class);
                if (jdbcTemplate != null) {
                    String typeStr = type != null ? type.name() : "HR";
                    if ("TECHNICAL".equals(typeStr) || "CODING".equals(typeStr)) {
                        List<Long> ids = jdbcTemplate.queryForList(
                                "SELECT question_id FROM technical_questions WHERE question = ? LIMIT 1", Long.class, questionText);
                        if (!ids.isEmpty()) {
                            this.questionId = ids.get(0);
                        } else {
                            jdbcTemplate.update("INSERT INTO technical_questions (question, difficulty, subject) VALUES (?, ?, ?)",
                                    questionText, "MEDIUM", "Dynamic AI");
                            this.questionId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
                        }
                    } else {
                        List<Long> ids = jdbcTemplate.queryForList(
                                "SELECT question_id FROM hr_questions WHERE question = ? LIMIT 1", Long.class, questionText);
                        if (!ids.isEmpty()) {
                            this.questionId = ids.get(0);
                        } else {
                            jdbcTemplate.update("INSERT INTO hr_questions (question, category) VALUES (?, ?)",
                                    questionText, "Dynamic AI");
                            this.questionId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
                        }
                    }
                }
            } catch (Exception e) {
                if (questionSequence != null) {
                    this.questionId = questionSequence.longValue();
                } else {
                    this.questionId = 1L;
                }
            }
        }
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public AnswerMode getAnswerMode() {
        return answerMode;
    }

    public void setAnswerMode(AnswerMode answerMode) {
        this.answerMode = answerMode;
    }

    public Integer getResponseTime() {
        return responseTime;
    }

    public void setResponseTime(Integer responseTime) {
        this.responseTime = responseTime;
    }

    public Integer getQuestionSequence() {
        if (questionSequence == null) {
            if (interviewSession != null && id != null) {
                try {
                    JdbcTemplate jdbcTemplate = SpringContextHelper.getBean(JdbcTemplate.class);
                    if (jdbcTemplate != null) {
                        List<Long> ids = jdbcTemplate.queryForList(
                                "SELECT response_id FROM candidate_responses WHERE session_id = ? ORDER BY response_id ASC",
                                Long.class, interviewSession.getId());
                        int idx = ids.indexOf(id);
                        if (idx >= 0) {
                            questionSequence = idx + 1;
                        }
                    }
                } catch (Exception e) {
                    // Ignore fallback
                }
            }
        }
        if (questionSequence == null && questionId != null) {
            questionSequence = questionId.intValue();
        }
        return questionSequence;
    }

    public void setQuestionSequence(Integer questionSequence) {
        this.questionSequence = questionSequence;
        if (questionSequence != null && this.questionId == null) {
            this.questionId = questionSequence.longValue();
        }
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getAudioPath() {
        return audioPath;
    }

    public void setAudioPath(String audioPath) {
        this.audioPath = audioPath;
    }

    public static CandidateResponseBuilder builder() {
        return new CandidateResponseBuilder();
    }

    public static class CandidateResponseBuilder {
        private Long id;
        private InterviewSession interviewSession;
        private String questionText;
        private String responseText;
        private AnswerMode answerMode = AnswerMode.TEXT;
        private Integer responseTime;
        private Integer questionSequence;
        private LocalDateTime submittedAt;
        private String audioPath;

        public CandidateResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public CandidateResponseBuilder interviewSession(InterviewSession interviewSession) {
            this.interviewSession = interviewSession;
            return this;
        }

        public CandidateResponseBuilder questionText(String questionText) {
            this.questionText = questionText;
            return this;
        }

        public CandidateResponseBuilder responseText(String responseText) {
            this.responseText = responseText;
            return this;
        }

        public CandidateResponseBuilder answerMode(AnswerMode answerMode) {
            this.answerMode = answerMode;
            return this;
        }

        public CandidateResponseBuilder responseTime(Integer responseTime) {
            this.responseTime = responseTime;
            return this;
        }

        public CandidateResponseBuilder questionSequence(Integer questionSequence) {
            this.questionSequence = questionSequence;
            return this;
        }

        public CandidateResponseBuilder submittedAt(LocalDateTime submittedAt) {
            this.submittedAt = submittedAt;
            return this;
        }

        public CandidateResponseBuilder audioPath(String audioPath) {
            this.audioPath = audioPath;
            return this;
        }

        public CandidateResponse build() {
            return new CandidateResponse(id, interviewSession, questionText, responseText, answerMode, responseTime, questionSequence, submittedAt, audioPath);
        }
    }
}
