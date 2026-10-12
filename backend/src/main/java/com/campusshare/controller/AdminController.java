package com.campusshare.controller;

import com.campusshare.dto.*;
import com.campusshare.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Administrator-only endpoints for platform statistics, user moderation, and monitoring")
@SecurityRequirement(name = "BearerAuth")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform-wide statistics for users, items, rentals, and revenue")
    public ResponseEntity<AdminStatsResponse> getStats() {
        AdminStatsResponse stats = adminService.getStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    @Operation(summary = "Get paginated list of all registered users")
    public ResponseEntity<PagedResponse<UserDto>> getAllUsers(
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<UserDto> response = adminService.getAllUsers(pageable);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/users/{id}/disable")
    @Operation(summary = "Enable or disable a user account")
    public ResponseEntity<UserDto> updateUserStatus(
            @PathVariable Long id,
            @RequestBody(required = false) UserStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean enabled = (request != null) ? request.isEnabled() : false;
        UserDto updated = adminService.updateUserStatus(id, enabled, userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/rentals")
    @Operation(summary = "Get paginated list of all rental requests across the platform")
    public ResponseEntity<PagedResponse<RentalResponse>> getAllRentals(
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<RentalResponse> response = adminService.getAllRentals(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payments")
    @Operation(summary = "Get paginated list of all recorded payments across the platform")
    public ResponseEntity<PagedResponse<PaymentDto>> getAllPayments(
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<PaymentDto> response = adminService.getAllPayments(pageable);
        return ResponseEntity.ok(response);
    }
}
