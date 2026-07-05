package com.mockinterview.service.auth;

import com.mockinterview.dto.auth.*;
import com.mockinterview.entity.Role;
import com.mockinterview.entity.RoleName;
import com.mockinterview.entity.User;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.exception.TokenRefreshException;
import com.mockinterview.mapper.UserMapper;
import com.mockinterview.repository.RoleRepository;
import com.mockinterview.repository.UserRepository;
import com.mockinterview.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final TokenService tokenService;
    private final UserMapper userMapper;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       TokenService tokenService,
                       UserMapper userMapper) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.tokenService = tokenService;
        this.userMapper = userMapper;
    }

    @Transactional
    public UserResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        Role candidateRole = roleRepository.findByName(RoleName.ROLE_CANDIDATE)
                .orElseThrow(() -> new ResourceNotFoundException("Error: Default Candidate Role not found."));

        Set<Role> roles = new HashSet<>();
        roles.add(candidateRole);

        User user = User.builder()
                .email(registerRequest.email())
                .password(passwordEncoder.encode(registerRequest.password()))
                .roles(roles)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    @Transactional
    public TokenResponse loginUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = tokenProvider.generateToken(authentication);
        var refreshToken = tokenService.createRefreshToken(userDetails.getUsername());

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return new TokenResponse(
                accessToken,
                refreshToken.getToken(),
                user.getId(),
                user.getEmail(),
                roles
        );
    }

    @Transactional
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.refreshToken();

        return tokenService.findByToken(requestRefreshToken)
                .map(tokenService::verifyExpiration)
                .map(refreshToken -> {
                    User user = refreshToken.getUser();
                    String accessToken = tokenProvider.generateTokenFromUsername(user.getEmail());
                    // Generate new rotating refresh token
                    var newRefreshToken = tokenService.createRefreshToken(user.getEmail());
                    
                    List<String> roles = user.getRoles().stream()
                            .map(role -> role.getName().name())
                            .collect(Collectors.toList());

                    return new TokenResponse(
                            accessToken,
                            newRefreshToken.getToken(),
                            user.getId(),
                            user.getEmail(),
                            roles
                    );
                })
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken, "Refresh token is not in database."));
    }

    @Transactional
    public void logoutUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        tokenService.deleteByUserId(user.getId());
    }
}
