package com.webSockets.webSockets.service;

import com.webSockets.webSockets.dto.UserDTO;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {
    private Set<String> connectedUsers = new HashSet<>();

    public void addUser(String username) {
        connectedUsers.add(username);
    }

    public void removeUser(String username) {
        connectedUsers.remove(username);
    }

    public Set<String> getConnectedUsernames() {
        return new HashSet<>(connectedUsers);
    }

    public Set<UserDTO> getConnectedUsers() {
        return connectedUsers.stream()
                .map(username -> new UserDTO(username))
                .collect(Collectors.toSet());
    }
}