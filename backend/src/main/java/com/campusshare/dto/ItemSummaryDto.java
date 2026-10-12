package com.campusshare.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public class ItemSummaryDto implements Serializable {
    private Long id;
    private String title;
    private BigDecimal dailyPrice;
    private String imageUrl;
    private UserSummaryDto owner;
    private String categoryName;

    public ItemSummaryDto() {
    }

    public ItemSummaryDto(Long id, String title, BigDecimal dailyPrice, String imageUrl, UserSummaryDto owner, String categoryName) {
        this.id = id;
        this.title = title;
        this.dailyPrice = dailyPrice;
        this.imageUrl = imageUrl;
        this.owner = owner;
        this.categoryName = categoryName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BigDecimal getDailyPrice() {
        return dailyPrice;
    }

    public void setDailyPrice(BigDecimal dailyPrice) {
        this.dailyPrice = dailyPrice;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public UserSummaryDto getOwner() {
        return owner;
    }

    public void setOwner(UserSummaryDto owner) {
        this.owner = owner;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }
}
