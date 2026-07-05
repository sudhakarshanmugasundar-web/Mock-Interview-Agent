package com.mockinterview.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", columnDefinition = "ENUM('ACTIVE','INACTIVE','BLOCKED')")
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", columnDefinition = "ENUM('CANDIDATE','ADMIN')")
    private UserRole role = UserRole.CANDIDATE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (username == null && email != null) {
            int atIdx = email.indexOf('@');
            username = atIdx > 0 ? email.substring(0, atIdx) : email;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public User() {}

    public User(Long id, String email, String password, boolean enabled, Set<Role> roles, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        setEnabled(enabled);
        setRoles(roles);
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isEnabled() {
        return accountStatus == AccountStatus.ACTIVE;
    }

    public void setEnabled(boolean enabled) {
        this.accountStatus = enabled ? AccountStatus.ACTIVE : AccountStatus.INACTIVE;
    }

    public Set<Role> getRoles() {
        Set<Role> roles = new HashSet<>();
        if (role != null) {
            Role r = new Role();
            if (role == UserRole.CANDIDATE) {
                r.setId(2L);
                r.setName(RoleName.ROLE_CANDIDATE);
            } else if (role == UserRole.ADMIN) {
                r.setId(1L);
                r.setName(RoleName.ROLE_ADMIN);
            }
            roles.add(r);
        }
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        if (roles != null && !roles.isEmpty()) {
            Role r = roles.iterator().next();
            if (r.getName() == RoleName.ROLE_CANDIDATE) {
                this.role = UserRole.CANDIDATE;
            } else if (r.getName() == RoleName.ROLE_ADMIN) {
                this.role = UserRole.ADMIN;
            }
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String username;
        private String email;
        private String password;
        private boolean enabled = true;
        private Set<Role> roles = new HashSet<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public UserBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserBuilder username(String username) {
            this.username = username;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserBuilder enabled(boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        public UserBuilder roles(Set<Role> roles) {
            this.roles = roles;
            return this;
        }

        public UserBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public User build() {
            User user = new User(id, email, password, enabled, roles, createdAt, updatedAt);
            user.setUsername(username);
            return user;
        }
    }
}
