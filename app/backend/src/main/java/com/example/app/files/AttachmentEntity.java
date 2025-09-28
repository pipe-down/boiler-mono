package com.example.app.files;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "attachment")
public class AttachmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String roomCode;

    @Column(name = "uploader_id", nullable = false)
    private Long uploaderId;

    @Column(nullable = false, length = 255)
    private String s3Key;

    @Column(nullable = false, length = 120)
    private String contentType;

    @Column(nullable = false)
    private long bytes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String r) {
        roomCode = r;
    }

    public Long getUploaderId() {
        return uploaderId;
    }

    public void setUploaderId(Long id) {
        this.uploaderId = id;
    }

    public String getS3Key() {
        return s3Key;
    }

    public void setS3Key(String k) {
        s3Key = k;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String c) {
        contentType = c;
    }

    public long getBytes() {
        return bytes;
    }

    public void setBytes(long b) {
        bytes = b;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant i) {
        createdAt = i;
    }
}
