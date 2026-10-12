package com.campusshare.service;

import com.campusshare.dto.ReviewCreateRequest;
import com.campusshare.dto.ReviewResponse;
import com.campusshare.dto.UserSummaryDto;
import com.campusshare.exception.BadRequestException;
import com.campusshare.exception.ConflictException;
import com.campusshare.exception.ForbiddenException;
import com.campusshare.exception.ResourceNotFoundException;
import com.campusshare.model.Rental;
import com.campusshare.model.RentalStatus;
import com.campusshare.model.Review;
import com.campusshare.model.User;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.RentalRepository;
import com.campusshare.repository.ReviewRepository;
import com.campusshare.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RentalRepository rentalRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    public ReviewService(ReviewRepository reviewRepository,
                         RentalRepository rentalRepository,
                         ItemRepository itemRepository,
                         UserRepository userRepository,
                         ActivityLogService activityLogService) {
        this.reviewRepository = reviewRepository;
        this.rentalRepository = rentalRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.activityLogService = activityLogService;
    }

    @CacheEvict(value = {"items-list", "item-details"}, allEntries = true)
    @Transactional
    public ReviewResponse createReview(Long rentalId, ReviewCreateRequest request, String reviewerEmail) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental not found with id: " + rentalId));

        User user = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + reviewerEmail));

        // Rule: Only the borrower can submit a review
        if (!rental.getBorrower().getId().equals(user.getId())) {
            throw new ForbiddenException("Only the borrower can submit a review for this rental");
        }

        // Rule: Only after the rental is RETURNED
        if (rental.getStatus() != RentalStatus.RETURNED) {
            throw new BadRequestException("Reviews can only be submitted after the rental has been marked as RETURNED (Current status: " + rental.getStatus() + ")");
        }

        // Rule: One review per rental
        if (reviewRepository.existsByRentalId(rentalId)) {
            throw new ConflictException("A review has already been submitted for this rental");
        }

        Review review = new Review(
                rental,
                rental.getItem(),
                user,
                request.getRating(),
                request.getComment()
        );

        Review savedReview = reviewRepository.save(review);
        rental.setReview(savedReview);

        activityLogService.logActivity(reviewerEmail, "REVIEW_SUBMITTED",
                "Review submitted for Item #" + rental.getItem().getId() + " (" + rental.getItem().getTitle() + "): Rating " + request.getRating() + "/5");

        return toResponse(savedReview);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getItemReviews(Long itemId) {
        itemRepository.findByIdAndIsDeletedFalse(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        return reviewRepository.findByItemIdOrderByCreatedAtDesc(itemId).stream()
                .map(this::toResponse)
                .toList();
    }

    private ReviewResponse toResponse(Review review) {
        User reviewer = review.getReviewer();
        UserSummaryDto reviewerDto = new UserSummaryDto(
                reviewer.getId(),
                reviewer.getName(),
                reviewer.getEmail(),
                reviewer.getCollegeId()
        );

        return new ReviewResponse(
                review.getId(),
                review.getRental().getId(),
                review.getItem().getId(),
                reviewerDto,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
