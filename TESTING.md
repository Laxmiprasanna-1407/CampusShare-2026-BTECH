# 🧪 CampusShare: Testing & Quality Assurance Report

This document records the exact test suites, execution commands, raw terminal outputs, and pass/fail statuses for **CampusShare**.

---

## 📊 Summary Scorecard

| Test Scope | Technology | Total Checks | Status | Evidence Command |
| :--- | :--- | :---: | :---: | :--- |
| **Backend Unit & Integration Tests** | JUnit 5 + Mockito + Spring Boot | 35 | **PASS** | `mvnw.cmd test` |
| **Frontend Unit & Component Tests** | Vitest + React Testing Library | 8 | **PASS** | `npm test` |
| **Live End-to-End API Suite** | Node.js + Fetch against Live App | 39 | **PASS** | `node test_e2e.js` |
| **Backend JAR Package** | Maven Repackage | 1 | **PASS** | `mvnw.cmd package -DskipTests` |
| **Frontend Production Bundle** | Vite Build | 1 | **PASS** | `npm run build` |
| **Docker & Real MySQL 8** | Docker Compose | — | **NOT TESTED** | `docker -v` (Command not found) |
| **Public Cloud Deployment** | Vercel / Render | — | **NOT TESTED** | Local verification only |

---

## 1. Backend Test Suite (JUnit 5, Mockito, Spring Boot)

- **Command**: `.\mvnw.cmd test`
- **Working Directory**: `c:\JFS\CampusShare\backend`
- **Result**: **PASS** (35 tests run, 0 failures, 0 errors, 0 skipped)

### Test Classes & Coverage:
1. **`RentalCalculationTest`** (5 tests):
   - `testSingleDayRentalCalculation`: Verifies 1-day rental (same start & end date) calculates `1 * dailyPrice` (PASS)
   - `testMultiDayRentalCalculation`: Verifies multi-day inclusive duration (`Nov 1` to `Nov 6` = 6 days) @ ₹25.00 = ₹150.00 (PASS)
   - `testLongDurationRentalCalculation`: Verifies 30-day rental precision using `BigDecimal` arithmetic (PASS)
   - `testStartDateInPastThrowsException`: Verifies `BadRequestException` when start date is in the past (PASS)
   - `testEndDateBeforeStartDateThrowsException`: Verifies `BadRequestException` when end date < start date (PASS)
2. **`RentalOverlapAndTransitionTest`** (8 tests):
   - `testOverlapPreventionOnCreate`: Verifies `ConflictException` when booking overlapping approved dates (PASS)
   - `testOverlapPreventionOnApproval`: Verifies owner cannot approve rental conflicting with existing approved rental (PASS)
   - `testLegalHappyPathStatusTransitions`: Validates `PENDING` -> `APPROVED` -> `RETURNED` state transitions (PASS)
   - `testLegalCancellationByBorrower`: Validates `PENDING` -> `CANCELLED` by borrower (PASS)
   - `testLegalRejectionByOwner`: Validates `PENDING` -> `REJECTED` by owner with reason (PASS)
   - `testCannotCancelApprovedRental`: Rejects illegal transition `APPROVED` -> `CANCELLED` (PASS)
   - `testCannotApproveRejectedRental`: Rejects illegal transition `REJECTED` -> `APPROVED` (PASS)
   - `testCannotReturnPendingRental`: Rejects illegal transition `PENDING` -> `RETURNED` (PASS)
3. **`OwnershipAndSecurityRulesTest`** (5 tests):
   - `testStudentCannotRentOwnItem`: Throws `BadRequestException` if owner tries to rent their own item (PASS)
   - `testNonOwnerCannotApproveRental`: Throws `ForbiddenException` if non-owner calls approve (PASS)
   - `testNonBorrowerCannotCancelRental`: Throws `ForbiddenException` if non-borrower calls cancel (PASS)
   - `testNonOwnerCannotEditItem`: Throws `ForbiddenException` if non-owner tries editing item (PASS)
   - `testNonOwnerCannotDeleteItem`: Throws `ForbiddenException` if non-owner tries deleting item (PASS)
4. **`ReviewRulesTest`** (4 tests):
   - `testNonBorrowerCannotSubmitReview`: Rejects review attempt from third-party student (PASS)
   - `testCannotReviewActiveOrPendingRental`: Rejects review submitted before rental is `RETURNED` (PASS)
   - `testDuplicateReviewRejected`: Enforces exactly 1 review per rental (`ConflictException`) (PASS)
   - `testSuccessfulReviewCreation`: Saves 1-5 star review and triggers average rating update (PASS)
5. **`JwtAndAuthTest`** (4 tests):
   - `testJwtTokenGenerationAndValidation`: Generates 3-part JWT, parses claims, verifies signature (PASS)
   - `testTamperedTokenRejection`: Fails validation when token payload/signature is corrupted (PASS)
   - `testProdProfileWeakSecretRejection`: Throws `IllegalStateException` on startup in `prod` profile if secret is weak or default (PASS)
   - `testBcryptPasswordHashing`: Verifies salt uniqueness and password match verification (PASS)
6. **`ChatServiceTest`** (3 tests):
   - `testChatbotFallbackWhenNoApiKey`: Returns retrieved database catalog items with clear notice *"AI is not configured; showing search results"* (PASS)
   - `testChatbotSuccessWithMockedLlm`: Calls mocked OpenAI API with retrieved context and returns completion (PASS)
   - `testChatbotTimeoutGracefulFallback`: Catches `ResourceAccessException` timeout and falls back to database items gracefully (PASS)
7. **`ApiIntegrationTest`** (6 tests):
   - `testStudentRegistration`: `POST /api/auth/register` creates `STUDENT` and returns JWT (PASS)
   - `testValidationErrorHandling`: Invalid register request returns uniform 400 `ErrorResponse` with field details (PASS)
   - `testUnauthenticatedAccess`: Protected endpoint returns `401 Unauthorized` without token (PASS)
   - `testStudentForbiddenFromAdminEndpoint`: Student token requesting `/api/admin/stats` returns `403 Forbidden` (PASS)
   - `testAdminAccessToAdminEndpoint`: Admin token requesting `/api/admin/stats` returns `200 OK` (PASS)
   - `testResourceNotFoundException`: Non-existent item returns uniform `404 Not Found` (PASS)

### Real Terminal Output:
```text
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  19.278 s
[INFO] Finished at: 2026-10-11T19:24:19+05:30
[INFO] Results: Tests run: 35, Failures: 0, Errors: 0, Skipped: 0
```

---

## 2. Frontend Test Suite (Vitest + React Testing Library)

- **Command**: `npm test`
- **Working Directory**: `c:\JFS\CampusShare\frontend`
- **Result**: **PASS** (4 test files, 8 tests run, 0 failures)

### Test Coverage:
1. `src/test/formsAndValidation.test.jsx`:
   - Renders login form and responds to user inputs (PASS)
   - Validates minimum 6-character password constraint during registration (PASS)
2. `src/test/protectedRoutesAndRoles.test.jsx`:
   - Redirects unauthenticated visitor from `/my-items` to `/login` (PASS)
   - Allows authenticated student into protected route (PASS)
   - Displays Admin navigation link strictly to users with role `ADMIN` (PASS)
3. `src/test/rentalAmountPreview.test.jsx`:
   - Renders item details and recalculates live rental preview for multi-day rental (3 days @ ₹30 = ₹90.00) (PASS)
4. `src/test/loadingAndErrorStates.test.jsx`:
   - `ErrorBoundary` catches rendering crashes and displays friendly recovery button (PASS)
   - `BrowseItemsPage` renders empty state with reset filters button when no items match (PASS)

### Real Terminal Output:
```text
 RUN  v5.0.3 C:/JFS/CampusShare/frontend

 ✓ src/test/rentalAmountPreview.test.jsx (1 test) 114ms
 ✓ src/test/protectedRoutesAndRoles.test.jsx (3 tests) 96ms
 ✓ src/test/formsAndValidation.test.jsx (2 tests) 194ms
 ✓ src/test/loadingAndErrorStates.test.jsx (2 tests) 187ms

 Test Files  4 passed (4)
      Tests  8 passed (8)
   Duration  1.85s
```

---

## 3. Live End-to-End API Integration Suite (`test_e2e.js`)

- **Command**: `node test_e2e.js`
- **Execution Target**: Live running application on `http://localhost:8080`
- **Result**: **PASS** (39 checks passed, 0 failed)

### Real Output Transcript:
```text
====================================================
  CampusShare Live End-to-End API Verification
====================================================

--- 1. Registration & Authentication ---
[PASS] Student A registers successfully (HTTP 201)
[PASS] Student B registers successfully (HTTP 201)
[PASS] Admin logs in successfully (HTTP 200)
[PASS] Admin user has role ADMIN

--- 2. Item Listing by Student A ---
[PASS] Student A creates item listing (HTTP 201)
[PASS] Item title matches
[PASS] Daily price is ₹25.00
[PASS] Student A cannot rent their own item (HTTP 400)

--- 3. Student B Requests Rental ---
[PASS] Student B submits rental request (HTTP 201)
[PASS] Rental duration calculated as 3 days
[PASS] Rental amount calculated server-side as ₹75.00 (3 days * ₹25)
[PASS] Rental status initialized as PENDING

--- 4. Authorization Check: Non-owner Cannot Approve ---
[PASS] Student B forbidden from approving rental for item they do not own (HTTP 403)

--- 5. Owner Approval ---
[PASS] Owner Student A successfully approves rental (HTTP 200)
[PASS] Rental status updated to APPROVED
[PASS] Payment record initialized with status PENDING

--- 6. Overlap Prevention Rule ---
[PASS] Overlapping rental request rejected with HTTP 409 Conflict

--- 7. Simulated Payment & Return Status Flow ---
[PASS] Owner marks simulated payment as PAID (HTTP 200)
[PASS] Payment status is PAID
[PASS] Simulated transaction reference generated
[PASS] Owner marks rental as RETURNED (HTTP 200)
[PASS] Rental status is RETURNED

--- 8. Review Submission by Borrower ---
[PASS] Borrower Student B submits 5-star review (HTTP 201)
[PASS] Review rating is 5
[PASS] Duplicate review rejected with HTTP 409 Conflict
[PASS] Item average rating updated to 5.0
[PASS] Total reviews count is 1

--- 9. Ownership Protection: Non-owner Cannot Edit ---
[PASS] Student B forbidden from editing Student A listing (HTTP 403)

--- 10. Unauthenticated Access Protection ---
[PASS] Unauthenticated request to protected endpoint returns HTTP 401

--- 11. Role-Based Security: Student Forbidden from /api/admin ---
[PASS] Student calling /api/admin/stats returns HTTP 403 Forbidden
[PASS] Admin calling /api/admin/stats returns HTTP 200 OK
[PASS] Admin stats reflect at least 1 total rental

--- 12. Catalog Search, Filter, Sort, Pagination ---
[PASS] Search and filter query returns HTTP 200
[PASS] Catalog returns matching items
[PASS] Pagination pageNumber is 0

--- 13. AI Chatbot RAG Fallback without API Key ---
[PASS] Chat endpoint returns HTTP 200
[PASS] Fallback notice returned when no LLM key configured
[PASS] Chatbot RAG retrieved relevant calculator from database
[PASS] Chat answer includes retrieved calculator title

====================================================
  E2E API Test Complete: 39 PASSED, 0 FAILED
====================================================
```

---

## 4. Docker & Real MySQL 8 Status

- **Status**: **NOT TESTED**
- **Reason**: The host environment does not have the `docker` binary installed.
- **Evidence Command Output**:
```text
PS C:\JFS\CampusShare> docker -v
docker : The term 'docker' is not recognized as the name of a cmdlet, function, script file, or operable program.
```
- **Mitigation & Note**: Complete multi-stage Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) and `docker-compose.yml` with MySQL 8 healthchecks are fully provided in the repository for environments with Docker Desktop installed. The default `local` profile uses H2 in MySQL mode with Flyway to ensure seamless zero-dependency local grading.
