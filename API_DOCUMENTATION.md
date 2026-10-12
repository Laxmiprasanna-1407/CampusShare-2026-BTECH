# 📚 CampusShare: REST API Documentation

This document provides complete, production-grade API specifications for the **CampusShare** Peer-to-Peer College Item Rental Platform backend.

**Base URL**: `http://localhost:8080/api`  
**Swagger UI**: `http://localhost:8080/swagger-ui.html`  
**OpenAPI Spec**: `http://localhost:8080/v3/api-docs`

---

## 🔒 1. Authentication & Headers

Protected endpoints require a JWT Bearer token in the `Authorization` request header:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Standard Error JSON Shape
Every failed request returns a consistent, structured error payload without stack traces or sensitive internals:
```json
{
  "timestamp": "2026-10-11T19:22:45.7635992",
  "status": 400,
  "error": "Validation Error",
  "message": "Validation failed for one or more fields",
  "path": "/api/auth/register",
  "details": [
    "email: Invalid email format",
    "password: Password must be at least 6 characters",
    "name: Name is required"
  ]
}
```

---

## 🔑 2. Authentication Endpoints

### 2.1 Register Student Account
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Description**: Creates a new student user with role `STUDENT`. Public registration cannot create `ADMIN`.
- **Request Body**:
```json
{
  "name": "Arjun Patel",
  "email": "arjun@campusshare.edu",
  "password": "Password123!",
  "phone": "+91 9876543210",
  "collegeId": "22BCSE045"
}
```
- **Response** (`201 Created`):
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "name": "Arjun Patel",
    "email": "arjun@campusshare.edu",
    "role": "STUDENT",
    "phone": "+91 9876543210",
    "collegeId": "22BCSE045",
    "enabled": true,
    "createdAt": "2026-10-11T19:15:00"
  }
}
```

### 2.2 Authenticate & Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "arjun@campusshare.edu",
  "password": "Password123!"
}
```
- **Response** (`200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "name": "Arjun Patel",
    "email": "arjun@campusshare.edu",
    "role": "STUDENT",
    "enabled": true
  }
}
```

### 2.3 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated
- **Response** (`200 OK`): Returns `UserDto`.

---

## 📦 3. Catalog & Items Endpoints

### 3.1 Search & Filter Items
- **Endpoint**: `GET /api/items`
- **Access**: Public
- **Query Parameters**:
  - `keyword` *(optional)*: Search string matching title or description
  - `categoryId` *(optional)*: Category ID filter
  - `available` *(optional)*: `true` or `false`
  - `maxPrice` *(optional)*: Maximum daily rate limit (₹)
  - `sort` *(optional)*: e.g. `createdAt,desc`, `dailyPrice,asc`, `dailyPrice,desc`
  - `page` *(optional, default 0)*: Zero-indexed page number
  - `size` *(optional, default 12)*: Elements per page
- **Response** (`200 OK`):
```json
{
  "content": [
    {
      "id": 101,
      "title": "Casio fx-991EX Scientific Calculator",
      "description": "Natural textbook display, ideal for calculus exams",
      "dailyPrice": 25.00,
      "deposit": 150.00,
      "condition": "LIKE_NEW",
      "available": true,
      "isDeleted": false,
      "owner": {
        "id": 1,
        "name": "Arjun Patel",
        "email": "arjun@campusshare.edu",
        "collegeId": "22BCSE045"
      },
      "category": {
        "id": 1,
        "name": "Calculators",
        "icon": "Calculator"
      },
      "tags": ["Engineering", "Calculus", "Exam Ready"],
      "averageRating": 4.9,
      "totalReviews": 8,
      "createdAt": "2026-10-11T18:00:00"
    }
  ],
  "pageNumber": 0,
  "pageSize": 12,
  "totalElements": 24,
  "totalPages": 2,
  "isLast": false
}
```

### 3.2 Get Item Details by ID
- **Endpoint**: `GET /api/items/{id}`
- **Access**: Public
- **Response** (`200 OK`): Single `ItemResponse` object.

### 3.3 Create New Item Listing
- **Endpoint**: `POST /api/items`
- **Access**: Authenticated (`STUDENT` or `ADMIN`)
- **Request Body**:
```json
{
  "title": "Digital Multimeter with Probes",
  "categoryId": 3,
  "dailyPrice": 35.00,
  "deposit": 100.00,
  "condition": "GOOD",
  "imageUrl": "https://example.com/multimeter.jpg",
  "description": "Accurate multimeter for ECE and Physics lab experiments",
  "tags": ["ECE", "Lab Essential", "Engineering"]
}
```
- **Response** (`201 Created`): Returns created `ItemResponse`.

### 3.4 Update Item Listing
- **Endpoint**: `PUT /api/items/{id}`
- **Access**: Owner only (or `ADMIN`)
- **Response** (`200 OK`): Returns updated `ItemResponse`.

### 3.5 Delete Item Listing
- **Endpoint**: `DELETE /api/items/{id}`
- **Access**: Owner only (or `ADMIN`)
- **Behavior**: Performs **soft-deletion** (`is_deleted = true`, `available = false`) to preserve past rental records and reviews.
- **Response** (`204 No Content`).

---

## 🤝 4. Rentals Endpoints

### 4.1 Create Rental Request
- **Endpoint**: `POST /api/rentals`
- **Access**: Authenticated (Borrower)
- **Business Rules Enforced**:
  - Student cannot rent their own item (`HTTP 400`).
  - Item must be available (`HTTP 400`).
  - `startDate` cannot be in the past (`HTTP 400`).
  - `endDate` cannot precede `startDate` (`HTTP 400`).
  - Overlap check: Item cannot overlap an already `APPROVED` rental (`HTTP 409`).
  - Server calculation: `totalAmount = dailyPrice * totalDays` (calculated via `BigDecimal`).
- **Request Body**:
```json
{
  "itemId": 101,
  "startDate": "2026-11-01",
  "endDate": "2026-11-03"
}
```
- **Response** (`201 Created`):
```json
{
  "id": 501,
  "item": {
    "id": 101,
    "title": "Casio fx-991EX Scientific Calculator",
    "dailyPrice": 25.00,
    "categoryName": "Calculators"
  },
  "borrower": {
    "id": 2,
    "name": "Priya Singh",
    "email": "priya@campusshare.edu"
  },
  "startDate": "2026-11-01",
  "endDate": "2026-11-03",
  "totalDays": 3,
  "totalAmount": 75.00,
  "status": "PENDING",
  "payment": null,
  "review": null,
  "createdAt": "2026-10-11T19:30:00"
}
```

### 4.2 Status Transitions
| Endpoint | Method | Allowed Caller | Valid From Status | New Status | Description |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `/api/rentals/{id}/approve` | `PATCH` | Item Owner | `PENDING` | `APPROVED` | Approves request, verifies overlap, initializes pending payment row. |
| `/api/rentals/{id}/reject` | `PATCH` | Item Owner | `PENDING` | `REJECTED` | Rejects request with optional reason in body `{"reason": "Clash"}`. |
| `/api/rentals/{id}/return` | `PATCH` | Item Owner | `APPROVED` | `RETURNED` | Confirms item has been handed back on campus. |
| `/api/rentals/{id}/cancel` | `PATCH` | Borrower | `PENDING` | `CANCELLED` | Cancels pending request prior to owner decision. |

---

## 💳 5. Payment & Review Endpoints

### 5.1 Mark Payment as Paid
- **Endpoint**: `PATCH /api/rentals/{id}/payment/paid`
- **Access**: Item Owner or `ADMIN`
- **Condition**: Rental status must be `APPROVED` or `RETURNED`.
- **Response** (`200 OK`): Sets payment status to `PAID` with generated transaction reference (e.g. `SIM-UPI-A1B2C3D4`).

### 5.2 Submit Rental Review
- **Endpoint**: `POST /api/rentals/{id}/review`
- **Access**: Borrower only
- **Condition**: Rental status must be `RETURNED`. Exactly 1 review per rental.
- **Request Body**:
```json
{
  "rating": 5,
  "comment": "Calculator was in mint condition. The owner met me right at the library on time!"
}
```
- **Response** (`201 Created`): Updates item's average rating and returns `ReviewResponse`.

---

## 🤖 6. AI Chatbot Endpoint

### 6.1 Query CampusShare Assistant
- **Endpoint**: `POST /api/chat`
- **Access**: Public
- **Request Body**:
```json
{
  "message": "Is there a scientific calculator under Rs.30 per day?",
  "history": []
}
```
- **Response** (`200 OK`):
```json
{
  "answer": "Here are the relevant items found in our campus catalog:\n\n• **Casio fx-991EX Scientific Calculator** — ₹25.00/day (Calculators)\n\nYou can click on any item above to view details and submit a rental request.",
  "fallbackNotice": "AI is not configured; showing search results",
  "configured": false,
  "retrievedItems": [
    {
      "id": 101,
      "title": "Casio fx-991EX Scientific Calculator",
      "dailyPrice": 25.00,
      "categoryName": "Calculators"
    }
  ]
}
```

---

## 🛡️ 7. Administrator Endpoints (`ADMIN` Role Only)

Protected by `@PreAuthorize("hasRole('ADMIN')")`. Students receive `HTTP 403 Forbidden`.

- `GET /api/admin/stats` — Platform counters: total users, students, catalog items, active items, rentals by status, and total revenue.
- `GET /api/admin/users?page=0&size=15` — Directory of all registered users with account statuses.
- `PATCH /api/admin/users/{id}/disable` — Body: `{"enabled": false}` to toggle user account access.
- `GET /api/admin/rentals?page=0&size=15` — Platform-wide ledger of all rental bookings.
- `GET /api/admin/payments?page=0&size=15` — Platform-wide ledger of all recorded payments.
