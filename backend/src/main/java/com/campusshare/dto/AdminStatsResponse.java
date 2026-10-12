package com.campusshare.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public class AdminStatsResponse implements Serializable {
    private long totalUsers;
    private long totalStudents;
    private long totalItems;
    private long activeItems;
    private long totalRentals;
    private long pendingRentals;
    private long approvedRentals;
    private long returnedRentals;
    private long cancelledRentals;
    private BigDecimal totalRevenue;
    private long pendingPaymentsCount;
    private long paidPaymentsCount;

    public AdminStatsResponse() {
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public long getActiveItems() {
        return activeItems;
    }

    public void setActiveItems(long activeItems) {
        this.activeItems = activeItems;
    }

    public long getTotalRentals() {
        return totalRentals;
    }

    public void setTotalRentals(long totalRentals) {
        this.totalRentals = totalRentals;
    }

    public long getPendingRentals() {
        return pendingRentals;
    }

    public void setPendingRentals(long pendingRentals) {
        this.pendingRentals = pendingRentals;
    }

    public long getApprovedRentals() {
        return approvedRentals;
    }

    public void setApprovedRentals(long approvedRentals) {
        this.approvedRentals = approvedRentals;
    }

    public long getReturnedRentals() {
        return returnedRentals;
    }

    public void setReturnedRentals(long returnedRentals) {
        this.returnedRentals = returnedRentals;
    }

    public long getCancelledRentals() {
        return cancelledRentals;
    }

    public void setCancelledRentals(long cancelledRentals) {
        this.cancelledRentals = cancelledRentals;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getPendingPaymentsCount() {
        return pendingPaymentsCount;
    }

    public void setPendingPaymentsCount(long pendingPaymentsCount) {
        this.pendingPaymentsCount = pendingPaymentsCount;
    }

    public long getPaidPaymentsCount() {
        return paidPaymentsCount;
    }

    public void setPaidPaymentsCount(long paidPaymentsCount) {
        this.paidPaymentsCount = paidPaymentsCount;
    }
}
