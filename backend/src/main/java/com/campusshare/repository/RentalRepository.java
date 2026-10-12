package com.campusshare.repository;

import com.campusshare.model.Rental;
import com.campusshare.model.RentalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<Rental, Long> {

    Page<Rental> findByBorrowerIdOrderByCreatedAtDesc(Long borrowerId, Pageable pageable);

    Page<Rental> findByItemOwnerIdOrderByCreatedAtDesc(Long ownerId, Pageable pageable);

    Page<Rental> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT r FROM Rental r " +
           "WHERE r.item.id = :itemId " +
           "AND r.status = com.campusshare.model.RentalStatus.APPROVED " +
           "AND r.startDate <= :endDate " +
           "AND r.endDate >= :startDate " +
           "AND (:excludeRentalId IS NULL OR r.id != :excludeRentalId)")
    List<Rental> findOverlappingApprovedRentals(
            @Param("itemId") Long itemId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeRentalId") Long excludeRentalId
    );

    boolean existsByItemIdAndStatusIn(Long itemId, Collection<RentalStatus> statuses);

    long countByStatus(RentalStatus status);
}
