package com.example.app.user.domain;
import jakarta.persistence.*; import java.util.UUID;
@Entity @Table(name="app_user")
public class User {
  @Id @Column(columnDefinition="uuid") private UUID id = UUID.randomUUID();
  @Column(unique=true, nullable=false) private String email;
  @Column(nullable=false) private String passwordHash;
  private String displayName;
  public UUID getId(){return id;} public void setId(UUID id){this.id=id;}
  public String getEmail(){return email;} public void setEmail(String v){this.email=v;}
  public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){this.passwordHash=v;}
  public String getDisplayName(){return displayName;} public void setDisplayName(String v){this.displayName=v;}
}
