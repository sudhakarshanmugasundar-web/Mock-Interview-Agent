package com.mockinterview.service.interview;

import com.mockinterview.dto.interview.InterviewHistoryResponse;
import com.mockinterview.dto.interview.InterviewSessionRequest;
import com.mockinterview.dto.interview.InterviewSessionResponse;
import com.mockinterview.dto.interview.InterviewStatisticsResponse;
import com.mockinterview.entity.*;
import com.mockinterview.exception.DuplicateActiveSessionException;
import com.mockinterview.exception.InvalidSessionStateException;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.repository.InterviewSessionRepository;
import com.mockinterview.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class InterviewSessionService {

    private final InterviewSessionRepository sessionRepository;
    private final UserRepository userRepository;

    public InterviewSessionService(InterviewSessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public InterviewSessionResponse createSession(String email, InterviewSessionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        // Check for any active sessions (NOT_STARTED, IN_PROGRESS, PAUSED)
        List<InterviewStatus> activeStatuses = Arrays.asList(
                InterviewStatus.NOT_STARTED,
                InterviewStatus.IN_PROGRESS,
                InterviewStatus.PAUSED
        );
        sessionRepository.findByUserAndStatusIn(user, activeStatuses).ifPresent(s -> {
            throw new DuplicateActiveSessionException("You already have an active interview session (ID: " + s.getId() + ")");
        });

        // Validate Enums
        InterviewType type;
        try {
            type = InterviewType.valueOf(request.interviewType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid interview type. Must be HR, TECHNICAL, or CODING");
        }

        InterviewDifficulty difficulty;
        try {
            difficulty = InterviewDifficulty.valueOf(request.difficulty().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid difficulty. Must be EASY, MEDIUM, or HARD");
        }

        InterviewSession session = InterviewSession.builder()
                .user(user)
                .title(request.title())
                .status(InterviewStatus.NOT_STARTED)
                .interviewType(type)
                .difficulty(difficulty)
                .duration(0)
                .build();

        InterviewSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    @Transactional
    public InterviewSessionResponse startSession(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);

        if (session.getStatus() != InterviewStatus.NOT_STARTED) {
            throw new InvalidSessionStateException("Cannot start a session in status: " + session.getStatus());
        }

        session.setStartedAt(LocalDateTime.now());
        session.setStatus(InterviewStatus.IN_PROGRESS);

        InterviewSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    @Transactional
    public InterviewSessionResponse pauseSession(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);

        if (session.getStatus() != InterviewStatus.IN_PROGRESS) {
            throw new InvalidSessionStateException("Cannot pause a session in status: " + session.getStatus());
        }

        // Add elapsed time segment to cumulative duration
        if (session.getStartedAt() != null) {
            long elapsedSeconds = Duration.between(session.getStartedAt(), LocalDateTime.now()).toSeconds();
            session.setDuration(session.getDuration() + (int) elapsedSeconds);
        }

        session.setStatus(InterviewStatus.PAUSED);
        InterviewSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    @Transactional
    public InterviewSessionResponse resumeSession(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);

        if (session.getStatus() != InterviewStatus.PAUSED) {
            throw new InvalidSessionStateException("Cannot resume a session in status: " + session.getStatus());
        }

        // Reset startedAt to now to compute duration accurately during next pause/complete
        session.setStartedAt(LocalDateTime.now());
        session.setStatus(InterviewStatus.IN_PROGRESS);

        InterviewSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    @Transactional
    public InterviewSessionResponse completeSession(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);

        if (session.getStatus() != InterviewStatus.IN_PROGRESS && session.getStatus() != InterviewStatus.PAUSED) {
            throw new InvalidSessionStateException("Cannot complete a session in status: " + session.getStatus());
        }

        // Add remaining segment if completed from IN_PROGRESS state
        if (session.getStatus() == InterviewStatus.IN_PROGRESS && session.getStartedAt() != null) {
            long elapsedSeconds = Duration.between(session.getStartedAt(), LocalDateTime.now()).toSeconds();
            session.setDuration(session.getDuration() + (int) elapsedSeconds);
        }

        session.setEndedAt(LocalDateTime.now());
        session.setStatus(InterviewStatus.COMPLETED);

        InterviewSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    @Transactional
    public InterviewSessionResponse cancelSession(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);

        if (session.getStatus() == InterviewStatus.COMPLETED || session.getStatus() == InterviewStatus.CANCELLED) {
            throw new InvalidSessionStateException("Cannot cancel an already finished session");
        }

        // Add remaining segment if cancelled from IN_PROGRESS state
        if (session.getStatus() == InterviewStatus.IN_PROGRESS && session.getStartedAt() != null) {
            long elapsedSeconds = Duration.between(session.getStartedAt(), LocalDateTime.now()).toSeconds();
            session.setDuration(session.getDuration() + (int) elapsedSeconds);
        }

        session.setEndedAt(LocalDateTime.now());
        session.setStatus(InterviewStatus.CANCELLED);

        InterviewSession savedSession = sessionRepository.save(session);
        return mapToResponse(savedSession);
    }

    @Transactional(readOnly = true)
    public InterviewSessionResponse getCurrentSession(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        List<InterviewStatus> activeStatuses = Arrays.asList(
                InterviewStatus.NOT_STARTED,
                InterviewStatus.IN_PROGRESS,
                InterviewStatus.PAUSED
        );

        InterviewSession session = sessionRepository.findByUserAndStatusIn(user, activeStatuses)
                .orElseThrow(() -> new ResourceNotFoundException("No active interview session found"));

        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public InterviewHistoryResponse getUserSessionHistory(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        Pageable pageable = PageRequest.of(page, size);
        Page<InterviewSession> sessionsPage = sessionRepository.findByUserOrderByIdDesc(user, pageable);

        List<InterviewSessionResponse> responses = sessionsPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return new InterviewHistoryResponse(
                responses,
                sessionsPage.getNumber(),
                sessionsPage.getTotalElements(),
                sessionsPage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public InterviewSessionResponse getSessionDetails(String email, Long sessionId) {
        InterviewSession session = getSessionAndVerifyOwnership(email, sessionId);
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public InterviewStatisticsResponse getStatistics(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        long total = sessionRepository.countByUser(user);
        long completed = sessionRepository.countByUserAndStatus(user, InterviewStatus.COMPLETED);
        long cancelled = sessionRepository.countByUserAndStatus(user, InterviewStatus.CANCELLED);
        long inProgress = sessionRepository.countByUserAndStatus(user, InterviewStatus.IN_PROGRESS);

        Double avgDuration = sessionRepository.getAverageCompletedDurationByUser(user);
        double avgDurationVal = avgDuration != null ? avgDuration : 0.0;

        return new InterviewStatisticsResponse(total, completed, cancelled, inProgress, avgDurationVal);
    }

    private InterviewSession getSessionAndVerifyOwnership(String email, Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with ID: " + sessionId));

        if (!session.getUser().getEmail().equals(email)) {
            throw new AccessDeniedException("You are not authorized to access this interview session");
        }

        return session;
    }

    private InterviewSessionResponse mapToResponse(InterviewSession session) {
        return new InterviewSessionResponse(
                session.getId(),
                session.getUser().getEmail(),
                session.getTitle(),
                session.getStatus().name(),
                session.getInterviewType().name(),
                session.getDifficulty().name(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getDuration(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
