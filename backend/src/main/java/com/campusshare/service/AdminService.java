package com.campusshare.service;

import com.campusshare.dto.*;
import com.campusshare.exception.BadRequestException;
import com.campusshare.exception.ResourceNotFoundException;
import com.campusshare.model.*;
import com.campusshare.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final RentalRepository rentalRepository;
    private final PaymentRepository paymentRepository;
    private final RentalService rentalService;
    private final UserService userService;
    private final ActivityLogService activityLogService;

    public AdminService(UserRepository userRepository,
                        ItemRepository itemRepository,
                        RentalRepository rentalRepository,
                        PaymentRepository paymentRepository,
                        RentalService rentalService,
                        UserService userService,
                        ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.rentalRepository = rentalRepository;
        this.paymentRepository = paymentRepository;
        this.rentalService = rentalService;
        this.userService = userService;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        AdminStatsResponse stats = new AdminStatsResponse();
        stats.setTotalUsers(userRepository.count());
        stats.setTotalStudents(userRepository.countByRole(Role.STUDENT));
        stats.setTotalItems(itemRepository.countByIsDeletedFalse());
        stats.setActiveItems(itemRepository.countByIsDeletedFalseAndAvailableTrue());
        stats.setTotalRentals(rentalRepository.count());
        stats.setPendingRentals(rentalRepository.countByStatus(RentalStatus.PENDING));
        stats.setApprovedRentals(rentalRepository.countByStatus(RentalStatus.APPROVED));
        stats.setReturnedRentals(rentalRepository.countByStatus(RentalStatus.RETURNED));
        stats.setCancelledRentals(rentalRepository.countByStatus(RentalStatus.CANCELLED));

        BigDecimal totalRev = paymentRepository.sumPaidAmount();
        stats.setTotalRevenue(totalRev != null ? totalRev : BigDecimal.ZERO);

        stats.setPendingPaymentsCount(paymentRepository.countByStatus(PaymentStatus.PENDING));
        stats.setPaidPaymentsCount(paymentRepository.countByStatus(PaymentStatus.PAID));

        return stats;
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> getAllUsers(Pageable pageable) {
        Page<User> page = userRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<UserDto> content = page.getContent().stream()
                .map(userService::toDto)
                .toList();

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Transactional
    public UserDto updateUserStatus(Long userId, boolean enabled, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new BadRequestException("Administrators cannot disable their own account");
        }

        user.setEnabled(enabled);
        User updated = userRepository.save(user);

        activityLogService.logActivity(adminEmail, "USER_STATUS_CHANGE",
                "User #" + userId + " (" + user.getEmail() + ") enabled state changed to: " + enabled);

        return userService.toDto(updated);
    }

    @Transactional(readOnly = true)
    public PagedResponse<RentalResponse> getAllRentals(Pageable pageable) {
        Page<Rental> page = rentalRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<RentalResponse> content = page.getContent().stream()
                .map(rentalService::toResponse)
                .toList();

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Transactional(readOnly = true)
    public PagedResponse<PaymentDto> getAllPayments(Pageable pageable) {
        Page<Payment> page = paymentRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<PaymentDto> content = page.getContent().stream()
                .map(p -> new PaymentDto(
                        p.getId(),
                        p.getRental().getId(),
                        p.getAmount(),
                        p.getStatus(),
                        p.getTransactionReference(),
                        p.getPaidAt(),
                        p.getCreatedAt()
                ))
                .toList();

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
