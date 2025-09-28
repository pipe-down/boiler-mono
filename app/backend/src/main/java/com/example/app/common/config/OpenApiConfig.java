package com.example.app.common.config;
import io.swagger.v3.oas.models.info.Info; import io.swagger.v3.oas.models.OpenAPI; import org.springframework.context.annotation.*;
@Configuration public class OpenApiConfig {
  @Bean public OpenAPI openAPI(){ return new OpenAPI().info(new Info().title("Chatstack API").version("0.1.0")); }
}
