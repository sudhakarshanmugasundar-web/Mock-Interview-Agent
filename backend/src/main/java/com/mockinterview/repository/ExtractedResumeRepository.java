package com.mockinterview.repository;

import com.mockinterview.entity.ExtractedResume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExtractedResumeRepository extends JpaRepository<ExtractedResume, Long> {
    Optional<ExtractedResume> findFirstByUserEmailOrderByCreatedAtDesc(String email);
    Optional<ExtractedResume> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
}
