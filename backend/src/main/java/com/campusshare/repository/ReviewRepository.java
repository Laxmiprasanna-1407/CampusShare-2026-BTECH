package com.campusshare.repository;

import com.campusshare.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByRentalId(Long rentalId);

    boolean existsByRentalId(Long rentalId);

    List<Review> findByItemIdOrderByCreatedAtDesc(Long itemId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.item.id = :itemId")
    Double getAverageRatingForItem(@Param("itemId") Long itemId);

    long countByItemId(Long itemId);
}
