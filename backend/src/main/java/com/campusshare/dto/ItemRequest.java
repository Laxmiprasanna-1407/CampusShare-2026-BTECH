package com.campusshare.dto;

import com.campusshare.model.ItemCondition;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Set;

public class ItemRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Daily price is required")
    @DecimalMin(value = "1.00", message = "Daily price must be at least ₹1.00")
    private BigDecimal dailyPrice;

    @DecimalMin(value = "0.00", message = "Deposit cannot be negative")
    private BigDecimal deposit;

    @NotNull(message = "Item condition is required")
    private ItemCondition condition;

    @NotNull(message = "Category is required")
    private Long categoryId;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    private Set<String> tags;

    public ItemRequest() {
    }

    public ItemRequest(String title, String description, BigDecimal dailyPrice, BigDecimal deposit,
                       ItemCondition condition, Long categoryId, String imageUrl, Set<String> tags) {
        this.title = title;
        this.description = description;
        this.dailyPrice = dailyPrice;
        this.deposit = deposit;
        this.condition = condition;
        this.categoryId = categoryId;
        this.imageUrl = imageUrl;
        this.tags = tags;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getDailyPrice() {
        return dailyPrice;
    }

    public void setDailyPrice(BigDecimal dailyPrice) {
        this.dailyPrice = dailyPrice;
    }

    public BigDecimal getDeposit() {
        return deposit;
    }

    public void setDeposit(BigDecimal deposit) {
        this.deposit = deposit;
    }

    public ItemCondition getCondition() {
        return condition;
    }

    public void setCondition(ItemCondition condition) {
        this.condition = condition;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }
}
