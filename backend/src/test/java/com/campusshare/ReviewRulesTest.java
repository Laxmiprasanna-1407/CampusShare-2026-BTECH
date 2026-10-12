package com.campusshare;

import com.campusshare.dto.ReviewCreateRequest;
import com.campusshare.exception.BadRequestException;
import com.campusshare.exception.ConflictException;
import com.campusshare.exception.ForbiddenException;
import com.campusshare.model.*;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.RentalRepository;
import com.campusshare.repository.ReviewRepository;
import com.campusshare.repository.UserRepository;
import com.campusshare.service.ActivityLogService;
import com.campusshare.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewRulesTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private RentalRepository rentalRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private ReviewService reviewService;

    private User owner;
    private User borrower;
    private User stranger;
    private Item item;
    private Rental rental;

    @BeforeEach
    void setUp() {
        owner = new User("Item Owner", "owner@campusshare.edu", "pass", Role.STUDENT, "111", "ID-1");
        owner.setId(1L);

        borrower = new User("Item Borrower", "borrower@campusshare.edu", "pass", Role.STUDENT, "222", "ID-2");
        borrower.setId(2L);

        stranger = new User("Stranger Student", "stranger@campusshare.edu", "pass", Role.STUDENT, "333", "ID-3");
        stranger.setId(3L);

        Category category = new Category("Books", "Course books", "Book");
        category.setId(2L);

        item = new Item("Data Structures and Algorithms", "Standard textbook", new BigDecimal("15.00"),
                BigDecimal.ZERO, ItemCondition.GOOD, owner, category, "dsa.jpg");
        item.setId(50L);

        rental = new Rental(item, borrower, LocalDate.now().minusDays(5), LocalDate.now().minusDays(2), 4, new BigDecimal("60.00"));
        rental.setId(1001L);
    }

    @Test
    @DisplayName("Review Rule: Non-borrower cannot submit a review")
    void testNonBorrowerCannotSubmitReview() {
        rental.setStatus(RentalStatus.RETURNED);

        when(rentalRepository.findById(1001L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(stranger.getEmail())).thenReturn(Optional.of(stranger));

        ReviewCreateRequest request = new ReviewCreateRequest(5, "Great book!");

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                reviewService.createReview(1001L, request, stranger.getEmail())
        );

        assertTrue(ex.getMessage().contains("Only the borrower can submit a review"));
    }

    @Test
    @DisplayName("Review Rule: Cannot review a rental before it is RETURNED")
    void testCannotReviewActiveOrPendingRental() {
        rental.setStatus(RentalStatus.APPROVED); // Not yet RETURNED

        when(rentalRepository.findById(1001L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));

        ReviewCreateRequest request = new ReviewCreateRequest(5, "Item was great!");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reviewService.createReview(1001L, request, borrower.getEmail())
        );

        assertTrue(ex.getMessage().contains("marked as RETURNED"));
    }

    @Test
    @DisplayName("Review Rule: Only one review allowed per rental")
    void testDuplicateReviewRejected() {
        rental.setStatus(RentalStatus.RETURNED);

        when(rentalRepository.findById(1001L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(reviewRepository.existsByRentalId(1001L)).thenReturn(true);

        ReviewCreateRequest request = new ReviewCreateRequest(4, "Second review attempt");

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reviewService.createReview(1001L, request, borrower.getEmail())
        );

        assertTrue(ex.getMessage().contains("already been submitted"));
    }

    @Test
    @DisplayName("Review Rule: Valid review successfully created when rental is RETURNED")
    void testSuccessfulReviewCreation() {
        rental.setStatus(RentalStatus.RETURNED);

        when(rentalRepository.findById(1001L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(reviewRepository.existsByRentalId(1001L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(i -> {
            Review r = i.getArgument(0);
            r.setId(901L);
            return r;
        });

        ReviewCreateRequest request = new ReviewCreateRequest(5, "Book was in mint condition. Helpful owner!");
        var response = reviewService.createReview(1001L, request, borrower.getEmail());

        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("Book was in mint condition. Helpful owner!", response.getComment());
        assertEquals(item.getId(), response.getItemId());
        verify(reviewRepository, times(1)).save(any(Review.class));
    }
}
