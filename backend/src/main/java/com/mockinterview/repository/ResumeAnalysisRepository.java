package com.mockinterview.repository;

import com.mockinterview.entity.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {
    Optional<ResumeAnalysis> findFirstByUserEmailOrderByCreatedAtDesc(String email);
    Optional<ResumeAnalysis> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
}
