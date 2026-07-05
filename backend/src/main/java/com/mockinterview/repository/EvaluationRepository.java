package com.mockinterview.repository;

import com.mockinterview.entity.CandidateResponse;
import com.mockinterview.entity.Evaluation;
import com.mockinterview.entity.InterviewSession;
import com.mockinterview.config.SpringContextHelper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    
    List<Evaluation> findByInterviewSessionOrderByIdAsc(InterviewSession session);

    default Optional<Evaluation> findByCandidateResponse(CandidateResponse candidateResponse) {
        if (candidateResponse == null || candidateResponse.getInterviewSession() == null) {
            return Optional.empty();
        }
        InterviewSession session = candidateResponse.getInterviewSession();
        
        CandidateResponseRepository responseRepo = SpringContextHelper.getBean(CandidateResponseRepository.class);
        if (responseRepo == null) {
            return Optional.empty();
        }
        
        List<CandidateResponse> responses = responseRepo.findByInterviewSessionOrderByQuestionSequenceAsc(session);
        if (responses.isEmpty()) {
            responses = responseRepo.findByInterviewSessionOrderByIdAsc(session);
        }
        
        int index = -1;
        for (int i = 0; i < responses.size(); i++) {
            if (responses.get(i).getId().equals(candidateResponse.getId())) {
                index = i;
                break;
            }
        }
        
        if (index == -1) {
            return Optional.empty();
        }
        
        List<Evaluation> evals = findByInterviewSessionOrderByIdAsc(session);
        if (index < evals.size()) {
            return Optional.of(evals.get(index));
        }
        
        return Optional.empty();
    }
}
