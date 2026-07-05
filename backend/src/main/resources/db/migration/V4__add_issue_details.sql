-- V4__add_issue_details.sql
-- Add detailed diagnostics to resume_issues

ALTER TABLE resume_issues 
ADD COLUMN resume_section VARCHAR(100),
ADD COLUMN original_text TEXT,
ADD COLUMN error_type VARCHAR(50),
ADD COLUMN severity VARCHAR(20);
