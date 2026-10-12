package com.campusshare.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class RentalCreateRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    public RentalCreateRequest() {
    }

    public RentalCreateRequest(Long itemId, LocalDate startDate, LocalDate endDate) {
        this.itemId = itemId;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}
