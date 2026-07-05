-- V5: Add fluency_score column to evaluations table for HR AI evaluation
ALTER TABLE evaluations ADD COLUMN fluency_score DECIMAL(5, 2) NULL AFTER grammar_score;
