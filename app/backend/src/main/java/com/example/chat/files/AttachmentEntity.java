package com.example.chat.files;
import com.example.chat.user.UserEntity; import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="attachment")
public class AttachmentEntity {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
  @Column(nullable=false,length=120) String roomCode;
  @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="uploader_id",nullable=false) UserEntity uploader;
  @Column(nullable=false,length=255) String s3Key;
  @Column(nullable=false,length=120) String contentType;
  @Column(nullable=false) long bytes;
  @Column(nullable=false) Instant createdAt = Instant.now();
  public Long getId(){return id;} public String getRoomCode(){return roomCode;} public void setRoomCode(String r){roomCode=r;}
  public UserEntity getUploader(){return uploader;} public void setUploader(UserEntity u){uploader=u;}
  public String getS3Key(){return s3Key;} public void setS3Key(String k){s3Key=k;}
  public String getContentType(){return contentType;} public void setContentType(String c){contentType=c;}
  public long getBytes(){return bytes;} public void setBytes(long b){bytes=b;}
  public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant i){createdAt=i;}
}
