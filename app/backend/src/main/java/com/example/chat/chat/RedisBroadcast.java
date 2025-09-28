package com.example.chat.chat;
import org.springframework.data.redis.connection.Message; import org.springframework.data.redis.connection.MessageListener; import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component; import jakarta.annotation.PostConstruct; import com.fasterxml.jackson.databind.ObjectMapper;
@Component
public class RedisBroadcast implements MessageListener {
  private final StringRedisTemplate redis; private final MessageBroadcaster local; private final ObjectMapper om=new ObjectMapper();
  public RedisBroadcast(StringRedisTemplate r, MessageBroadcaster b){ this.redis=r; this.local=b; }
  @PostConstruct public void init(){ redis.getConnectionFactory().getConnection().subscribe(this.getClass().getName().getBytes(), "chat:*".getBytes()); }
  public void publish(TimelineStore.MessageDTO dto){ try{ String ch="chat:"+dto.roomId(); String json=om.writeValueAsString(dto); redis.convertAndSend(ch, json);}catch(Exception ignore){} }
  @Override public void onMessage(Message message, byte[] pattern){ try{ String json=new String(message.getBody()); var n=om.readTree(json);
    var dto=new TimelineStore.MessageDTO(n.get("serverSeq").asLong(), n.get("roomId").asText(), n.get("senderId").asText(), n.get("text").asText(), n.get("ts").asLong());
    local.emit(dto.roomId(), dto);
  }catch(Exception ignore){} }
}
