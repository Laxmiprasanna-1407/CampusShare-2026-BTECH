package com.campusshare.controller;

import com.campusshare.dto.ReviewResponse;
import com.campusshare.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@Tag(name = "Reviews", description = "Endpoints for reading item reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/{id}/reviews")
    @Operation(summary = "Get all reviews for an item")
    public ResponseEntity<List<ReviewResponse>> getItemReviews(@PathVariable Long id) {
        List<ReviewResponse> reviews = reviewService.getItemReviews(id);
        return ResponseEntity.ok(reviews);
    }
}
