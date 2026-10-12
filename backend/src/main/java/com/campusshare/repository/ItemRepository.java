package com.campusshare.repository;

import com.campusshare.model.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findByIdAndIsDeletedFalse(Long id);

    Page<Item> findByOwnerIdAndIsDeletedFalseOrderByCreatedAtDesc(Long ownerId, Pageable pageable);

    @Query("SELECT i FROM Item i " +
           "WHERE i.isDeleted = false " +
           "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
           "AND (:available IS NULL OR i.available = :available) " +
           "AND (:maxPrice IS NULL OR i.dailyPrice <= :maxPrice) " +
           "AND (:keyword IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Item> searchItems(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("available") Boolean available,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    @Query("SELECT i FROM Item i " +
           "WHERE i.isDeleted = false AND i.available = true " +
           "AND (:keyword IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.category.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:maxPrice IS NULL OR i.dailyPrice <= :maxPrice) " +
           "ORDER BY i.dailyPrice ASC")
    List<Item> searchForChatbot(
            @Param("keyword") String keyword,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    long countByIsDeletedFalse();
    long countByIsDeletedFalseAndAvailableTrue();
}
