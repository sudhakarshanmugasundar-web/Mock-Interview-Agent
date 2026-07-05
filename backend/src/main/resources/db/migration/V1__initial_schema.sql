-- V1__initial_schema.sql
-- Database Migration script for Mock Interview Agent

-- 1. Create Roles Table
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create User-Roles Mapping Join Table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed Roles
INSERT INTO roles (name) VALUES ('ROLE_CANDIDATE');
INSERT INTO roles (name) VALUES ('ROLE_ADMIN');

-- 6. Seed Default Admin User
-- Email: admin@mockinterview.com, Password: AdminPassword123!
-- BCrypt Hash: $2a$12$K15b67PZk8Z1r7T1T1e2y.OefjLqT.6b4D7Rpq9uJjIskGj16QGmW
INSERT INTO users (email, password, enabled) VALUES 
('admin@mockinterview.com', '$2a$12$K15b67PZk8Z1r7T1T1e2y.OefjLqT.6b4D7Rpq9uJjIskGj16QGmW', TRUE);

-- Associate Admin User with ROLE_ADMIN (Assuming User ID 1 and Role ID 2)
INSERT INTO user_roles (user_id, role_id) VALUES (1, 2);
