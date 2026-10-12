package com.campusshare.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

public class ReviewResponse implements Serializable {
    private Long id;
    private Long rentalId;
    private Long itemId;
    private UserSummaryDto reviewer;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;

    public ReviewResponse() {
    }

    public ReviewResponse(Long id, Long rentalId, Long itemId, UserSummaryDto reviewer, int rating, String comment, LocalDateTime createdAt) {
        this.id = id;
        this.rentalId = rentalId;
        this.itemId = itemId;
        this.reviewer = reviewer;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRentalId() {
        return rentalId;
    }

    public void setRentalId(Long rentalId) {
        this.rentalId = rentalId;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public UserSummaryDto getReviewer() {
        return reviewer;
    }

    public void setReviewer(UserSummaryDto reviewer) {
        this.reviewer = reviewer;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
