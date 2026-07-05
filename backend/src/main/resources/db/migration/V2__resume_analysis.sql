-- V2__resume_analysis.sql
-- Create tables for Resume Analyzer and Optimizer

CREATE TABLE resume_analyses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    resume_url VARCHAR(500) NOT NULL,
    raw_text LONGTEXT,
    ats_score INT NOT NULL,
    grammar_score INT NOT NULL,
    professionalism_score INT NOT NULL,
    resume_quality_score INT NOT NULL,
    optimized_resume LONGTEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resume_analyses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resume_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    problem VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    improved_version TEXT,
    CONSTRAINT fk_resume_issues_analysis FOREIGN KEY (analysis_id) REFERENCES resume_analyses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
