package com.example.app.message.repository;

import com.example.app.message.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID>, JpaSpecificationExecutor<Message> {
}
