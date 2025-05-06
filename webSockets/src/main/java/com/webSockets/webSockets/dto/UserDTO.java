package com.webSockets.webSockets.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String username;

    public UserDTO(String username) {
        this.username = username;
    }
}