# 🚀 CampusShare: Cloud Deployment Guide

> **Honesty & Transparency Notice**:  
> In adherence with academic integrity guidelines, cloud deployments on external platforms (Vercel, Netlify, Render, Railway) are marked **NOT TESTED** in this report unless actively provisioned with live credit card billing. The configuration files, multi-stage Dockerfiles, SPA redirect rules, and environment checklists below are fully prepared and tested locally.

---

## ☁️ 1. Architecture & Platform Selections

| Layer | Recommended Free / Hobby Platform | Deployment Method | Free-Tier Limits & Reality |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** or **Netlify** | Static SPA (Vite output `dist`) | **Generous Free Tier**: 100GB bandwidth, free custom domains, automatic HTTPS. |
| **Backend** | **Render** or **Railway** | Multi-stage Docker Container | **Render Free Tier**: Spins down after 15 minutes of inactivity (50s cold start). 512MB RAM. **Railway**: Offers trial credits. |
| **Database** | **Railway MySQL** or **Aiven / PlanetScale** | Managed MySQL 8.0 Instance | **Important Warning**: Render does **not** provide a free MySQL database (Render only provides free PostgreSQL). Use Railway or Aiven for managed MySQL. |

---

## 📋 2. Complete Cloud Environment Variables Checklist

Ensure these environment variables are configured in your backend cloud dashboard:

| Variable Name | Required | Example Cloud Value | Description |
| :--- | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Yes | `prod` | Activates external MySQL and production security rules |
| `SERVER_PORT` | Yes | `8080` or `${PORT}` | Server port assigned by host |
| `SPRING_DATASOURCE_URL` | Yes | `jdbc:mysql://junction.proxy.rlwy.net:12345/railway?useSSL=true&serverTimezone=UTC` | Managed MySQL connection URL |
| `SPRING_DATASOURCE_USERNAME` | Yes | `root` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Yes | `StrongGeneratedPass2026!` | Database password |
| `JWT_SECRET` | Yes | `7f8a9b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd` | **MUST** be at least 32 characters (256-bit). App refuses to start in `prod` with weak/default key! |
| `JWT_EXPIRATION_MS` | No | `86400000` | 24 hours in milliseconds |
| `ADMIN_EMAIL` | Yes | `admin@campusshare.edu` | Seeded admin email |
| `ADMIN_PASSWORD` | Yes | `UltraSecureAdmin#2026` | Seeded admin password |
| `ADMIN_NAME` | No | `Campus Administrator` | Display name of system administrator |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://campusshare.vercel.app` | **Exact URL of deployed frontend** (no trailing slash) |
| `LLM_API_KEY` | Optional | `sk-proj-...` | OpenAI API key for AI Chatbot (leave blank for RAG search fallback) |
| `LLM_API_URL` | No | `https://api.openai.com/v1/chat/completions` | Provider completion endpoint |
| `LLM_MODEL` | No | `gpt-3.5-turbo` | OpenAI model identifier |

Frontend Cloud Dashboard Environment Variable:
| Variable Name | Required | Example Cloud Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | `https://campusshare-backend.onrender.com` | Target URL of deployed backend REST API |

---

## 🌐 3. Frontend Deployment (Vercel & Netlify)

Vite is a Single Page Application (SPA). Without rewrite rules, deep links like `/items/10` or `/my-rentals` will return a 404 on page refresh.

### Vercel Setup
1. Push repository to GitHub.
2. Import project into Vercel dashboard, selecting `frontend` as Root Directory.
3. Build command: `npm run build` | Output directory: `dist`.
4. Environment variable: `VITE_API_BASE_URL=https://your-backend-service.com`.
5. The bundled `frontend/vercel.json` automatically rewrites all routes to `/index.html`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify Setup
The project includes `frontend/public/_redirects`:
```
/*    /index.html   200
```
This is automatically copied into the root of `dist/` upon building, guaranteeing zero 404 routing errors.

---

## 🐳 4. Backend Deployment (Render via Docker)

1. Create a new **Web Service** on Render connected to your repository.
2. Select **Docker** environment and set Root Directory to `backend`.
3. Render automatically detects `backend/Dockerfile`.
4. Add all environment variables listed in Section 2 above.
5. Set Health Check path to `/actuator/health`.
6. Update backend `CORS_ALLOWED_ORIGINS` to match your Vercel/Netlify frontend URL.

---

## ✅ 5. Post-Deployment Verification Checklist

Once deployed to production URLs, execute the following verification steps in sequence:

- [ ] **1. Actuator Health**: Navigate to `https://<backend-url>/actuator/health`. Verify `{"status": "UP"}`.
- [ ] **2. Swagger Documentation**: Navigate to `https://<backend-url>/swagger-ui.html`. Verify endpoints render without CORS errors.
- [ ] **3. Frontend Load & SEO**: Open `https://<frontend-url>`. Verify hero banner, typography, and category icons load immediately.
- [ ] **4. Registration & Login**:
  - Register a new student account (`newstudent@campusshare.edu`).
  - Verify JWT is returned and stored in browser storage.
  - Test login with seeded admin credentials.
- [ ] **5. Item Creation**: As student, post a new item listing with daily rate ₹25. Verify it appears in `/items`.
- [ ] **6. Rental Booking Flow**:
  - Log in as second student, book the newly listed item for 3 days.
  - Verify live calculated preview displays `₹75.00`.
  - Submit request.
  - Switch accounts to owner, approve the request.
  - Verify overlap check blocks conflicting bookings for the same dates.
  - Mark payment as `PAID` and rental as `RETURNED`.
  - As borrower, submit a 5-star review. Verify item average rating updates to `5.0`.
- [ ] **7. Administrative Protection**:
  - As student, attempt accessing `/admin` -> verify automatic redirect.
  - As admin, access `/admin` -> verify user management table, platform rentals, and Actuator metrics display live data.
- [ ] **8. AI Chatbot**:
  - Query "Is there a calculator under Rs.30 per day?".
  - Verify prompt answers with the matching item or displays the clear fallback notice if no external key is attached.
