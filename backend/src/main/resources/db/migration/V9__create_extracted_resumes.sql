-- V9__create_extracted_resumes.sql
-- Create table for storing structured extracted resume information

CREATE TABLE extracted_resumes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    skills TEXT,
    programming_languages TEXT,
    frameworks TEXT,
    projects TEXT,
    experience TEXT,
    education TEXT,
    certifications TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_extracted_resumes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
