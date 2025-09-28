package com.example.app.message.service;

import com.example.app.message.web.dto.MessageResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class MessageBroadcaster {
    private final ConcurrentHashMap<String, Sinks.Many<MessageResponse>> sinks = new ConcurrentHashMap<>();

    public void emit(String room, MessageResponse dto) {
        sinks.computeIfAbsent(room, k -> Sinks.many().multicast().onBackpressureBuffer()).tryEmitNext(dto);
    }

    public Flux<MessageResponse> stream(String room) {
        return sinks.computeIfAbsent(room, k -> Sinks.many().multicast().onBackpressureBuffer()).asFlux();
    }
}
