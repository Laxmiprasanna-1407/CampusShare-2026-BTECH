package com.campusshare.dto;

import com.campusshare.model.RentalStatus;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class RentalResponse implements Serializable {
    private Long id;
    private ItemSummaryDto item;
    private UserSummaryDto borrower;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalDays;
    private BigDecimal totalAmount;
    private RentalStatus status;
    private String rejectionReason;
    private PaymentDto payment;
    private ReviewSummaryDto review;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public RentalResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ItemSummaryDto getItem() {
        return item;
    }

    public void setItem(ItemSummaryDto item) {
        this.item = item;
    }

    public UserSummaryDto getBorrower() {
        return borrower;
    }

    public void setBorrower(UserSummaryDto borrower) {
        this.borrower = borrower;
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

    public int getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(int totalDays) {
        this.totalDays = totalDays;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public RentalStatus getStatus() {
        return status;
    }

    public void setStatus(RentalStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public PaymentDto getPayment() {
        return payment;
    }

    public void setPayment(PaymentDto payment) {
        this.payment = payment;
    }

    public ReviewSummaryDto getReview() {
        return review;
    }

    public void setReview(ReviewSummaryDto review) {
        this.review = review;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
