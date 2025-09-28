package com.example.chat.web;
import jakarta.servlet.*; import jakarta.servlet.http.*; import org.springframework.beans.factory.annotation.*; import org.springframework.data.redis.core.StringRedisTemplate; import org.springframework.stereotype.Component;
import java.io.IOException; import java.time.Duration;
@Component public class IdempotencyFilter implements Filter {
  private final StringRedisTemplate redis; private final long ttl;
  public IdempotencyFilter(StringRedisTemplate r, @Value("${idempotency.ttl-sec:120}") long ttl){ this.redis=r; this.ttl=ttl; }
  @Override public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
    HttpServletRequest r=(HttpServletRequest)req; HttpServletResponse w=(HttpServletResponse)res;
    if ("POST".equalsIgnoreCase(r.getMethod())){
      String key=r.getHeader("Idempotency-Key");
      if (key!=null && !key.isBlank()){
        Boolean ok = redis.opsForValue().setIfAbsent("idemp:"+key,"1", Duration.ofSeconds(ttl));
        if (Boolean.FALSE.equals(ok)){ w.setStatus(409); w.getWriter().write("{"message":"duplicate request"}"); return; }
      }
    }
    chain.doFilter(req,res);
  }
}
