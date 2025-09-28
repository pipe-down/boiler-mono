package com.example.app.message.service;

import com.example.app.common.data.Pageing;
import com.example.app.common.data.Specs;
import com.example.app.message.domain.Message;
import com.example.app.message.repository.MessageRepository;
import com.example.app.message.web.dto.MessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class MessageService {

    private final MessageRepository messageRepository;
    private final RedisBroadcast redisBroadcast;

    public MessageService(MessageRepository messageRepository, RedisBroadcast redisBroadcast) {
        this.messageRepository = messageRepository;
        this.redisBroadcast = redisBroadcast;
    }

    public List<Message> list() {
        return messageRepository.findAll(defaultSort());
    }

    public Page<Message> page(Integer page, Integer size, String sort) {
        Pageable pageable = Pageing.of(page, size, sort);
        return messageRepository.findAll(pageable);
    }

    public Page<Message> search(String q, Integer page, Integer size, String sort) {
        Specification<Message> spec = Specification.where(Specs.textLike(q, "text", "roomId"));
        Pageable pageable = Pageing.of(page, size, sort);
        return messageRepository.findAll(spec, pageable);
    }

    public Message get(UUID id) {
        return messageRepository.findById(id).orElseThrow();
    }

    @Transactional
    public Message create(MessageCreateCommand command) {
        Message message = new Message();
        message.setRoomId(defaultRoom(command.roomId()));
        message.setSenderId(command.senderId());
        message.setText(command.text());
        message.setCreatedAt(Instant.now());

        Message savedMessage = messageRepository.save(message);

        // After saving, publish to Redis
        MessageResponse dto = new MessageResponse(
                savedMessage.getId(),
                savedMessage.getRoomId(),
                savedMessage.getSenderId(),
                savedMessage.getText(),
                savedMessage.getCreatedAt()
        );
        redisBroadcast.publish(dto);

        return savedMessage;
    }

    @Transactional
    public void delete(UUID id) {
        messageRepository.deleteById(id);
    }

    private Sort defaultSort() {
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    private String defaultRoom(String roomId) {
        return (roomId == null || roomId.isBlank()) ? "general" : roomId;
    }
}
