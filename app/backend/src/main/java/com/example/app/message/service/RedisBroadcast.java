package com.example.app.message.service;

import com.example.app.message.web.dto.MessageResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisBroadcast implements MessageListener {
    private static final Logger log = LoggerFactory.getLogger(RedisBroadcast.class);
    private final StringRedisTemplate redis;
    private final MessageBroadcaster localBroadcaster;
    private final ObjectMapper objectMapper;

    public RedisBroadcast(StringRedisTemplate redis, MessageBroadcaster localBroadcaster) {
        this.redis = redis;
        this.localBroadcaster = localBroadcaster;
        this.objectMapper = new ObjectMapper();
        // Register JavaTimeModule to handle Instant, ZonedDateTime, etc.
        this.objectMapper.findAndRegisterModules();
    }

    public void publish(MessageResponse dto) {
        try {
            String channel = "chat:" + dto.roomId();
            String json = objectMapper.writeValueAsString(dto);
            redis.convertAndSend(channel, json);
        } catch (Exception e) {
            log.error("Failed to publish message to Redis channel: {}", dto, e);
        }
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String json = new String(message.getBody());
            MessageResponse dto = objectMapper.readValue(json, MessageResponse.class);
            // Emit to local subscribers
            localBroadcaster.emit(dto.roomId(), dto);
        } catch (Exception e) {
            log.error("Failed to process message from Redis: {}", new String(message.getBody()), e);
        }
    }
}
