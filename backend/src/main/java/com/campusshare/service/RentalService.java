package com.campusshare.service;

import com.campusshare.dto.*;
import com.campusshare.exception.BadRequestException;
import com.campusshare.exception.ConflictException;
import com.campusshare.exception.ForbiddenException;
import com.campusshare.exception.ResourceNotFoundException;
import com.campusshare.model.*;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.PaymentRepository;
import com.campusshare.repository.RentalRepository;
import com.campusshare.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class RentalService {

    private final RentalRepository rentalRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ActivityLogService activityLogService;

    public RentalService(RentalRepository rentalRepository,
                         ItemRepository itemRepository,
                         UserRepository userRepository,
                         PaymentRepository paymentRepository,
                         ActivityLogService activityLogService) {
        this.rentalRepository = rentalRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public RentalResponse createRental(RentalCreateRequest request, String borrowerEmail) {
        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + borrowerEmail));

        Item item = itemRepository.findByIdAndIsDeletedFalse(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + request.getItemId()));

        // Business Rule: Student cannot rent their own item
        if (item.getOwner().getId().equals(borrower.getId())) {
            throw new BadRequestException("You cannot rent your own item");
        }

        // Business Rule: Item must be available
        if (!item.isAvailable()) {
            throw new BadRequestException("Item is not currently available for rental");
        }

        // Date Validations
        LocalDate today = LocalDate.now();
        if (request.getStartDate().isBefore(today)) {
            throw new BadRequestException("Start date cannot be in the past");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }

        // Minimum 1 day calculation (inclusive rental days)
        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
        if (days < 1) {
            throw new BadRequestException("Minimum rental duration is 1 day");
        }

        // Business Rule: Overlap check against existing APPROVED rentals
        List<Rental> overlapping = rentalRepository.findOverlappingApprovedRentals(
                item.getId(),
                request.getStartDate(),
                request.getEndDate(),
                null
        );
        if (!overlapping.isEmpty()) {
            throw new ConflictException("Item is already booked and approved for the selected dates (" +
                    overlapping.get(0).getStartDate() + " to " + overlapping.get(0).getEndDate() + ")");
        }

        // Server-side BigDecimal calculation: Never trust client amount!
        BigDecimal totalAmount = item.getDailyPrice().multiply(BigDecimal.valueOf(days));

        Rental rental = new Rental(
                item,
                borrower,
                request.getStartDate(),
                request.getEndDate(),
                (int) days,
                totalAmount
        );

        Rental savedRental = rentalRepository.save(rental);
        activityLogService.logActivity(borrowerEmail, "RENTAL_REQUESTED",
                "Rental request #" + savedRental.getId() + " created for item: " + item.getTitle() + " (" + days + " days, ₹" + totalAmount + ")");

        return toResponse(savedRental);
    }

    @Transactional
    public RentalResponse approveRental(Long rentalId, String ownerEmail) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental not found with id: " + rentalId));

        User user = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + ownerEmail));

        // Ownership check
        if (!rental.getItem().getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only the item owner can approve this rental request");
        }

        // Status transition check: PENDING -> APPROVED only
        if (rental.getStatus() != RentalStatus.PENDING) {
            throw new BadRequestException("Illegal transition: Cannot approve a rental with status " + rental.getStatus());
        }

        // Overlap verification before approval
        List<Rental> overlapping = rentalRepository.findOverlappingApprovedRentals(
                rental.getItem().getId(),
                rental.getStartDate(),
                rental.getEndDate(),
                rental.getId()
        );
        if (!overlapping.isEmpty()) {
            throw new ConflictException("Cannot approve: Overlapping approved rental exists for item between " +
                    rental.getStartDate() + " and " + rental.getEndDate());
        }

        rental.setStatus(RentalStatus.APPROVED);

        // Ensure Payment record is initialized with PENDING status
        Payment payment = rental.getPayment();
        if (payment == null) {
            payment = new Payment(rental, rental.getTotalAmount());
            paymentRepository.save(payment);
            rental.setPayment(payment);
        }

        Rental updated = rentalRepository.save(rental);
        activityLogService.logActivity(ownerEmail, "RENTAL_APPROVED",
                "Rental #" + rentalId + " approved for borrower " + rental.getBorrower().getEmail());

        return toResponse(updated);
    }

    @Transactional
    public RentalResponse rejectRental(Long rentalId, String reason, String ownerEmail) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental not found with id: " + rentalId));

        User user = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + ownerEmail));

        if (!rental.getItem().getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only the item owner can reject this rental request");
        }

        // Status transition check: PENDING -> REJECTED only
        if (rental.getStatus() != RentalStatus.PENDING) {
            throw new BadRequestException("Illegal transition: Cannot reject a rental with status " + rental.getStatus());
        }

        rental.setStatus(RentalStatus.REJECTED);
        rental.setRejectionReason(reason != null && !reason.isBlank() ? reason.trim() : "Rejected by owner");

        Rental updated = rentalRepository.save(rental);
        activityLogService.logActivity(ownerEmail, "RENTAL_REJECTED",
                "Rental #" + rentalId + " rejected. Reason: " + rental.getRejectionReason());

        return toResponse(updated);
    }

    @Transactional
    public RentalResponse markReturned(Long rentalId, String ownerEmail) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental not found with id: " + rentalId));

        User user = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + ownerEmail));

        if (!rental.getItem().getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only the item owner can mark this rental as returned");
        }

        // Status transition check: APPROVED -> RETURNED only
        if (rental.getStatus() != RentalStatus.APPROVED) {
            throw new BadRequestException("Illegal transition: Cannot mark rental as returned when status is " + rental.getStatus());
        }

        rental.setStatus(RentalStatus.RETURNED);

        Rental updated = rentalRepository.save(rental);
        activityLogService.logActivity(ownerEmail, "RENTAL_RETURNED",
                "Rental #" + rentalId + " marked as RETURNED by owner");

        return toResponse(updated);
    }

    @Transactional
    public RentalResponse cancelRental(Long rentalId, String borrowerEmail) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental not found with id: " + rentalId));

        User user = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + borrowerEmail));

        // Borrower authorization check
        if (!rental.getBorrower().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only the borrower can cancel this rental request");
        }

        // Status transition check: PENDING -> CANCELLED only
        if (rental.getStatus() != RentalStatus.PENDING) {
            throw new BadRequestException("Illegal transition: Cannot cancel rental with status " + rental.getStatus() + ". Only PENDING requests can be cancelled.");
        }

        rental.setStatus(RentalStatus.CANCELLED);

        Rental updated = rentalRepository.save(rental);
        activityLogService.logActivity(borrowerEmail, "RENTAL_CANCELLED",
                "Rental request #" + rentalId + " cancelled by borrower");

        return toResponse(updated);
    }

    @Transactional(readOnly = true)
    public PagedResponse<RentalResponse> getMyRentals(String borrowerEmail, Pageable pageable) {
        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + borrowerEmail));

        Page<Rental> page = rentalRepository.findByBorrowerIdOrderByCreatedAtDesc(borrower.getId(), pageable);
        List<RentalResponse> content = page.getContent().stream()
                .map(this::toResponse)
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
    public PagedResponse<RentalResponse> getIncomingRentals(String ownerEmail, Pageable pageable) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + ownerEmail));

        Page<Rental> page = rentalRepository.findByItemOwnerIdOrderByCreatedAtDesc(owner.getId(), pageable);
        List<RentalResponse> content = page.getContent().stream()
                .map(this::toResponse)
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
    public RentalResponse getRentalById(Long id, String userEmail) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rental not found with id: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        // Only borrower, owner, or admin can view rental details
        boolean isBorrower = rental.getBorrower().getId().equals(user.getId());
        boolean isOwner = rental.getItem().getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isBorrower && !isOwner && !isAdmin) {
            throw new ForbiddenException("You are not authorized to view this rental");
        }

        return toResponse(rental);
    }

    public RentalResponse toResponse(Rental rental) {
        RentalResponse response = new RentalResponse();
        response.setId(rental.getId());
        response.setStartDate(rental.getStartDate());
        response.setEndDate(rental.getEndDate());
        response.setTotalDays(rental.getTotalDays());
        response.setTotalAmount(rental.getTotalAmount());
        response.setStatus(rental.getStatus());
        response.setRejectionReason(rental.getRejectionReason());
        response.setCreatedAt(rental.getCreatedAt());
        response.setUpdatedAt(rental.getUpdatedAt());

        Item item = rental.getItem();
        ItemSummaryDto itemDto = new ItemSummaryDto(
                item.getId(),
                item.getTitle(),
                item.getDailyPrice(),
                item.getImageUrl(),
                new UserSummaryDto(
                        item.getOwner().getId(),
                        item.getOwner().getName(),
                        item.getOwner().getEmail(),
                        item.getOwner().getCollegeId()
                ),
                item.getCategory().getName()
        );
        response.setItem(itemDto);

        User borrower = rental.getBorrower();
        response.setBorrower(new UserSummaryDto(
                borrower.getId(),
                borrower.getName(),
                borrower.getEmail(),
                borrower.getCollegeId()
        ));

        Payment payment = rental.getPayment();
        if (payment != null) {
            response.setPayment(new PaymentDto(
                    payment.getId(),
                    rental.getId(),
                    payment.getAmount(),
                    payment.getStatus(),
                    payment.getTransactionReference(),
                    payment.getPaidAt(),
                    payment.getCreatedAt()
            ));
        }

        Review review = rental.getReview();
        if (review != null) {
            response.setReview(new ReviewSummaryDto(
                    review.getId(),
                    review.getRating(),
                    review.getComment(),
                    review.getCreatedAt()
            ));
        }

        return response;
    }
}
