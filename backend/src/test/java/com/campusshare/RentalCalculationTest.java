package com.campusshare;

import com.campusshare.dto.RentalCreateRequest;
import com.campusshare.exception.BadRequestException;
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
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalCalculationTest {

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
    private Category category;
    private Item item;

    @BeforeEach
    void setUp() {
        owner = new User("Owner Student", "owner@campusshare.edu", "hash1", Role.STUDENT, "1234567890", "CS-001");
        owner.setId(1L);

        borrower = new User("Borrower Student", "borrower@campusshare.edu", "hash2", Role.STUDENT, "0987654321", "CS-002");
        borrower.setId(2L);

        category = new Category("Calculators", "Scientific Calculators", "Calculator");
        category.setId(10L);

        item = new Item(
                "Casio fx-991EX Scientific Calculator",
                "Advanced scientific calculator for exams",
                new BigDecimal("25.00"),
                new BigDecimal("200.00"),
                ItemCondition.LIKE_NEW,
                owner,
                category,
                "https://example.com/calc.jpg"
        );
        item.setId(100L);
    }

    @Test
    @DisplayName("Should correctly calculate rental amount for a 1-day rental (same start & end date)")
    void testSingleDayRentalCalculation() {
        LocalDate rentalDate = LocalDate.now().plusDays(2);
        RentalCreateRequest request = new RentalCreateRequest(item.getId(), rentalDate, rentalDate);

        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));
        when(rentalRepository.findOverlappingApprovedRentals(eq(item.getId()), eq(rentalDate), eq(rentalDate), isNull()))
                .thenReturn(Collections.emptyList());
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> {
            Rental r = invocation.getArgument(0);
            r.setId(501L);
            return r;
        });

        var response = rentalService.createRental(request, borrower.getEmail());

        assertNotNull(response);
        assertEquals(1, response.getTotalDays());
        // 1 day * ₹25.00 = ₹25.00
        assertEquals(new BigDecimal("25.00"), response.getTotalAmount());
    }

    @Test
    @DisplayName("Should accurately compute rental amount for multi-day rental with BigDecimal precision")
    void testMultiDayRentalCalculation() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = startDate.plusDays(5); // 6 days inclusive (e.g. Day 1, 2, 3, 4, 5, 6)
        RentalCreateRequest request = new RentalCreateRequest(item.getId(), startDate, endDate);

        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));
        when(rentalRepository.findOverlappingApprovedRentals(eq(item.getId()), eq(startDate), eq(endDate), isNull()))
                .thenReturn(Collections.emptyList());
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> {
            Rental r = invocation.getArgument(0);
            r.setId(502L);
            return r;
        });

        var response = rentalService.createRental(request, borrower.getEmail());

        assertNotNull(response);
        assertEquals(6, response.getTotalDays());
        // 6 days * ₹25.00 = ₹150.00
        assertEquals(new BigDecimal("150.00"), response.getTotalAmount());
    }

    @Test
    @DisplayName("Should compute long duration rental without precision loss")
    void testLongDurationRentalCalculation() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = startDate.plusDays(29); // 30 days inclusive
        RentalCreateRequest request = new RentalCreateRequest(item.getId(), startDate, endDate);

        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));
        when(rentalRepository.findOverlappingApprovedRentals(eq(item.getId()), eq(startDate), eq(endDate), isNull()))
                .thenReturn(Collections.emptyList());
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = rentalService.createRental(request, borrower.getEmail());

        assertEquals(30, response.getTotalDays());
        // 30 days * ₹25.00 = ₹750.00
        assertEquals(new BigDecimal("750.00"), response.getTotalAmount());
    }

    @Test
    @DisplayName("Should throw BadRequestException if start date is in the past")
    void testStartDateInPastThrowsException() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        RentalCreateRequest request = new RentalCreateRequest(item.getId(), yesterday, LocalDate.now());

        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                rentalService.createRental(request, borrower.getEmail())
        );

        assertTrue(ex.getMessage().contains("Start date cannot be in the past"));
    }

    @Test
    @DisplayName("Should throw BadRequestException if end date is before start date")
    void testEndDateBeforeStartDateThrowsException() {
        LocalDate startDate = LocalDate.now().plusDays(5);
        LocalDate endDate = LocalDate.now().plusDays(2);
        RentalCreateRequest request = new RentalCreateRequest(item.getId(), startDate, endDate);

        when(userRepository.findByEmail(borrower.getEmail())).thenReturn(Optional.of(borrower));
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                rentalService.createRental(request, borrower.getEmail())
        );

        assertTrue(ex.getMessage().contains("End date cannot be before start date"));
    }
}
