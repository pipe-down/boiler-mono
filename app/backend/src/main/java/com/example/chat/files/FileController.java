package com.example.chat.files;
import com.example.chat.user.*; import org.springframework.security.core.Authentication; import org.springframework.web.bind.annotation.*; import java.util.Map; import java.util.UUID;
@RestController @RequestMapping("/files")
public class FileController {
  private final S3Service s3; private final AttachmentRepo repo; private final UserRepo users;
  public FileController(S3Service s3, AttachmentRepo r, UserRepo u){ this.s3=s3; this.repo=r; this.users=u; }
  record PresignReq(String contentType, String roomCode, Long bytes) {}
  @PostMapping("/presign")
  public Map<String,Object> presign(@RequestBody PresignReq req, Authentication auth){
    String key = "rooms/"+req.roomCode()+"/"+UUID.randomUUID();
    return s3.presignPut(key, req.contentType());
  }
  record AttachReq(String roomCode, String key, String contentType, Long bytes) {}
  @PostMapping("/attach")
  public Map<String,Object> attach(@RequestBody AttachReq req, Authentication auth){
    Long uid=Long.parseLong(auth.getName()); var u=users.findById(uid).orElseThrow();
    var e=new AttachmentEntity(); e.setRoomCode(req.roomCode()); e.setUploader(u); e.setS3Key(req.key()); e.setContentType(req.contentType()); e.setBytes(req.bytes()); repo.save(e);
    return Map.of("id", e.getId(), "download", s3.presignGet(e.getS3Key()));
  }
}
