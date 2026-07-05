package com.mockinterview.repository;

import com.mockinterview.entity.CandidateResponse;
import com.mockinterview.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateResponseRepository extends JpaRepository<CandidateResponse, Long> {

    List<CandidateResponse> findByInterviewSessionOrderByIdAsc(InterviewSession session);

    default List<CandidateResponse> findByInterviewSessionOrderByQuestionSequenceAsc(InterviewSession session) {
        return findByInterviewSessionOrderByIdAsc(session);
    }

    Optional<CandidateResponse> findFirstByInterviewSessionAndResponseTextIsNull(InterviewSession session);

    long countByInterviewSession(InterviewSession session);
}
