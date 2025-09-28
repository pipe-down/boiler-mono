package com.example.app.retention;

import com.example.app.message.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class RetentionJob {
    private final MessageRepository repo;
    private final int days;

    public RetentionJob(MessageRepository r, @Value("${retention.days:90}") int days) {
        this.repo = r;
        this.days = days;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void run() {
        var cutoff = Instant.now().minus(days, ChronoUnit.DAYS); // naive example
        // Note: For demo purposes skip heavy delete; production would use native query by created_at < cutoff
    }
}
