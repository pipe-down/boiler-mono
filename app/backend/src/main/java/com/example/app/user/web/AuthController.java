package com.example.app.user.web;

import com.example.app.user.domain.User;
import com.example.app.user.service.AuthService;
import com.example.app.user.web.dto.LoginRequest;
import com.example.app.user.web.dto.RegisterRequest;
import com.example.app.user.web.dto.TokenResponse;
import com.example.app.user.web.dto.UserPublicResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserPublicResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request.email(), request.password(), request.displayName());
        UserPublicResponse response = new UserPublicResponse(user.getId(), user.getEmail(), user.getDisplayName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password())
                .map(token -> ResponseEntity.ok(new TokenResponse(token)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
