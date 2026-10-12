package com.campusshare.controller;

import com.campusshare.dto.*;
import com.campusshare.service.PaymentService;
import com.campusshare.service.RentalService;
import com.campusshare.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rentals")
@Tag(name = "Rentals", description = "Endpoints for managing rentals, approvals, payments, and reviews")
public class RentalController {

    private final RentalService rentalService;
    private final PaymentService paymentService;
    private final ReviewService reviewService;

    public RentalController(RentalService rentalService,
                            PaymentService paymentService,
                            ReviewService reviewService) {
        this.rentalService = rentalService;
        this.paymentService = paymentService;
        this.reviewService = reviewService;
    }

    @PostMapping
    @Operation(summary = "Submit a rental booking request (borrower)")
    public ResponseEntity<RentalResponse> createRental(
            @Valid @RequestBody RentalCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        RentalResponse response = rentalService.createRental(request, userDetails.getUsername());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/mine")
    @Operation(summary = "Get current user's outgoing rental requests (as borrower)")
    public ResponseEntity<PagedResponse<RentalResponse>> getMyRentals(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<RentalResponse> response = rentalService.getMyRentals(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/incoming")
    @Operation(summary = "Get incoming rental requests for items owned by current user (as owner)")
    public ResponseEntity<PagedResponse<RentalResponse>> getIncomingRentals(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<RentalResponse> response = rentalService.getIncomingRentals(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single rental request details")
    public ResponseEntity<RentalResponse> getRentalById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        RentalResponse response = rentalService.getRentalById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve a pending rental request (owner only)")
    public ResponseEntity<RentalResponse> approveRental(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        RentalResponse response = rentalService.approveRental(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Reject a pending rental request (owner only)")
    public ResponseEntity<RentalResponse> rejectRental(
            @PathVariable Long id,
            @RequestBody(required = false) RentalRejectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String reason = (request != null) ? request.getReason() : null;
        RentalResponse response = rentalService.rejectRental(id, reason, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/return")
    @Operation(summary = "Mark an approved rental as RETURNED (owner only)")
    public ResponseEntity<RentalResponse> markReturned(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        RentalResponse response = rentalService.markReturned(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel a pending rental request (borrower only)")
    public ResponseEntity<RentalResponse> cancelRental(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        RentalResponse response = rentalService.cancelRental(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/payment/paid")
    @Operation(summary = "Mark simulated peer rental payment as PAID (owner or admin)")
    public ResponseEntity<RentalResponse> markPaymentPaid(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        RentalResponse response = paymentService.markPaymentPaid(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/review")
    @Operation(summary = "Submit review and rating for a RETURNED rental (borrower only)")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ReviewResponse response = reviewService.createReview(id, request, userDetails.getUsername());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
