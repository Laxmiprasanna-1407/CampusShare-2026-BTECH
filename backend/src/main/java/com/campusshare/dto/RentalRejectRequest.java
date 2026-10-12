package com.campusshare.dto;

public class RentalRejectRequest {
    private String reason;

    public RentalRejectRequest() {
    }

    public RentalRejectRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
