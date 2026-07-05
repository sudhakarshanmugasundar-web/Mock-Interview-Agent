package com.mockinterview.repository;

import com.mockinterview.entity.ResumeIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResumeIssueRepository extends JpaRepository<ResumeIssue, Long> {
}
