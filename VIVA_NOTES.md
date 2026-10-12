# CampusShare — Viva & Oral Examination Preparation Guide

> **Project Name:** CampusShare: Peer-to-Peer College Item Rental Platform  
> **Tech Stack:** Spring Boot 3.3.4 (Java 21) | React 19 (Vite + Tailwind CSS v4) | MySQL 8 / H2 in MySQL Mode | Flyway Migrations | JWT + Spring Security | Caffeine Cache  
> **Audience:** Capstone Evaluators, External Examiners, Viva Panel, Project Reviewers  

---

## 1. Project High-Level Architecture

CampusShare is a full-stack peer-to-peer sharing and rental platform built for college campus communities. It addresses campus resource underutilization (e.g., scientific calculators, lab coats, textbook editions, camera gear, microcontrollers) while providing zero-interest peer commerce.

```
+-------------------------------------------------------------------------------+
|                             CLIENT TIER (React 19)                            |
|  - React Router v7 SPA with Protected & Role-Based Routes                     |
|  - Centralized Axios Client (Auth Header Injection & 401 Interceptors)        |
|  - Context API AuthProvider (Decoded JWT, Role Helpers, Auto-Logout)          |
|  - Real-Time Price Engine (Formula: dailyPrice * max(1, days))                |
|  - Tailwind CSS v4 UI with WCAG AA Accessibility & Responsive Grids          |
+-------------------------------------------------------------------------------+
                                      |  HTTPS / REST JSON
                                      v
+-------------------------------------------------------------------------------+
|                       API GATEWAY & SECURITY FILTER TIER                      |
|  - JwtAuthenticationFilter (Extracts 'Bearer <token>', Validates HMAC-SHA256) |
|  - SecurityFilterChain (Stateless SessionCreationPolicy.STATELESS)            |
|  - DelegatedAuthenticationEntryPoint & GlobalExceptionHandler (Uniform JSON)  |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                           SPRING BOOT 3 CONTROLLERS                           |
|  - AuthController: Registration, BCrypt Hashing, Login, JWT Issuance          |
|  - ItemController: Paginated Search, Multi-Filter, Soft-Delete, Cache Evict   |
|  - RentalController: Booking Creation, Overlap Detection, Owner Transitions   |
|  - ReviewController: Post-Return Reviews, Rating Aggregate Calculation       |
|  - ChatController: Hybrid RAG Search (Catalog Grounding) + LLM Fallback       |
|  - AdminController: Campus KPIs, System Health (Actuator), User Moderation    |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                        BUSINESS SERVICES & DOMAIN LAYER                       |
|  - RentalService: BigDecimal Daily Rate Engine, Strict State Machine Validations|
|  - ItemService: Caffeine In-Memory Cache for Hot Queries (@Cacheable)         |
|  - ActivityLogService: Non-Blocking Asynchronous Audit Trails (@Async)        |
|  - ChatService: Intent Parsing, Keyword Tokenizer, Budget Filters, RAG Prompt |
+-------------------------------------------------------------------------------+
                                      |  Spring Data JPA / Hibernate 6
                                      v
+-------------------------------------------------------------------------------+
|                          PERSISTENCE & STORAGE TIER                           |
|  - Flyway Migration Engine (V1__create_schema.sql, V2__seed_initial_data.sql) |
|  - Database: MySQL 8 (Production) / H2 in MySQL Mode (Zero-Dependency Local)  |
|  - Enforced Database Foreign Keys, Indexes, Unique Constraints, Soft Deletes  |
+-------------------------------------------------------------------------------+
```

---

## 2. Core Technical Questions & Examiner Answers

### Q1: Why did you choose JWT over HTTP Sessions or Cookies?
**Answer:**
- **Stateless Horizontal Scalability:** With JSON Web Tokens (JWT) signed via HMAC-SHA256, the server maintains zero in-memory session state (`SessionCreationPolicy.STATELESS`). If the backend is replicated across multiple instances or containers, any node can independently verify requests without requiring distributed session stores like Redis.
- **Microservice / Mobile Ready:** The client simply passes `Authorization: Bearer <token>` in the header, making the API easily consumable by future mobile apps or third-party campus microservices.
- **Trade-Off Acknowledged:** Storing JWT in client-side storage (`localStorage`) makes it accessible to JavaScript, leaving it susceptible to Cross-Site Scripting (XSS) if unsanitized user inputs were rendered. We mitigated this by:
  1. Using React’s default automatic JSX string escaping for all dynamic data.
  2. Rendering markdown safely via `react-markdown` with code highlighting.
  3. Configuring strict Content-Security-Policy (CSP) headers and short token expiration lifetimes.
  4. In an enterprise bank setting, `httpOnly`, `SameSite=Strict`, `Secure` cookies would be used to prevent XSS exfiltration while using CSRF tokens to prevent cross-site request forgery.

---

### Q2: How are all 4 JPA relationship mappings implemented in the project?
**Answer:**
CampusShare demonstrates the four primary JPA relationship mappings cleanly:

1. **`@ManyToOne`**:
   - `Rental.java` has `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "borrower_id") private User borrower;`
   - `Rental.java` has `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "item_id") private Item item;`
   - `Item.java` has `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "category_id") private Category category;`
   - *Rationale:* Many rentals belong to one borrower or item. We use `FetchType.LAZY` to avoid N+1 query performance degradation.

2. **`@OneToMany`**:
   - `User.java` has `@OneToMany(mappedBy = "borrower", cascade = CascadeType.ALL, orphanRemoval = true) private List<Rental> rentals;`
   - `Category.java` has `@OneToMany(mappedBy = "category", cascade = CascadeType.ALL) private List<Item> items;`
   - *Rationale:* Bidirectional navigation where the parent entity manages child collections.

3. **`@OneToOne`**:
   - `Rental.java` has `@OneToOne(mappedBy = "rental", cascade = CascadeType.ALL, fetch = FetchType.LAZY) private Payment payment;`
   - `Payment.java` has `@OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "rental_id", unique = true) private Rental rental;`
   - *Rationale:* Every rental record corresponds to exactly one payment settlement, enforced by a database unique constraint on `rental_id`.

4. **`@ManyToMany`**:
   - `Item.java` and `Tag.java` share a Many-to-Many association via an explicit join table:
     ```java
     @ManyToMany(fetch = FetchType.LAZY)
     @JoinTable(
         name = "item_tags",
         joinColumns = @JoinColumn(name = "item_id"),
         inverseJoinColumns = @JoinColumn(name = "tag_id")
     )
     private Set<Tag> tags = new HashSet<>();
     ```
   - *Rationale:* An item can carry multiple descriptive tags (e.g., `#electronics`, `#ti-84`, `#exam-ready`), and a tag can be reused across hundreds of items.

---

### Q3: Why did you use `BigDecimal` instead of `double` or `float` for currency?
**Answer:**
- Binary floating-point types (`float` and `double` in IEEE 754 format) cannot accurately represent base-10 fractional numbers like `0.1` or `0.05`. Repeated arithmetic causes cumulative precision drift (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- In financial and rental computations, this drift causes penny reconciliation bugs, incorrect tax calculations, and database rounding errors.
- `BigDecimal` provides arbitrary-precision signed decimal arithmetic with exact scale control:
  ```java
  long days = ChronoUnit.DAYS.between(startDate, endDate);
  if (days <= 0) days = 1;
  BigDecimal totalAmount = item.getDailyPrice()
      .multiply(BigDecimal.valueOf(days))
      .setScale(2, RoundingMode.HALF_UP);
  ```
- Furthermore, the backend **never trusts client-calculated totals**. The frontend calculates and displays a live estimate for UX, but the backend recalculates `totalAmount` authoritatively during `createRental()`.

---

### Q4: How is booking date overlap prevented in the database and service?
**Answer:**
- In peer-to-peer rentals, two borrowers must never be approved for the same physical asset during intersecting dates.
- The mathematical condition for two date ranges `[A_start, A_end]` and `[B_start, B_end]` overlapping is:
  $$\text{Overlap} \iff (A_{start} \le B_{end}) \land (A_{end} \ge B_{start})$$
- In `RentalRepository.java`, we implemented the JPQL query:
  ```java
  @Query("""
      SELECT COUNT(r) > 0 FROM Rental r
      WHERE r.item.id = :itemId
        AND r.status = 'APPROVED'
        AND (r.startDate <= :endDate AND r.endDate >= :startDate)
        AND (:excludeRentalId IS NULL OR r.id != :excludeRentalId)
  """)
  boolean existsOverlappingApprovedRental(
      @Param("itemId") Long itemId,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate,
      @Param("excludeRentalId") Long excludeRentalId
  );
  ```
- When an owner clicks "Approve", the `RentalService` executes this query before changing status. If an overlap is detected, it throws a `ConflictException("Item is already booked for these dates")` with HTTP status `409 Conflict`.
- Note: Multiple borrowers can submit `REQUESTED` inquiries for the same dates; the owner decides which one to accept, and approving one automatically disallows conflicting approvals.

---

### Q5: Explain the Rental State Machine and its transition guards.
**Answer:**
The rental lifecycle follows a strictly enforced finite state machine (FSM):

```
       +------------------------------------+
       |             REQUESTED              |
       +------------------------------------+
           /                      \
Owner     /                        \ Borrower or Owner
Approves /                          \ Rejects / Cancels
        v                            v
+------------------+         +------------------+
|     APPROVED     |         | REJECTED / CANCEL|
+------------------+         +------------------+
        |
Borrower Returns Item &
Owner Confirms Receipt
        v
+------------------+
|     RETURNED     | --------> Unlocks 1 Review
+------------------+
```

**Guard Rules:**
1. A borrower cannot approve their own rental request (`UnauthorizedException`).
2. An owner cannot request to rent their own item (`BadRequestException: "Cannot rent your own item"`).
3. A rental can only transition to `RETURNED` if its current status is `APPROVED`.
4. A review can **only** be submitted if the rental is `RETURNED` (`BadRequestException: "Rental must be RETURNED before reviewing"`).
5. A borrower can only submit **one** review per completed rental (`ConflictException: "Rental already reviewed"`).
6. Cancelling is only permitted while status is `REQUESTED`.

---

### Q6: Why did you implement Soft-Delete for items instead of `DELETE FROM items`?
**Answer:**
- Items have historical relationships with financial transactions (`payments`), historical contracts (`rentals`), and peer feedback (`reviews`).
- If an owner deletes an item using SQL `DELETE`, either:
  1. Foreign key constraints fail (`ON DELETE RESTRICT`), preventing deletion.
  2. Cascade deletion destroys historical audit and rental records (`ON DELETE CASCADE`), violating financial recordkeeping.
- With soft-deletion, we add an `is_active` boolean column (`@Column(name = "is_active") private boolean active = true;`).
- When deleted, `item.setActive(false)` is saved.
- Search and browse queries include `WHERE i.active = true`, immediately hiding the item from new catalog searches.
- Meanwhile, past borrowers and the college administrator can still view historical rental invoices and past item details without orphaned foreign keys.

---

### Q7: How does your AI Chatbot / RAG System work?
**Answer:**
- Rather than sending arbitrary raw user prompts to an expensive LLM that hallucinates non-existent campus items, CampusShare uses a **Retrieval-Augmented Generation (RAG)** pipeline:
  1. **Intent & Token Extraction:** `ChatService` parses the user prompt for budget figures (e.g., "under $15", "max 20 dollars") and semantic item keywords (e.g., "calculator", "lab coat", "charger", "camera").
  2. **Catalog Grounding (Retrieval):** The system queries the `ItemRepository` for active items matching the category or keywords under the requested price limit.
  3. **Context Injection:** The real database records (Title, Daily Price, Condition, Category, Owner) are structured into a grounded context prompt.
  4. **Generation / Fallback:** 
     - If an OpenAI API key is configured in `application.yml`, the grounded context is sent to the LLM with a system prompt: *"Answer ONLY based on the provided campus items. Do not invent items."*
     - If no external API key is provided, the service uses an intelligent **deterministic local RAG engine** that summarizes the matched items, quotes the exact daily prices, and gives deep-links directly to the item detail page.
- This ensures the application works **100% offline without external API dependencies**, yet upgrades gracefully when an API key is provided.

---

### Q8: What caching strategy did you employ and why?
**Answer:**
- We integrated **Caffeine Cache** (Spring Boot starter cache) with `@EnableCaching`.
- **Cached Endpoints:**
  - `getAllCategories()` is annotated with `@Cacheable(value = "categories")` because campus item categories rarely change during runtime.
  - Active item listings and specific item details use `@Cacheable(value = "items", key = "#id")`.
- **Cache Eviction Strategy:**
  - Whenever an item is created, edited, soft-deleted, or its rental status changes, `ItemService` fires `@CacheEvict(value = "items", allEntries = true)`.
  - This guarantees that users never see stale inventory or outdated prices while eliminating redundant database I/O for 95% of read traffic.

---

### Q9: How is non-blocking asynchronous logging implemented?
**Answer:**
- `ActivityLogService` is annotated with `@Async` and `@Transactional(propagation = Propagation.REQUIRES_NEW)`.
- When an action occurs (user registered, item listed, rental approved, payment recorded), the controller invokes `logActivity()`.
- Spring's `ThreadPoolTaskExecutor` spawns the audit log persistence on a separate worker thread.
- **Benefit:** Auditing never slows down the primary HTTP request-response cycle, and if an audit log write encounters a lock, the user's primary transaction remains unaffected.

---

### Q10: How did you ensure database migration consistency between Local and Production?
**Answer:**
- We chose **Flyway** over Hibernate's `ddl-auto = update`.
- Hibernate's auto-DDL is prone to silent column type mismatch, cannot execute data transformations, and can accidentally drop constraints or data.
- Flyway executes timestamped/versioned migration scripts:
  - `V1__create_schema.sql`: Explicit DDL with `BIGINT`, `DECIMAL(10,2)`, Foreign Keys, and Indexing.
  - `V2__seed_initial_data.sql`: Seed data for categories, test users (admin, owners, students with BCrypt hashes), realistic college items, tags, and sample rentals.
- Both our local zero-config H2 (running in MySQL compatibility mode) and production MySQL 8 execute the exact same migration scripts upon startup.

---

## 3. Database Schema Quick-Reference for Viva

| Table Name | Primary Key | Key Foreign Keys | Key Attributes & Constraints |
|:---|:---|:---|:---|
| `users` | `id` (BIGINT) | None | `email` (UNIQUE), `password` (BCrypt), `role` (STUDENT/ADMIN), `active` |
| `categories` | `id` (BIGINT) | None | `name` (UNIQUE), `slug` (UNIQUE), `icon` |
| `items` | `id` (BIGINT) | `owner_id` -> `users.id`, `category_id` -> `categories.id` | `title`, `daily_price` (DECIMAL 10,2), `condition_state`, `is_active` |
| `tags` | `id` (BIGINT) | None | `name` (UNIQUE) |
| `item_tags` | `(item_id, tag_id)` | `item_id` -> `items.id`, `tag_id` -> `tags.id` | Composite Primary Key |
| `rentals` | `id` (BIGINT) | `borrower_id` -> `users.id`, `item_id` -> `items.id` | `start_date`, `end_date`, `total_amount` (DECIMAL 10,2), `status` |
| `payments` | `id` (BIGINT) | `rental_id` -> `rentals.id` (UNIQUE) | `amount` (DECIMAL 10,2), `payment_method`, `status` |
| `reviews` | `id` (BIGINT) | `rental_id` -> `rentals.id` (UNIQUE), `reviewer_id` -> `users.id` | `rating` (INT 1-5), `comment` |
| `activity_logs`| `id` (BIGINT) | `user_id` -> `users.id` | `action`, `details`, `timestamp` |

---

## 4. Key Differentiators to Highlight to Examiners

1. **Production-Grade Code Quality:**
   - 0 deprecated methods used in Spring Security 6 / Spring Boot 3 (`SecurityFilterChain` lambda DSL).
   - Strict server-side Bean Validation (`@Valid`, `@NotBlank`, `@DecimalMin`, `@FutureOrPresent`).
   - Clean centralized error handling via `@RestControllerAdvice` returning standard RFC 7807-style `ErrorResponse` objects with timestamps and HTTP status codes.

2. **Automated Test Coverage:**
   - **Backend:** 35 comprehensive automated JUnit 5 / MockMvc tests covering mathematical edge cases, state transitions, ownership permissions, and token validation.
   - **Frontend:** 8 automated React component tests verifying form validations, role-based route redirects, and real-time price preview calculations.
   - **End-to-End Suite:** 39 live integration tests running against the active REST API.

3. **User Experience & Accessibility:**
   - Mobile-responsive layout built with Tailwind CSS v4.
   - Accessible keyboard navigation and ARIA/id-label relationships.
   - Instant visual feedback: badge states, review rating stars, modal confirmation dialogs.
