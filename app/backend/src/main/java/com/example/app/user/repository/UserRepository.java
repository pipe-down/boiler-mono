package com.example.app.user.repository;
import com.example.app.user.domain.User; import org.springframework.data.jpa.repository.JpaRepository; import java.util.Optional; import java.util.UUID;
public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmail(String email);
}
