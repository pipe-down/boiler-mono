package com.example.app.user.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.example.app.user.domain.User;
import com.example.app.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Algorithm algorithm;
    private final String issuer;
    private final long ttlMinutes;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${jwt.secret}") String secret,
                       @Value("${jwt.issuer}") String issuer,
                       @Value("${jwt.access-token-ttl-min}") long ttlMinutes) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.algorithm = Algorithm.HMAC256(secret);
        this.issuer = issuer;
        this.ttlMinutes = ttlMinutes;
    }

    @Transactional
    public User register(String email, String rawPassword, String displayName) {
        userRepository.findByEmail(email).ifPresent(existing -> {
            throw new IllegalArgumentException("이미 등록된 이메일입니다.");
        });
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setDisplayName(displayName);
        return userRepository.save(user);
    }

    public Optional<String> login(String email, String rawPassword) {
        return userRepository.findByEmail(email)
                .filter(user -> passwordEncoder.matches(rawPassword, user.getPasswordHash()))
                .map(user -> JWT.create()
                        .withIssuer(issuer)
                        .withSubject(user.getId().toString())
                        .withClaim("email", user.getEmail())
                        .withClaim("name", user.getDisplayName())
                        .withClaim("senderId", deriveSenderId(user.getId()))
                        .withIssuedAt(new Date())
                        .withExpiresAt(Date.from(Instant.now().plusSeconds(ttlMinutes * 60)))
                        .sign(algorithm)
                );
    }

    public static long deriveSenderId(UUID userId) {
        int hash = userId.hashCode();
        return Integer.toUnsignedLong(hash);
    }
}
