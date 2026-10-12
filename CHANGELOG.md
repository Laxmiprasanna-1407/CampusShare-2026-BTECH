# Changelog

All notable changes to the **CampusShare** Peer-to-Peer College Item Rental Platform project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-11

### Added
- **Core Architecture & Persistence**:
  - Flyway versioned database migrations (`V1__create_schema.sql`, `V2__seed_initial_data.sql`) supporting MySQL 8 and H2 MySQL mode.
  - All four required JPA mappings:
    - `@ManyToOne`: `Item` -> `User` owner, `Rental` -> `User` borrower, `Item` -> `Category`, `Review` -> `Item`, `Review` -> `User` reviewer.
    - `@OneToMany`: `User` -> `Item` listings, `Item` -> `Rental` requests.
    - `@OneToOne`: `Rental` -> `Payment`, `Rental` -> `Review`.
    - `@ManyToMany`: `Item` <-> `Tag` joined via `item_tags`.
  - Indexes on `users(email)`, `items(category_id, available)`, and `rentals(item_id, start_date, end_date)`.
- **Security & Authorization**:
  - Spring Security stateless architecture with JWT authentication, custom `JwtAuthenticationFilter`, and BCrypt password encryption.
  - Role-based authorization (`STUDENT` and `ADMIN`) with `@PreAuthorize` method security.
  - Automatic administrative seeding from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), forbidding hard-coded credentials.
  - Strict server-side ownership checks on item editing/deleting, rental approvals, cancellations, and reviews.
  - Production profile startup safety assertion enforcing high-entropy 256-bit JWT secret.
- **Rental Business Logic**:
  - Server-side financial calculation using `BigDecimal` (`dailyPrice * totalDays`), forbidding client-submitted pricing trust.
  - Date validation enforcing non-past start dates, valid chronology, and minimum 1-day rental durations.
  - Strict date overlap prevention preventing two `APPROVED` bookings from colliding on the same item.
  - State machine rental status transitions:
    - `PENDING` -> `APPROVED` or `REJECTED` (Owner only)
    - `APPROVED` -> `RETURNED` (Owner only)
    - `PENDING` -> `CANCELLED` (Borrower only)
- **Simulated Payment & Reviews**:
  - Simulated peer-to-peer payment tracking with unique `SIM-UPI-` transaction references.
  - Post-return review submissions (1 to 5 stars + comments) restricted strictly to borrowers with automatic item rating average updates.
  - Soft-deletion for items to guarantee historical integrity for rentals, payments, and reviews.
- **AI Chatbot with RAG Basics**:
  - "CampusShare Assistant" endpoint querying active campus database items via keyword and price filtering.
  - System prompt engineering instructing LLM to answer strictly from catalog context and enforce token limits.
  - Intelligent fallback mechanism returning database search results with a clear notice when no `LLM_API_KEY` is provided.
- **Frontend Web Application (React 19 + Vite + Tailwind CSS v4)**:
  - Centralized Axios client with request interceptor adding JWT `Authorization: Bearer` headers.
  - React Router v7 navigation with Protected Routes, Admin Routes, and Error Boundaries.
  - 12 comprehensive student-friendly pages: Landing, Login, Register, Browse/Search with filters, Item Details with live price preview, Add/Edit Item, My Items, Incoming Requests, My Rentals, AI Chat Assistant with Markdown rendering, Admin Dashboard with Actuator health, and 404 Page.
  - Interactive modals for editing, deletion, cancellations, rejections, and reviews.
- **DevOps & Testing**:
  - 35 backend tests (JUnit 5 + Mockito + Spring Boot integration tests) - 100% pass rate.
  - 8 frontend Vitest + React Testing Library unit tests - 100% pass rate.
  - 39-point live end-to-end API test script (`test_e2e.js`) - 100% pass rate.
  - Multi-stage Dockerfiles for backend and frontend, plus `docker-compose.yml` with MySQL 8 health checks.
  - One-click runner and stopper scripts (`run.bat`, `run.sh`, `stop.bat`, `stop.sh`).
