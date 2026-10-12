package com.campusshare.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

public class ReviewSummaryDto implements Serializable {
    private Long id;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;

    public ReviewSummaryDto() {
    }

    public ReviewSummaryDto(Long id, int rating, String comment, LocalDateTime createdAt) {
        this.id = id;
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
