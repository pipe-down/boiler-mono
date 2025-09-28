package com.example.app.message.web.dto;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        String roomId,
        Long senderId,
        String text,
        Instant createdAt
) {
}
