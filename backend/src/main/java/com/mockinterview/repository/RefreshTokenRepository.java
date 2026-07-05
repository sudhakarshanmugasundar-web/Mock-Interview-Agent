package com.mockinterview.repository;

import com.mockinterview.entity.RefreshToken;
import com.mockinterview.entity.User;
import org.springframework.stereotype.Repository;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class RefreshTokenRepository {

    private final Map<Long, RefreshToken> tokens = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public Optional<RefreshToken> findByToken(String token) {
        if (token == null) return Optional.empty();
        return tokens.values().stream()
                .filter(t -> token.equals(t.getToken()))
                .findFirst();
    }

    public <S extends RefreshToken> S save(S entity) {
        if (entity.getId() == null) {
            entity.setId(idGenerator.getAndIncrement());
        }
        tokens.put(entity.getId(), entity);
        return entity;
    }

    public void deleteByUser(User user) {
        if (user == null || user.getId() == null) return;
        tokens.values().removeIf(t -> t.getUser() != null && user.getId().equals(t.getUser().getId()));
    }

    public void delete(RefreshToken entity) {
        if (entity != null && entity.getId() != null) {
            tokens.remove(entity.getId());
        }
    }
}
