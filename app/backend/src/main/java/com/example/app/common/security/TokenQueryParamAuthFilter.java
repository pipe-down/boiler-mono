package com.example.app.common.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class TokenQueryParamAuthFilter extends OncePerRequestFilter {

    private final Algorithm alg;
    private final String issuer;

    public TokenQueryParamAuthFilter(@Value("${jwt.secret}") String secret, @Value("${jwt.issuer}") String issuer) {
        this.alg = Algorithm.HMAC256(secret);
        this.issuer = issuer;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        // Only apply this filter to the SSE stream path, and only if Authorization header is not present
        if (req.getRequestURI().startsWith("/api/messages/stream/") && req.getHeader("Authorization") == null) {
            String token = req.getParameter("token");
            if (token != null && !token.isBlank()) {
                try {
                    var dec = JWT.require(alg).withIssuer(issuer).build().verify(token);
                    var auth = new UsernamePasswordAuthenticationToken(dec.getSubject(), null, java.util.List.of());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } catch (Exception ignored) {
                    // Invalid token, will proceed without authentication and be caught by authorization checks
                    SecurityContextHolder.clearContext();
                }
            }
        }
        chain.doFilter(req, res);
    }
}
