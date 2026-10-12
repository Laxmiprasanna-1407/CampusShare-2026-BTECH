package com.campusshare;

import com.campusshare.dto.ChatRequest;
import com.campusshare.dto.ChatResponse;
import com.campusshare.model.Category;
import com.campusshare.model.Item;
import com.campusshare.model.ItemCondition;
import com.campusshare.model.Role;
import com.campusshare.model.User;
import com.campusshare.repository.ItemRepository;
import com.campusshare.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    @Mock
    private RestTemplate restTemplate;

    private ChatService chatService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private Item sampleItem;

    @BeforeEach
    void setUp() {
        when(restTemplateBuilder.setConnectTimeout(any())).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.setReadTimeout(any())).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.build()).thenReturn(restTemplate);

        chatService = new ChatService(itemRepository, restTemplateBuilder, objectMapper, 5000);

        User owner = new User("Owner", "owner@campusshare.edu", "pass", Role.STUDENT, "111", "ID-1");
        owner.setId(1L);
        Category category = new Category("Calculators", "Calculators", "Calculator");
        category.setId(10L);

        sampleItem = new Item("Casio Scientific Calculator fx-991EX", "Math exam ready",
                new BigDecimal("20.00"), BigDecimal.ZERO, ItemCondition.LIKE_NEW, owner, category, "calc.png");
        sampleItem.setId(101L);
    }

    @Test
    @DisplayName("When LLM API key is NOT configured, service must return catalog results with clear notice")
    void testChatbotFallbackWhenNoApiKey() {
        ReflectionTestUtils.setField(chatService, "apiKey", "");
        ReflectionTestUtils.setField(chatService, "maxContextItems", 6);

        when(itemRepository.searchForChatbot(any(), any(), any(Pageable.class)))
                .thenReturn(List.of(sampleItem));

        ChatRequest request = new ChatRequest("Is there a calculator under 30 per day?", List.of());
        ChatResponse response = chatService.processChat(request);

        assertNotNull(response);
        assertFalse(response.isConfigured());
        assertEquals("AI is not configured; showing search results", response.getFallbackNotice());
        assertEquals(1, response.getRetrievedItems().size());
        assertEquals("Casio Scientific Calculator fx-991EX", response.getRetrievedItems().get(0).getTitle());
        assertTrue(response.getAnswer().contains("Casio Scientific Calculator fx-991EX"));
        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("When LLM API key IS configured and LLM succeeds, returns AI completion")
    void testChatbotSuccessWithMockedLlm() {
        ReflectionTestUtils.setField(chatService, "apiKey", "sk-mock-test-key-12345");
        ReflectionTestUtils.setField(chatService, "apiUrl", "https://api.openai.com/v1/chat/completions");
        ReflectionTestUtils.setField(chatService, "model", "gpt-3.5-turbo");
        ReflectionTestUtils.setField(chatService, "maxContextItems", 6);

        when(itemRepository.searchForChatbot(any(), any(), any(Pageable.class)))
                .thenReturn(List.of(sampleItem));

        String mockLlmJson = """
                {
                    "choices": [
                        {
                            "message": {
                                "role": "assistant",
                                "content": "Yes! The Casio fx-991EX scientific calculator is available for ₹20 per day in like-new condition."
                            }
                        }
                    ]
                }
                """;

        when(restTemplate.postForEntity(eq("https://api.openai.com/v1/chat/completions"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(mockLlmJson, HttpStatus.OK));

        ChatRequest request = new ChatRequest("Is there a calculator under 30?", List.of());
        ChatResponse response = chatService.processChat(request);

        assertNotNull(response);
        assertTrue(response.isConfigured());
        assertNull(response.getFallbackNotice());
        assertTrue(response.getAnswer().contains("Casio fx-991EX scientific calculator is available"));
        assertEquals(1, response.getRetrievedItems().size());
    }

    @Test
    @DisplayName("When LLM call times out, service catches exception and falls back to database items")
    void testChatbotTimeoutGracefulFallback() {
        ReflectionTestUtils.setField(chatService, "apiKey", "sk-mock-test-key-12345");
        ReflectionTestUtils.setField(chatService, "apiUrl", "https://api.openai.com/v1/chat/completions");
        ReflectionTestUtils.setField(chatService, "maxContextItems", 6);

        when(itemRepository.searchForChatbot(any(), any(), any(Pageable.class)))
                .thenReturn(List.of(sampleItem));

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection timed out after 5000ms"));

        ChatRequest request = new ChatRequest("Is there a calculator under 30?", List.of());
        ChatResponse response = chatService.processChat(request);

        assertNotNull(response);
        assertFalse(response.isConfigured());
        assertTrue(response.getFallbackNotice().contains("timed out"));
        assertEquals(1, response.getRetrievedItems().size());
        assertTrue(response.getAnswer().contains("Casio Scientific Calculator fx-991EX"));
    }
}
