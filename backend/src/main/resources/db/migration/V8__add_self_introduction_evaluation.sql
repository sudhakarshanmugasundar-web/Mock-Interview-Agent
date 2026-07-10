-- V8__add_self_introduction_evaluation.sql
ALTER TABLE self_introductions
ADD COLUMN communication_score INT NULL,
ADD COLUMN grammar_score INT NULL,
ADD COLUMN professionalism_score INT NULL,
ADD COLUMN resume_relevance_score INT NULL,
ADD COLUMN overall_score INT NULL,
ADD COLUMN strengths TEXT NULL,
ADD COLUMN weaknesses TEXT NULL,
ADD COLUMN missing_information TEXT NULL,
ADD COLUMN suggestions TEXT NULL,
ADD COLUMN improved_text TEXT NULL;
