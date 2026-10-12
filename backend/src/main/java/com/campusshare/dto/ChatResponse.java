package com.campusshare.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class ChatResponse implements Serializable {
    private String answer;
    private String fallbackNotice;
    private boolean configured;
    private List<ItemSummaryDto> retrievedItems = new ArrayList<>();

    public ChatResponse() {
    }

    public ChatResponse(String answer, String fallbackNotice, boolean configured, List<ItemSummaryDto> retrievedItems) {
        this.answer = answer;
        this.fallbackNotice = fallbackNotice;
        this.configured = configured;
        this.retrievedItems = retrievedItems != null ? retrievedItems : new ArrayList<>();
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getFallbackNotice() {
        return fallbackNotice;
    }

    public void setFallbackNotice(String fallbackNotice) {
        this.fallbackNotice = fallbackNotice;
    }

    public boolean isConfigured() {
        return configured;
    }

    public void setConfigured(boolean configured) {
        this.configured = configured;
    }

    public List<ItemSummaryDto> getRetrievedItems() {
        return retrievedItems;
    }

    public void setRetrievedItems(List<ItemSummaryDto> retrievedItems) {
        this.retrievedItems = retrievedItems;
    }
}
