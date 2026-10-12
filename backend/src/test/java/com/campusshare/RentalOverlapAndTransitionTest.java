package com.campusshare;

import com.campusshare.dto.RentalCreateRequest;
import com.campusshare.exception.BadRequestException;
import com.campusshare.exception.ConflictException;
import com.campusshare.model.*;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.PaymentRepository;
import com.campusshare.repository.RentalRepository;
import com.campusshare.repository.UserRepository;
import com.campusshare.service.ActivityLogService;
import com.campusshare.service.RentalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalOverlapAndTransitionTest {

    @Mock
    private RentalRepository rentalRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private RentalService rentalService;

    private User owner;
    private User borrower;
    private Item item;

    @BeforeEach
    void setUp() {
        owner = new User("Item Owner", "owner@campusshare.edu", "pass", Role.STUDENT, "111", "OWN-1");
        owner.setId(1L);

        borrower = new User("Item Borrower", "borrower@campusshare.edu", "pass", Role.STUDENT, "222", "BOR-1");
        borrower.setId(2L);

        Category category = new Category("Lab Equipment", "Multimeters", "Zap");
        category.setId(5L);

        item = new Item("Digital Multimeter", "High accuracy multimeter", new BigDecimal("40.00"),
                BigDecimal.ZERO, ItemCondition.GOOD, owner, category, "multimeter.jpg");
        item.setId(200L);
    }

    @Test
    @DisplayName("Should prevent creating rental request if dates overlap with an APPROVED rental")
    void testOverlapPreventionOnCreate() {
        LocalDate start = LocalDate.now().plusDays(2);
        LocalDate end = LocalDate.now().plusDays(6);

        Rental existingApproved = new Rental(item, borrower, start, end, 5, new BigDecimal("200.00"));
        existingApproved.setStatus(RentalStatus.APPROVED);

        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));
        when(rentalRepository.findOverlappingApprovedRentals(eq(item.getId()), eq(start), eq(end), isNull()))
                .thenReturn(List.of(existingApproved));

        RentalCreateRequest request = new RentalCreateRequest(item.getId(), start, end);

        ConflictException ex = assertThrows(ConflictException.class, () ->
                rentalService.createRental(request, borrower.getEmail())
        );

        assertTrue(ex.getMessage().contains("already booked and approved"));
        verify(rentalRepository, never()).save(any(Rental.class));
    }

    @Test
    @DisplayName("Should prevent owner approving a rental if an overlapping APPROVED rental exists")
    void testOverlapPreventionOnApproval() {
        LocalDate start = LocalDate.now().plusDays(3);
        LocalDate end = LocalDate.now().plusDays(7);

        Rental rentalToApprove = new Rental(item, borrower, start, end, 5, new BigDecimal("200.00"));
        rentalToApprove.setId(301L);
        rentalToApprove.setStatus(RentalStatus.PENDING);

        Rental existingApproved = new Rental(item, borrower, start, end, 5, new BigDecimal("200.00"));
        existingApproved.setId(300L);
        existingApproved.setStatus(RentalStatus.APPROVED);

        when(rentalRepository.findById(301L)).thenReturn(Optional.of(rentalToApprove));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(rentalRepository.findOverlappingApprovedRentals(eq(item.getId()), eq(start), eq(end), eq(301L)))
                .thenReturn(List.of(existingApproved));

        ConflictException ex = assertThrows(ConflictException.class, () ->
                rentalService.approveRental(301L, owner.getEmail())
        );

        assertTrue(ex.getMessage().contains("Overlapping approved rental exists"));
        assertEquals(RentalStatus.PENDING, rentalToApprove.getStatus());
    }

    @Test
    @DisplayName("Legal status transitions: PENDING -> APPROVED -> RETURNED")
    void testLegalHappyPathStatusTransitions() {
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(3);

        Rental rental = new Rental(item, borrower, start, end, 3, new BigDecimal("120.00"));
        rental.setId(401L);
        rental.setStatus(RentalStatus.PENDING);

        when(rentalRepository.findById(401L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(rentalRepository.findOverlappingApprovedRentals(eq(item.getId()), eq(start), eq(end), eq(401L)))
                .thenReturn(List.of());
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        // PENDING -> APPROVED
        var approvedResponse = rentalService.approveRental(401L, owner.getEmail());
        assertEquals(RentalStatus.APPROVED, approvedResponse.getStatus());
        assertEquals(RentalStatus.APPROVED, rental.getStatus());

        // APPROVED -> RETURNED
        var returnedResponse = rentalService.markReturned(401L, owner.getEmail());
        assertEquals(RentalStatus.RETURNED, returnedResponse.getStatus());
        assertEquals(RentalStatus.RETURNED, rental.getStatus());
    }

    @Test
    @DisplayName("Legal status transition: PENDING -> CANCELLED by borrower")
    void testLegalCancellationByBorrower() {
        Rental rental = new Rental(item, borrower, LocalDate.now().plusDays(2), LocalDate.now().plusDays(4), 3, new BigDecimal("120.00"));
        rental.setId(402L);
        rental.setStatus(RentalStatus.PENDING);

        when(rentalRepository.findById(402L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        var cancelledResponse = rentalService.cancelRental(402L, borrower.getEmail());
        assertEquals(RentalStatus.CANCELLED, cancelledResponse.getStatus());
        assertEquals(RentalStatus.CANCELLED, rental.getStatus());
    }

    @Test
    @DisplayName("Legal status transition: PENDING -> REJECTED by owner")
    void testLegalRejectionByOwner() {
        Rental rental = new Rental(item, borrower, LocalDate.now().plusDays(2), LocalDate.now().plusDays(4), 3, new BigDecimal("120.00"));
        rental.setId(403L);
        rental.setStatus(RentalStatus.PENDING);

        when(rentalRepository.findById(403L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        var rejectedResponse = rentalService.rejectRental(403L, "Need it for personal exam", owner.getEmail());
        assertEquals(RentalStatus.REJECTED, rejectedResponse.getStatus());
        assertEquals("Need it for personal exam", rental.getRejectionReason());
    }

    @Test
    @DisplayName("Illegal transition: Cannot cancel an already APPROVED rental")
    void testCannotCancelApprovedRental() {
        Rental rental = new Rental(item, borrower, LocalDate.now().plusDays(2), LocalDate.now().plusDays(4), 3, new BigDecimal("120.00"));
        rental.setId(404L);
        rental.setStatus(RentalStatus.APPROVED);

        when(rentalRepository.findById(404L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                rentalService.cancelRental(404L, borrower.getEmail())
        );

        assertTrue(ex.getMessage().contains("Illegal transition"));
    }

    @Test
    @DisplayName("Illegal transition: Cannot approve an already REJECTED rental")
    void testCannotApproveRejectedRental() {
        Rental rental = new Rental(item, borrower, LocalDate.now().plusDays(2), LocalDate.now().plusDays(4), 3, new BigDecimal("120.00"));
        rental.setId(405L);
        rental.setStatus(RentalStatus.REJECTED);

        when(rentalRepository.findById(405L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                rentalService.approveRental(405L, owner.getEmail())
        );

        assertTrue(ex.getMessage().contains("Illegal transition"));
    }

    @Test
    @DisplayName("Illegal transition: Cannot mark RETURNED on a PENDING rental")
    void testCannotReturnPendingRental() {
        Rental rental = new Rental(item, borrower, LocalDate.now().plusDays(2), LocalDate.now().plusDays(4), 3, new BigDecimal("120.00"));
        rental.setId(406L);
        rental.setStatus(RentalStatus.PENDING);

        when(rentalRepository.findById(406L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                rentalService.markReturned(406L, owner.getEmail())
        );

        assertTrue(ex.getMessage().contains("Illegal transition"));
    }
}
