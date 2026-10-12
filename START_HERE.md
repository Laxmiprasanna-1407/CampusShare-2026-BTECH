# 🚀 START_HERE: Quickstart & Run Guide

Welcome to **CampusShare** — the peer-to-peer college item rental platform built for university students to share calculators, textbooks, lab equipment, and hardware accessories.

---

## ⚡ 1. Fastest Run (Zero Setup Required)

CampusShare is pre-configured with a **`local` profile** using an embedded **H2 database in MySQL mode** and Flyway migrations. You do **not** need to install MySQL or Docker to run and test everything immediately.

### On Windows
Double-click or execute from the terminal:
```cmd
run.bat
```
To stop all services:
```cmd
stop.bat
```

### On Linux / macOS
Ensure scripts are executable and run:
```bash
chmod +x run.sh stop.sh backend/mvnw
./run.sh
```
To stop all services:
```bash
./stop.sh
```

---

## 🌐 2. Access URLs & Demo Accounts

Once started, open your web browser:

| Application / Resource | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Full React 19 UI with student & admin views |
| **Backend REST API** | [http://localhost:8080](http://localhost:8080) | Spring Boot REST API |
| **Swagger OpenAPI UI** | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | Interactive API documentation |
| **Actuator Health** | [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health) | Live Spring Boot health status |

### Pre-Configured Demo Credentials

The platform provides quick-fill demo buttons directly on the **Sign In** page:

| Role | Email | Password | Permissions & Relationship |
| :--- | :--- | :--- | :--- |
| **Student (Owner / Borrower)** | `student1@campusshare.edu` | `Password123!` | List items, request rentals, manage requests, review returned rentals |
| **Administrator** | `admin@campusshare.edu` | `Admin@Campus2026!` | Access `/admin` dashboard, enable/disable users, monitor revenue and system health |

---

## 📋 3. System Prerequisites

| Tool | Minimum Version | Verified In Environment |
| :--- | :--- | :--- |
| **Java JDK** | 21 LTS | OpenJDK / Oracle JDK 21 |
| **Node.js** | 20.x or 24.x | v24.13.1 |
| **npm** | 10.x or 11.x | 11.8.0 |
| **Maven** | Not required | Bundled Maven Wrapper (`mvnw` / `mvnw.cmd`) |
| **Docker & Docker Compose** | Optional | Only needed if running on real MySQL container |

---

## 🛠️ 4. Manual Step-by-Step Run

If you prefer launching each service in its own terminal window:

### Step 1: Environment Configuration
```bash
# If .env does not exist, copy from .env.example
copy .env.example .env    # Windows
cp .env.example .env      # Linux/macOS
```

### Step 2: Start Backend
```bash
cd backend
# Windows:
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
# Linux/macOS:
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
Wait until you see: `Started CampusShareApplication in X seconds`.

### Step 3: Start Frontend
In a second terminal:
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🧪 5. Running Automated Verification Suites

### Run All Backend Tests (JUnit 5 + Mockito + Spring Boot):
```bash
cd backend
mvnw.cmd test          # Windows
./mvnw test            # Linux/macOS
```
*(35 tests covering calculations, overlap prevention, status transitions, ownership checks, JWT/BCrypt, and mocked LLM)*

### Run Frontend Unit Tests (Vitest + RTL):
```bash
cd frontend
npm test
```
*(8 tests covering forms, validation, protected routes, live price preview, and error boundaries)*

### Run Live End-to-End API Test Suite:
Ensure the backend is running on `http://localhost:8080`, then run:
```bash
node test_e2e.js
```
*(39 live checks verifying student registration, rental booking, overlap lock, simulated payment, return, review, and admin security)*

---

## 🔧 6. Troubleshooting Table

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Port 8080 is already in use** | Another service or previous Java process is bound to port 8080. | Run `stop.bat` (Windows) or `pkill -f "campusshare-backend"` (Linux/Mac). Alternatively, terminate via PID: `netstat -ano \| findstr 8080` then `taskkill /F /PID <PID>`. |
| **Port 5173 is already in use** | Another Vite instance is running. | Run `stop.bat` or kill the node process. Vite will also offer to increment to port 5174. |
| **Java version error (`UnsupportedClassVersionError`)** | Running Java 17 or older instead of Java 21. | Verify your Java version using `java -version`. Ensure JAVA_HOME points to a JDK 21 installation. |
| **Node.js version mismatch** | Old Node version (< 18). | Run `node -v` and update Node to version 20 LTS or higher. |
| **`mvnw: Permission denied`** | Maven wrapper script missing execution permissions on Unix/Linux. | Run `chmod +x backend/mvnw` and re-run. |
| **Line ending error (`^M: bad interpreter`)** | Shell script has Windows CRLF line endings on Linux. | Run `sed -i -e 's/\r$//' run.sh stop.sh backend/mvnw`. |
| **`docker` command not recognized** | Docker Desktop is not installed or not added to PATH. | The default `local` profile uses H2 in MySQL mode specifically so Docker is not required. You do not need Docker to run CampusShare! |
| **MySQL connection refused (`Connection to localhost:3306 refused`)** | Profile is set to `docker` or `prod` without a running MySQL instance. | Change `SPRING_PROFILES_ACTIVE=local` in your `.env` file to use the zero-dependency embedded database. |
| **AI Assistant shows "AI is not configured; showing search results"** | `LLM_API_KEY` is not set in `.env`. | This is the expected, graceful fallback! The system searches campus database listings directly without incurring API charges. To enable OpenAI completions, set `LLM_API_KEY=sk-...` in `.env`. |
