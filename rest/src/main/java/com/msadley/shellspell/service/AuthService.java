package com.msadley.shellspell.service;

import com.msadley.shellspell.dto.AuthResponse;
import com.msadley.shellspell.dto.LoginRequest;
import com.msadley.shellspell.dto.RegisterRequest;
import com.msadley.shellspell.dto.UserResponse;
import com.msadley.shellspell.exception.BadRequestException;
import com.msadley.shellspell.model.User;
import com.msadley.shellspell.model.UserRole;
import com.msadley.shellspell.repository.UserRepository;
import com.msadley.shellspell.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email is already in use");
        }

        UserRole role = UserRole.PLAYER;
        if (request.username().toLowerCase().contains("admin")) {
            role = UserRole.ADMIN;
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        return new UserResponse(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail(), savedUser.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadRequestException("User not found"));

        String token = jwtTokenProvider.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }
}
