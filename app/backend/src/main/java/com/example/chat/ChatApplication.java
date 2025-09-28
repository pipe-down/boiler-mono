package com.example.chat;
import org.springframework.boot.*; import org.springframework.boot.autoconfigure.*; import org.springframework.scheduling.annotation.*;
@SpringBootApplication @EnableScheduling
public class ChatApplication{ public static void main(String[]a){ SpringApplication.run(ChatApplication.class,a);} }