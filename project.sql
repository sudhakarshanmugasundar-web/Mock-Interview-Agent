CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('CANDIDATE','ADMIN') DEFAULT 'CANDIDATE',
    account_status ENUM('ACTIVE','INACTIVE','BLOCKED') DEFAULT 'ACTIVE',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, password)
VALUES
('Sudhakar', 'sudhakarff96@gmail.com', 'Sudhakar@2428'),
('Rahul', 'rahul@gmail.com', 'Rahul@123'),
('Priya', 'priya@gmail.com', 'Priya@123');


SELECT * FROM users;