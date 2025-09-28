package com.example.app.message.web;

import com.example.app.message.service.MessageBroadcaster;
import com.example.app.message.web.dto.MessageResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/messages/stream")
public class MessageStreamController {

    private final MessageBroadcaster messageBroadcaster;

    public MessageStreamController(MessageBroadcaster messageBroadcaster) {
        this.messageBroadcaster = messageBroadcaster;
    }

    @GetMapping(path = "/{roomId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    // TODO: Implement fine-grained room access control. For now, any authenticated user can listen.
    @PreAuthorize("isAuthenticated()")
    public Flux<MessageResponse> streamMessages(@PathVariable String roomId) {
        return messageBroadcaster.stream(roomId);
    }
}
