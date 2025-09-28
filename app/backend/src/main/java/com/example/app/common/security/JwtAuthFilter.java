package com.example.app.common.security;
import com.auth0.jwt.JWT; import com.auth0.jwt.algorithms.Algorithm;
import jakarta.servlet.*; import jakarta.servlet.http.*; import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component; import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException; import java.util.Map;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final Algorithm alg; private final String issuer;
  public JwtAuthFilter(@Value("${jwt.secret}") String secret, @Value("${jwt.issuer}") String issuer){
    this.alg = Algorithm.HMAC256(secret); this.issuer = issuer;
  }
  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) {
      try {
        var token = h.substring(7);
        var dec = JWT.require(alg).withIssuer(issuer).build().verify(token);
        var auth = new UsernamePasswordAuthenticationToken(dec.getSubject(), null, java.util.List.of());
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (Exception ignored) { /* invalid token -> no auth */ }
    }
    chain.doFilter(req, res);
  }
}
