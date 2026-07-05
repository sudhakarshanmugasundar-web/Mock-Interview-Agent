package com.mockinterview.exception;

public class DuplicateActiveSessionException extends RuntimeException {
    public DuplicateActiveSessionException(String message) {
        super(message);
    }
}
