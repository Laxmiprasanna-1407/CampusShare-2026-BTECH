package com.campusshare;

import com.campusshare.dto.LoginRequest;
import com.campusshare.dto.RegisterRequest;
import com.campusshare.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private com.campusshare.repository.UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("POST /api/auth/register should create student and return token")
    void testStudentRegistration() throws Exception {
        String uniqueEmail = "student_" + System.currentTimeMillis() + "@campusshare.edu";
        RegisterRequest request = new RegisterRequest(
                "Jane Doe",
                uniqueEmail,
                "Password123!",
                "+91 9123456780",
                "STU-889"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value(uniqueEmail))
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("Validation error should return uniform 400 ErrorResponse with field details")
    void testValidationErrorHandling() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest(
                "", // Blank name
                "invalid-email-format", // Invalid email
                "123", // Too short password (< 6 chars)
                null,
                null
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.details", hasSize(greaterThanOrEqualTo(3))));
    }

    @Test
    @DisplayName("Unauthenticated request to protected endpoint should return 401 Unauthorized")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/rentals/mine"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Student token requesting /api/admin/stats should return 403 Forbidden")
    void testStudentForbiddenFromAdminEndpoint() throws Exception {
        String studentEmail = "student.regular@campusshare.edu";
        com.campusshare.model.User student = userRepository.findByEmail(studentEmail).orElseGet(() ->
                userRepository.save(new com.campusshare.model.User(
                        "Regular Student",
                        studentEmail,
                        passwordEncoder.encode("Secret123!"),
                        com.campusshare.model.Role.STUDENT,
                        "+91 9999999999",
                        "STU-REG-1"
                ))
        );
        String studentToken = jwtTokenProvider.generateToken(student.getId(), student.getEmail(), "STUDENT");

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Admin token requesting /api/admin/stats should return 200 OK with statistics")
    void testAdminAccessToAdminEndpoint() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(1L, "admin@campusshare.edu", "ADMIN");

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber())
                .andExpect(jsonPath("$.totalItems").isNumber())
                .andExpect(jsonPath("$.totalRentals").isNumber());
    }

    @Test
    @DisplayName("GET non-existent item should return uniform 404 ErrorResponse")
    void testResourceNotFoundException() throws Exception {
        mockMvc.perform(get("/api/items/9999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message", containsString("Item not found")));
    }
}
