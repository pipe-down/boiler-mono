package com.example.app.message.web;

import com.example.app.common.web.PageResponse;
import com.example.app.common.web.PageResponses;
import com.example.app.message.domain.Message;
import com.example.app.message.service.MessageCreateCommand;
import com.example.app.message.service.MessageService;
import com.example.app.message.web.dto.MessageCreateRequest;
import com.example.app.message.web.dto.MessageResponse;
import com.example.app.user.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public List<MessageResponse> list() {
        return messageService.list().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public MessageResponse get(@PathVariable UUID id) {
        Message message = messageService.get(id);
        return toResponse(message);
    }

    @GetMapping("/page")
    public PageResponse<MessageResponse> page(@RequestParam(required = false) Integer page,
                                              @RequestParam(required = false) Integer size,
                                              @RequestParam(required = false) String sort) {
        Page<Message> result = messageService.page(page, size, sort);
        return PageResponses.from(result.map(this::toResponse));
    }

    @GetMapping("/search")
    public PageResponse<MessageResponse> search(@RequestParam(required = false) String q,
                                                @RequestParam(required = false) Integer page,
                                                @RequestParam(required = false) Integer size,
                                                @RequestParam(required = false) String sort) {
        Page<Message> result = messageService.search(q, page, size, sort);
        return PageResponses.from(result.map(this::toResponse));
    }

    @PostMapping
    public MessageResponse create(@Valid @RequestBody MessageCreateRequest request) {
        AuthContext authContext = currentUser();
        if (request.senderId() != null && !request.senderId().equals(authContext.senderId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "senderId does not match authenticated user");
        }
        MessageCreateCommand command = new MessageCreateCommand(request.roomId(), authContext.senderId(), request.text());
        Message message = messageService.create(command);
        return toResponse(message);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        messageService.delete(id);
    }

    private MessageResponse toResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getRoomId(),
                message.getSenderId(),
                message.getText(),
                message.getCreatedAt()
        );
    }

    private AuthContext currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthenticated");
        }
        UUID userId = UUID.fromString(authentication.getPrincipal().toString());
        long senderId = AuthService.deriveSenderId(userId);
        return new AuthContext(userId, senderId);
    }

    private record AuthContext(UUID userId, long senderId) {
    }
}
