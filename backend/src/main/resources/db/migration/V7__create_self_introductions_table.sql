-- V7__create_self_introductions_table.sql
CREATE TABLE self_introductions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,
    introduction_text TEXT NULL,
    word_count INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    submission_time TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT fk_self_introductions_session FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
    CONSTRAINT fk_self_introductions_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
