package com.campusshare;

import com.campusshare.dto.ItemRequest;
import com.campusshare.dto.RentalCreateRequest;
import com.campusshare.exception.BadRequestException;
import com.campusshare.exception.ForbiddenException;
import com.campusshare.model.*;
import com.campusshare.repository.*;
import com.campusshare.service.ActivityLogService;
import com.campusshare.service.ItemService;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OwnershipAndSecurityRulesTest {

    @Mock
    private ItemRepository itemRepository;
    @Mock
    private RentalRepository rentalRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private RentalService rentalService;

    @InjectMocks
    private ItemService itemService;

    private User owner;
    private User otherStudent;
    private Item item;

    @BeforeEach
    void setUp() {
        owner = new User("Alice Owner", "alice@campusshare.edu", "pass", Role.STUDENT, "111", "CS-1");
        owner.setId(10L);

        otherStudent = new User("Bob Intruder", "bob@campusshare.edu", "pass", Role.STUDENT, "222", "CS-2");
        otherStudent.setId(20L);

        Category category = new Category("Chargers", "Laptop and phone chargers", "Zap");
        category.setId(1L);

        item = new Item("65W Type-C Laptop Charger", "USB-PD fast charger", new BigDecimal("35.00"),
                new BigDecimal("100.00"), ItemCondition.GOOD, owner, category, "charger.jpg");
        item.setId(101L);
    }

    @Test
    @DisplayName("Business Rule: Student cannot rent their own item")
    void testStudentCannotRentOwnItem() {
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));

        RentalCreateRequest request = new RentalCreateRequest(
                item.getId(),
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3)
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                rentalService.createRental(request, owner.getEmail())
        );

        assertTrue(ex.getMessage().contains("cannot rent your own item"));
    }

    @Test
    @DisplayName("Security Rule: Non-owner cannot approve a rental request")
    void testNonOwnerCannotApproveRental() {
        Rental rental = new Rental(item, otherStudent, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 3, new BigDecimal("105.00"));
        rental.setId(500L);

        when(rentalRepository.findById(500L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(otherStudent.getEmail())).thenReturn(Optional.of(otherStudent));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                rentalService.approveRental(500L, otherStudent.getEmail())
        );

        assertTrue(ex.getMessage().contains("Only the item owner can approve"));
    }

    @Test
    @DisplayName("Security Rule: Non-borrower cannot cancel a rental request")
    void testNonBorrowerCannotCancelRental() {
        Rental rental = new Rental(item, otherStudent, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 3, new BigDecimal("105.00"));
        rental.setId(501L);

        when(rentalRepository.findById(501L)).thenReturn(Optional.of(rental));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                rentalService.cancelRental(501L, owner.getEmail())
        );

        assertTrue(ex.getMessage().contains("Only the borrower can cancel"));
    }

    @Test
    @DisplayName("Security Rule: Non-owner cannot edit an item listing")
    void testNonOwnerCannotEditItem() {
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));
        when(userRepository.findByEmail(otherStudent.getEmail())).thenReturn(Optional.of(otherStudent));

        ItemRequest updateRequest = new ItemRequest(
                "Hacked Title", "Desc", new BigDecimal("10.00"), BigDecimal.ZERO,
                ItemCondition.GOOD, 1L, "url", null
        );

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                itemService.updateItem(item.getId(), updateRequest, otherStudent.getEmail())
        );

        assertTrue(ex.getMessage().contains("Only the owner can edit this item"));
    }

    @Test
    @DisplayName("Security Rule: Non-owner cannot delete an item listing")
    void testNonOwnerCannotDeleteItem() {
        when(itemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));
        when(userRepository.findByEmail(otherStudent.getEmail())).thenReturn(Optional.of(otherStudent));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                itemService.deleteItem(item.getId(), otherStudent.getEmail())
        );

        assertTrue(ex.getMessage().contains("Only the owner can delete this item"));
    }
}
