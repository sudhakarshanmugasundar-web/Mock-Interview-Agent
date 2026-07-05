package com.mockinterview.repository;

import com.mockinterview.entity.InterviewDifficulty;
import com.mockinterview.entity.TechnicalQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicalQuestionRepository extends JpaRepository<TechnicalQuestion, Long> {

    List<TechnicalQuestion> findByCategoryAndDifficulty(String category, InterviewDifficulty difficulty);

    @Query(value = "SELECT * FROM technical_questions WHERE difficulty = :difficulty ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Optional<TechnicalQuestion> findRandomQuestionByDifficulty(@Param("difficulty") String difficulty);
}
