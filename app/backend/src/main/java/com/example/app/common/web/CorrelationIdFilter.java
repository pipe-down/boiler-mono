package com.example.app.common.web;
import jakarta.servlet.*; import jakarta.servlet.http.*; import org.slf4j.*; import org.springframework.stereotype.Component; import java.io.IOException; import java.util.UUID;
@Component public class CorrelationIdFilter implements Filter {
  static final String HDR = "X-Request-ID"; private static final Logger log=LoggerFactory.getLogger(CorrelationIdFilter.class);
  @Override public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
    HttpServletRequest r=(HttpServletRequest)req; HttpServletResponse w=(HttpServletResponse)res;
    String id = r.getHeader(HDR); if (id==null||id.isBlank()) id=UUID.randomUUID().toString();
    w.setHeader(HDR, id); MDC.put("reqId", id);
    try { chain.doFilter(req,res); } finally { MDC.remove("reqId"); }
  }
}
