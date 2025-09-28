package com.example.app.files;

import com.example.app.user.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final S3Service s3;
    private final AttachmentRepo repo;

    public FileController(S3Service s3, AttachmentRepo r) {
        this.s3 = s3;
        this.repo = r;
    }

    record PresignReq(String contentType, String roomCode, Long bytes) {}

    @PostMapping("/presign")
    public Map<String, Object> presign(@RequestBody PresignReq req) {
        currentUser(); // Ensure user is authenticated
        String key = "rooms/" + req.roomCode() + "/" + UUID.randomUUID();
        return s3.presignPut(key, req.contentType());
    }

    record AttachReq(String roomCode, String key, String contentType, Long bytes) {}

    @PostMapping("/attach")
    public Map<String, Object> attach(@RequestBody AttachReq req) {
        AuthContext auth = currentUser();
        var e = new AttachmentEntity();
        e.setRoomCode(req.roomCode());
        e.setUploaderId(auth.senderId());
        e.setS3Key(req.key());
        e.setContentType(req.contentType());
        e.setBytes(req.bytes());
        repo.save(e);
        return Map.of("id", e.getId(), "download", s3.presignGet(e.getS3Key()));
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

    private record AuthContext(UUID userId, long senderId) {}
}
