package com.campusshare.service;

import com.campusshare.dto.*;
import com.campusshare.exception.ForbiddenException;
import com.campusshare.exception.ResourceNotFoundException;
import com.campusshare.model.*;
import com.campusshare.repository.CategoryRepository;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.ReviewRepository;
import com.campusshare.repository.TagRepository;
import com.campusshare.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ActivityLogService activityLogService;

    public ItemService(ItemRepository itemRepository,
                       CategoryRepository categoryRepository,
                       TagRepository tagRepository,
                       UserRepository userRepository,
                       ReviewRepository reviewRepository,
                       ActivityLogService activityLogService) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.activityLogService = activityLogService;
    }

    @Cacheable(value = "items-list", key = "T(java.util.Objects).hash(#keyword, #categoryId, #available, #maxPrice, #pageable.pageNumber, #pageable.pageSize, #pageable.sort.toString())")
    @Transactional(readOnly = true)
    public PagedResponse<ItemResponse> searchItems(String keyword, Long categoryId, Boolean available, BigDecimal maxPrice, Pageable pageable) {
        Page<Item> page = itemRepository.searchItems(
                (keyword != null && !keyword.isBlank()) ? keyword.trim() : null,
                categoryId,
                available,
                maxPrice,
                pageable
        );

        List<ItemResponse> content = page.getContent().stream()
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

    @Cacheable(value = "item-details", key = "#id")
    @Transactional(readOnly = true)
    public ItemResponse getItemById(Long id) {
        Item item = itemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        return toResponse(item);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ItemResponse> getMyItems(String ownerEmail, Pageable pageable) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + ownerEmail));

        Page<Item> page = itemRepository.findByOwnerIdAndIsDeletedFalseOrderByCreatedAtDesc(owner.getId(), pageable);
        List<ItemResponse> content = page.getContent().stream()
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

    @CacheEvict(value = {"items-list", "item-details"}, allEntries = true)
    @Transactional
    public ItemResponse createItem(ItemRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + ownerEmail));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Item item = new Item(
                request.getTitle(),
                request.getDescription(),
                request.getDailyPrice(),
                request.getDeposit(),
                request.getCondition(),
                owner,
                category,
                request.getImageUrl()
        );

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            Set<Tag> tags = resolveTags(request.getTags());
            item.setTags(tags);
        }

        Item savedItem = itemRepository.save(item);
        activityLogService.logActivity(ownerEmail, "ITEM_CREATED", "Item created: " + savedItem.getTitle() + " (ID: " + savedItem.getId() + ")");

        return toResponse(savedItem);
    }

    @CacheEvict(value = {"items-list", "item-details"}, allEntries = true)
    @Transactional
    public ItemResponse updateItem(Long id, ItemRequest request, String userEmail) {
        Item item = itemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        if (!item.getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only the owner can edit this item");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setDailyPrice(request.getDailyPrice());
        item.setDeposit(request.getDeposit() != null ? request.getDeposit() : BigDecimal.ZERO);
        item.setCondition(request.getCondition());
        item.setCategory(category);
        item.setImageUrl(request.getImageUrl());

        if (request.getTags() != null) {
            item.setTags(resolveTags(request.getTags()));
        }

        Item updatedItem = itemRepository.save(item);
        activityLogService.logActivity(userEmail, "ITEM_UPDATED", "Item updated: " + updatedItem.getTitle() + " (ID: " + updatedItem.getId() + ")");

        return toResponse(updatedItem);
    }

    @CacheEvict(value = {"items-list", "item-details"}, allEntries = true)
    @Transactional
    public void deleteItem(Long id, String userEmail) {
        Item item = itemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        if (!item.getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only the owner can delete this item");
        }

        // Soft deletion preserves rental history, payments, and reviews
        item.setDeleted(true);
        item.setAvailable(false);
        itemRepository.save(item);

        activityLogService.logActivity(userEmail, "ITEM_DELETED", "Item soft-deleted: " + item.getTitle() + " (ID: " + item.getId() + ")");
    }

    private Set<Tag> resolveTags(Set<String> tagNames) {
        Set<Tag> tags = new HashSet<>();
        for (String rawName : tagNames) {
            String name = rawName.trim();
            if (!name.isEmpty()) {
                Tag tag = tagRepository.findByName(name)
                        .orElseGet(() -> tagRepository.save(new Tag(name)));
                tags.add(tag);
            }
        }
        return tags;
    }

    public ItemResponse toResponse(Item item) {
        ItemResponse response = new ItemResponse();
        response.setId(item.getId());
        response.setTitle(item.getTitle());
        response.setDescription(item.getDescription());
        response.setDailyPrice(item.getDailyPrice());
        response.setDeposit(item.getDeposit());
        response.setCondition(item.getCondition());
        response.setAvailable(item.isAvailable());
        response.setDeleted(item.isDeleted());
        response.setImageUrl(item.getImageUrl());
        response.setCreatedAt(item.getCreatedAt());
        response.setUpdatedAt(item.getUpdatedAt());

        response.setOwner(new UserSummaryDto(
                item.getOwner().getId(),
                item.getOwner().getName(),
                item.getOwner().getEmail(),
                item.getOwner().getCollegeId()
        ));

        response.setCategory(new CategoryDto(
                item.getCategory().getId(),
                item.getCategory().getName(),
                item.getCategory().getDescription(),
                item.getCategory().getIcon()
        ));

        response.setTags(item.getTags().stream().map(Tag::getName).sorted().toList());

        Double avgRating = reviewRepository.getAverageRatingForItem(item.getId());
        response.setAverageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null);
        response.setTotalReviews(reviewRepository.countByItemId(item.getId()));

        return response;
    }
}
