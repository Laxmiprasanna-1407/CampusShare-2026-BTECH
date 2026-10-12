package com.campusshare.service;

import com.campusshare.dto.ChatMessageDto;
import com.campusshare.dto.ChatRequest;
import com.campusshare.dto.ChatResponse;
import com.campusshare.dto.ItemSummaryDto;
import com.campusshare.dto.UserSummaryDto;
import com.campusshare.model.Item;
import com.campusshare.repository.ItemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ItemRepository itemRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.llm.api-key:}")
    private String apiKey;

    @Value("${app.llm.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.llm.model:gpt-3.5-turbo}")
    private String model;

    @Value("${app.llm.max-context-items:6}")
    private int maxContextItems;

    public ChatService(ItemRepository itemRepository,
                       RestTemplateBuilder restTemplateBuilder,
                       ObjectMapper objectMapper,
                       @Value("${app.llm.timeout-ms:10000}") int timeoutMs) {
        this.itemRepository = itemRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(timeoutMs))
                .setReadTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    @Transactional(readOnly = true)
    public ChatResponse processChat(ChatRequest request) {
        String query = request.getMessage() != null ? request.getMessage().trim() : "";
        BigDecimal maxPrice = extractMaxPrice(query);
        String keyword = extractKeyword(query);

        // RAG Retrieval from database
        List<Item> retrievedItems = itemRepository.searchForChatbot(
                keyword,
                maxPrice,
                PageRequest.of(0, Math.max(1, maxContextItems))
        );

        // Fallback search if strict keyword yielded nothing
        if (retrievedItems.isEmpty() && keyword != null) {
            String[] tokens = keyword.split("\\s+");
            if (tokens.length > 1) {
                retrievedItems = itemRepository.searchForChatbot(
                        tokens[0],
                        maxPrice,
                        PageRequest.of(0, Math.max(1, maxContextItems))
                );
            }
        }

        List<ItemSummaryDto> itemDtos = retrievedItems.stream()
                .map(item -> new ItemSummaryDto(
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
                ))
                .toList();

        // Check if LLM API key is configured
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.info("LLM API key not configured. Returning catalog search fallback.");
            String answer = buildDirectFallbackAnswer(query, itemDtos);
            return new ChatResponse(
                    answer,
                    "AI is not configured; showing search results",
                    false,
                    itemDtos
            );
        }

        // LLM is configured: Call LLM with RAG injected context
        try {
            String aiAnswer = callLlmWithContext(query, request.getHistory(), retrievedItems);
            return new ChatResponse(aiAnswer, null, true, itemDtos);
        } catch (ResourceAccessException ex) {
            log.warn("LLM API call timed out or network error: {}", ex.getMessage());
            String answer = buildDirectFallbackAnswer(query, itemDtos);
            return new ChatResponse(
                    answer,
                    "LLM API timed out; displaying catalog search results.",
                    false,
                    itemDtos
            );
        } catch (RestClientResponseException ex) {
            log.warn("LLM API provider returned error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            String answer = buildDirectFallbackAnswer(query, itemDtos);
            return new ChatResponse(
                    answer,
                    "LLM service unavailable (" + ex.getStatusCode().value() + "); displaying catalog search results.",
                    false,
                    itemDtos
            );
        } catch (Exception ex) {
            log.error("Unexpected error calling LLM API: {}", ex.getMessage(), ex);
            String answer = buildDirectFallbackAnswer(query, itemDtos);
            return new ChatResponse(
                    answer,
                    "LLM error; displaying catalog search results.",
                    false,
                    itemDtos
            );
        }
    }

    private String callLlmWithContext(String userMessage, List<ChatMessageDto> history, List<Item> items) throws Exception {
        StringBuilder contextBuilder = new StringBuilder();
        if (items.isEmpty()) {
            contextBuilder.append("No active items match the current search filters in the campus database.\n");
        } else {
            for (Item item : items) {
                contextBuilder.append("- Title: ").append(item.getTitle())
                        .append(" | Category: ").append(item.getCategory().getName())
                        .append(" | Daily Rate: ₹").append(item.getDailyPrice())
                        .append(" | Condition: ").append(item.getCondition())
                        .append(" | Description: ").append(item.getDescription() != null ? item.getDescription() : "N/A")
                        .append("\n");
            }
        }

        String systemPrompt = """
                You are CampusShare Assistant, an AI helper for a peer-to-peer college item rental platform.
                Your role is to assist university students in finding items they need (calculators, textbooks, lab equipment, chargers) to borrow from fellow peers.

                CRITICAL GUIDELINES:
                1. Answer student queries strictly based ONLY on the provided CAMPUS CATALOG CONTEXT below.
                2. If no item matching their criteria exists in the context, explicitly tell the student that no matching item is currently available on CampusShare.
                3. Never hallucinate or invent items, prices, conditions, or user contact information.
                4. Prices are in Indian Rupees (₹ / Rs.). Mention the daily price when discussing items.
                5. Keep your tone encouraging, direct, and helpful.

                CURRENT CAMPUS CATALOG CONTEXT:
                """ + contextBuilder;

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Add up to last 4 conversation turns to respect token limits
        if (history != null && !history.isEmpty()) {
            int start = Math.max(0, history.size() - 4);
            for (int i = start; i < history.size(); i++) {
                ChatMessageDto msg = history.get(i);
                if (msg.getContent() != null && !msg.getContent().isBlank()) {
                    messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
                }
            }
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.3);
        requestBody.put("max_tokens", 450);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (!content.isMissingNode()) {
                return content.asText();
            }
        }

        throw new RuntimeException("Empty response received from LLM provider");
    }

    private String buildDirectFallbackAnswer(String query, List<ItemSummaryDto> items) {
        if (items.isEmpty()) {
            return "No items matching your request were found in the CampusShare catalog. Try searching with different keywords or categories!";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Here are the relevant items found in our campus catalog:\n\n");
        for (ItemSummaryDto item : items) {
            sb.append("• **").append(item.getTitle()).append("** — ₹")
                    .append(item.getDailyPrice()).append("/day")
                    .append(" (").append(item.getCategoryName()).append(")\n");
        }
        sb.append("\nYou can click on any item above to view details and submit a rental request.");
        return sb.toString();
    }

    private BigDecimal extractMaxPrice(String text) {
        if (text == null) return null;
        // Matches "under 30", "under Rs. 30", "below ₹50", "under 50 rs", "max 100"
        Pattern pattern = Pattern.compile("(?i)(?:under|below|less than|max|within)\\s*(?:rs\\.?|inr|₹)?\\s*(\\d+(?:\\.\\d+)?)");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                return new BigDecimal(matcher.group(1));
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private String extractKeyword(String text) {
        if (text == null || text.isBlank()) return null;
        // Remove common stop words and phrases
        String cleaned = text.replaceAll("(?i)(?:is there|are there|can i rent|looking for|i need|do you have|any|a|an|the|under|below|less than|rs\\.?|inr|₹|per day|per-day|daily|available|rent|price|cheap|please|find)\\b", " ")
                .replaceAll("\\d+(?:\\.\\d+)?", " ")
                .replaceAll("[^a-zA-Z0-9\\s]", " ")
                .trim()
                .replaceAll("\\s+", " ");

        return cleaned.isBlank() ? null : cleaned;
    }
}
