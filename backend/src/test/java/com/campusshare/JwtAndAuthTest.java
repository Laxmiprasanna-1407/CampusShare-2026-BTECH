package com.campusshare;

import com.campusshare.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

class JwtAndAuthTest {

    private final String validSecret = "campusshare_jwt_super_secure_secret_key_2026_capstone_must_be_long_enough_256bit";
    private final long expirationMs = 3600000; // 1 hour

    @Test
    @DisplayName("Should generate, parse, and validate JWT tokens correctly")
    void testJwtTokenGenerationAndValidation() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("local");

        JwtTokenProvider tokenProvider = new JwtTokenProvider(validSecret, expirationMs, env);
        tokenProvider.init();

        String token = tokenProvider.generateToken(42L, "student@campusshare.edu", "STUDENT");
        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3, "JWT must consist of three parts (header.payload.signature)");

        assertTrue(tokenProvider.validateToken(token));
        assertEquals("student@campusshare.edu", tokenProvider.getEmailFromToken(token));
        assertEquals(42L, tokenProvider.getUserIdFromToken(token));
    }

    @Test
    @DisplayName("Should reject tampered or corrupted JWT tokens")
    void testTamperedTokenRejection() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("local");

        JwtTokenProvider tokenProvider = new JwtTokenProvider(validSecret, expirationMs, env);
        tokenProvider.init();

        String token = tokenProvider.generateToken(42L, "student@campusshare.edu", "STUDENT");
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        assertFalse(tokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("Should refuse to start in prod profile if secret is missing, too short, or default")
    void testProdProfileWeakSecretRejection() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        // Test with default dev secret in prod
        JwtTokenProvider providerWithDefault = new JwtTokenProvider(validSecret, expirationMs, prodEnv);
        IllegalStateException ex1 = assertThrows(IllegalStateException.class, providerWithDefault::init);
        assertTrue(ex1.getMessage().contains("CRITICAL SECURITY ERROR"));

        // Test with short secret in prod
        JwtTokenProvider providerWithShortSecret = new JwtTokenProvider("too_short_secret", expirationMs, prodEnv);
        IllegalStateException ex2 = assertThrows(IllegalStateException.class, providerWithShortSecret::init);
        assertTrue(ex2.getMessage().contains("CRITICAL SECURITY ERROR"));

        // Test with custom strong secret in prod -> succeeds
        JwtTokenProvider providerWithStrongSecret = new JwtTokenProvider(
                "my_production_super_strong_custom_random_key_that_is_at_least_32_bytes_long!",
                expirationMs, prodEnv);
        assertDoesNotThrow(providerWithStrongSecret::init);
    }

    @Test
    @DisplayName("Should hash passwords securely with BCrypt and salt")
    void testBcryptPasswordHashing() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "StudentSecret@2026";

        String hash1 = encoder.encode(rawPassword);
        String hash2 = encoder.encode(rawPassword);

        // Salt ensures two hashes of the same password are never identical
        assertNotEquals(hash1, hash2);

        assertTrue(encoder.matches(rawPassword, hash1));
        assertTrue(encoder.matches(rawPassword, hash2));
        assertFalse(encoder.matches("WrongPassword", hash1));
    }
}
