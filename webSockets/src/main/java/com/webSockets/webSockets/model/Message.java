package com.webSockets.webSockets.model;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class Message {
     private String senderName;
     private String receiverName;
     private String message;
     private String date;
     private Status status;
}
