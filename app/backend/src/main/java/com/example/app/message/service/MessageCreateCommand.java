package com.example.app.message.service;

public record MessageCreateCommand(
        String roomId,
        Long senderId,
        String text
) {
}
