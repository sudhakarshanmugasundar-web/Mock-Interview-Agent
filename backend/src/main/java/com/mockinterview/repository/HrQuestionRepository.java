package com.mockinterview.repository;

import com.mockinterview.entity.HrQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HrQuestionRepository extends JpaRepository<HrQuestion, Long> {

    List<HrQuestion> findByCategory(String category);

    @Query(value = "SELECT * FROM hr_questions ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Optional<HrQuestion> findRandomQuestion();
}
