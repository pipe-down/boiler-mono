package com.example.app.message.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MessageCreateRequest(
        String roomId,
        @NotNull Long senderId,
        @NotBlank @Size(max = 2000) String text
) {
}
