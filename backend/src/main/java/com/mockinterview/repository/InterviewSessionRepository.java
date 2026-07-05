package com.mockinterview.repository;

import com.mockinterview.entity.InterviewSession;
import com.mockinterview.entity.InterviewStatus;
import com.mockinterview.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    Page<InterviewSession> findByUserOrderByIdDesc(User user, Pageable pageable);

    List<InterviewSession> findByUser(User user);

    @Query("SELECT s FROM InterviewSession s WHERE s.user = :user AND s.status IN :statuses")
    Optional<InterviewSession> findByUserAndStatusIn(@Param("user") User user, 
                                                    @Param("statuses") Collection<InterviewStatus> statuses);

    long countByUserAndStatus(User user, InterviewStatus status);

    long countByUser(User user);

    @Query(value = "SELECT AVG(TIMESTAMPDIFF(SECOND, start_time, end_time)) FROM interview_sessions WHERE user_id = :#{#user.id} AND status = 'COMPLETED'", nativeQuery = true)
    Double getAverageCompletedDurationByUser(@Param("user") User user);
}
