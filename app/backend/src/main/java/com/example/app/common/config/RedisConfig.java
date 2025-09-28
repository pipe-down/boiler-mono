package com.example.app.common.config;

import com.example.app.message.service.RedisBroadcast;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisConfig {

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // Use PatternTopic for wildcard channel matching
        container.addMessageListener(listenerAdapter, new PatternTopic("chat:*"));
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(RedisBroadcast receiver) {
        // The onMessage method will be invoked because RedisBroadcast implements MessageListener
        return new MessageListenerAdapter(receiver, "onMessage");
    }
}
