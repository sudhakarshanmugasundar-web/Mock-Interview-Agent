-- V6__add_self_introduction.sql
-- Add self_introduction and self_introduction_draft columns to interview_sessions

ALTER TABLE interview_sessions ADD COLUMN self_introduction TEXT NULL;
ALTER TABLE interview_sessions ADD COLUMN self_introduction_draft TEXT NULL;
