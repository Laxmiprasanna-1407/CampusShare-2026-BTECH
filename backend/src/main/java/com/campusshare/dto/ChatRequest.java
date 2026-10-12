package com.campusshare.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class ChatRequest {

    @NotBlank(message = "Message cannot be empty")
    private String message;

    private List<ChatMessageDto> history = new ArrayList<>();

    public ChatRequest() {
    }

    public ChatRequest(String message, List<ChatMessageDto> history) {
        this.message = message;
        this.history = history != null ? history : new ArrayList<>();
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<ChatMessageDto> getHistory() {
        return history;
    }

    public void setHistory(List<ChatMessageDto> history) {
        this.history = history;
    }
}
