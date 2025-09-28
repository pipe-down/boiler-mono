package com.example.chat.web;
import org.springframework.http.*; import org.springframework.web.bind.MethodArgumentNotValidException; import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetails> invalid(MethodArgumentNotValidException ex){
    var p=new ProblemDetails("about:blank","Validation Failed",400, ex.getMessage());
    return ResponseEntity.status(400).contentType(MediaType.valueOf("application/problem+json")).body(p);
  }
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ProblemDetails> unknown(Exception ex){
    var p=new ProblemDetails("about:blank","Internal Server Error",500, ex.getMessage());
    return ResponseEntity.status(500).contentType(MediaType.valueOf("application/problem+json")).body(p);
  }
}
