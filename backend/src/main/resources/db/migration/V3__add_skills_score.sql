-- V3__add_skills_score.sql
-- Add skills_score column to resume_analyses

ALTER TABLE resume_analyses ADD COLUMN skills_score INT NOT NULL DEFAULT 0;
