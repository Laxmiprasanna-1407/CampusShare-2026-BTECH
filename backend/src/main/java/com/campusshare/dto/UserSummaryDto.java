package com.campusshare.dto;

import java.io.Serializable;

public class UserSummaryDto implements Serializable {
    private Long id;
    private String name;
    private String email;
    private String collegeId;

    public UserSummaryDto() {
    }

    public UserSummaryDto(Long id, String name, String email, String collegeId) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.collegeId = collegeId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCollegeId() {
        return collegeId;
    }

    public void setCollegeId(String collegeId) {
        this.collegeId = collegeId;
    }
}
