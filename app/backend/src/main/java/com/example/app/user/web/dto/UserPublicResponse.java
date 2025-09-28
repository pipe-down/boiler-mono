package com.example.app.user.web.dto;

import java.util.UUID;

public record UserPublicResponse(
        UUID id,
        String email,
        String displayName
) {
}
