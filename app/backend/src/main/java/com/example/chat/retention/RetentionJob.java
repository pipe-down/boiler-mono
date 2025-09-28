package com.example.chat.retention;
import com.example.chat.chat.MessageRepo; import org.springframework.beans.factory.annotation.Value; import org.springframework.scheduling.annotation.Scheduled; import org.springframework.stereotype.Component;
import java.time.Instant; import java.time.temporal.ChronoUnit;
@Component public class RetentionJob {
  private final MessageRepo repo; private final int days;
  public RetentionJob(MessageRepo r, @Value("${retention.days:90}") int days){ this.repo=r; this.days=days; }
  @Scheduled(cron = "0 0 * * * *") public void run(){ var cutoff = Instant.now().minus(days, ChronoUnit.DAYS); // naive example
    // Note: For demo purposes skip heavy delete; production would use native query by created_at < cutoff
  }
}
