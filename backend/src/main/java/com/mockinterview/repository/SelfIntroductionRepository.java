package com.mockinterview.repository;

import com.mockinterview.entity.InterviewSession;
import com.mockinterview.entity.SelfIntroduction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SelfIntroductionRepository extends JpaRepository<SelfIntroduction, Long> {
    Optional<SelfIntroduction> findByInterviewSession(InterviewSession interviewSession);
    Optional<SelfIntroduction> findByInterviewSessionId(Long sessionId);
}
