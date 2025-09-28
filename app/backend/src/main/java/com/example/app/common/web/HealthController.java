package com.example.app.common.web;
import org.springframework.web.bind.annotation.*; import java.util.Map;
@RestController public class HealthController {
  @GetMapping("/api/health") public Map<String,Object> health(){ return Map.of("ok", true); }
}
