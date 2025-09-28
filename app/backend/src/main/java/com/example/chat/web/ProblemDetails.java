package com.example.chat.web;
import com.fasterxml.jackson.annotation.JsonInclude; @JsonInclude(JsonInclude.Include.NON_NULL)
public record ProblemDetails(String type, String title, int status, String detail) {}