package com.webSockets.webSockets.controller;

import com.webSockets.webSockets.dto.UserDTO;
import com.webSockets.webSockets.model.Message;
import com.webSockets.webSockets.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Set;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    private UserService userService;

    @MessageMapping("/message")
    @SendTo("/chatroom/public")
    public Message receivePublicMessage(@Payload Message message) {
        return message;
    }

    @MessageMapping("/private-message")
    public Message receivePrivateMessage(@Payload Message message) {
        simpMessagingTemplate.convertAndSendToUser(
                message.getReceiverName(),
                "/private",
                message
        );
        return message;
    }

    @MessageMapping("/user.connect")
    @SendTo("/topic/connectedUsers")
    public Set<UserDTO> connectUser(@Payload UserDTO user) {
        userService.addUser(user.getUsername());
        return userService.getConnectedUsers();
    }

    @MessageMapping("/user.disconnect")
    @SendTo("/topic/connectedUsers")
    public Set<UserDTO> disconnectUser(@Payload UserDTO user) {
        userService.removeUser(user.getUsername());
        return userService.getConnectedUsers();
    }
}