package com.campusshare.service;

import com.campusshare.dto.PaymentDto;
import com.campusshare.dto.RentalResponse;
import com.campusshare.exception.BadRequestException;
import com.campusshare.exception.ForbiddenException;
import com.campusshare.exception.ResourceNotFoundException;
import com.campusshare.model.*;
import com.campusshare.repository.PaymentRepository;
import com.campusshare.repository.RentalRepository;
import com.campusshare.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RentalRepository rentalRepository;
    private final UserRepository userRepository;
    private final RentalService rentalService;
    private final ActivityLogService activityLogService;

    public PaymentService(PaymentRepository paymentRepository,
                          RentalRepository rentalRepository,
                          UserRepository userRepository,
                          RentalService rentalService,
                          ActivityLogService activityLogService) {
        this.paymentRepository = paymentRepository;
        this.rentalRepository = rentalRepository;
        this.userRepository = userRepository;
        this.rentalService = rentalService;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public RentalResponse markPaymentPaid(Long rentalId, String userEmail) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental not found with id: " + rentalId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        // Rule: Only the item's owner or admin can mark payment as PAID
        boolean isOwner = rental.getItem().getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Only the item owner or administrator can mark payment as paid");
        }

        // Rule: Payment can only be marked PAID for APPROVED or RETURNED rentals
        if (rental.getStatus() != RentalStatus.APPROVED && rental.getStatus() != RentalStatus.RETURNED) {
            throw new BadRequestException("Payment can only be recorded for APPROVED or RETURNED rentals (Current status: " + rental.getStatus() + ")");
        }

        Payment payment = paymentRepository.findByRentalId(rentalId)
                .orElseGet(() -> {
                    Payment p = new Payment(rental, rental.getTotalAmount());
                    return paymentRepository.save(p);
                });

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Payment has already been marked as PAID");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionReference("SIM-UPI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        paymentRepository.save(payment);
        rental.setPayment(payment);

        activityLogService.logActivity(userEmail, "PAYMENT_PAID",
                "Simulated payment recorded as PAID for Rental #" + rentalId + " (₹" + payment.getAmount() + ", Ref: " + payment.getTransactionReference() + ")");

        return rentalService.toResponse(rental);
    }
}
