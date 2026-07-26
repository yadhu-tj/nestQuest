# NestQuest — Full Development Plan

> **Goal:** Build the complete NestQuest application — an AI-powered rental & real estate matchmaker with RAG-based natural language search — as specified in `PROJECT_CONTEXT.md`.

---

## Current State Assessment

The project has **scaffolding only** — Flask app factory, placeholder routes, stub services, and a single-page React frontend. Nearly all business logic, the RAG pipeline, and the full UI remain to be built.

### Key Gaps vs. Spec

| Area | Issue |
|---|---|
| **DB Models** | Missing `Administrator`, `Broker` tables; `Property` missing 7+ columns; `PropertyImage` missing entirely |
| **Auth** | Uses `werkzeug` hashing instead of `bcrypt`; no real DB operations; roles are `tenant` instead of `user` |
| **API Prefix** | Currently `/api/` — spec requires `/api/v1/` |
| **Response Format** | Not using standard `{success, data, message}` envelope |
| **RAG Pipeline** | Empty stubs — no ChromaDB, no LangChain, no embedding service |
| **Admin Module** | Doesn't exist |
| **Image Upload** | Not implemented |
| **Frontend** | No routing, no pages, no auth context, no API layer |

---

## Resolved Decisions

These open questions are answered here. Do not re-litigate them during implementation.

**1. PostgreSQL:** Must be installed and a `nestquest` database created before Phase 1. No SQLite fallback — ever.

**2. Gemini API Key:** Must be in `.env` before Phase 4. The RAG pipeline will not run without it.

**3. Frontend Styling:** Keep Tailwind CSS — it is already installed. Do not switch to vanilla CSS.

**4. Admin Creation:** No admin registration route. The first admin is created via a `seed_admin.py` seed script that writes directly to the `administrator` table. There is no UI for admin registration.

**5. Folder Structure:** Restructure to match the spec exactly — `backend/models/`, `backend/routes/`, `backend/services/`, `backend/utils/`. The current `app/modules/` layout will be replaced.

**6. Login Role Detection:** The login endpoint queries all three tables (Administrator, Broker, User) by email. The first match determines the role. No role selector on the login form — one form, one endpoint, role is detected server-side and returned in the JWT.

**7. Image Uploads:** Max file size 5MB. Allowed types: jpg, jpeg, png, webp only. Validated server-side before saving. Upload path: `backend/static/uploads/properties/<property_id>/`.

---

## Phases Overview

```
Phase 1: DB Schema & Config
      │
      ▼
Phase 2: Auth & RBAC
      │
      ├──────────────────────┐
      ▼                      ▼
Phase 3: Properties,    Phase 5: Frontend
         Bookings,             Foundation
         Admin                 │
      │                        ▼
      ▼                   Phase 6: Frontend
Phase 4: RAG Pipeline          Pages
      │                        │
      └──────────┬─────────────┘
                 ▼
          Phase 7: Integration
                 & Polish
```

> **Phases 1 → 2 → 3 → 4** are sequential — each depends on the prior.
> **Phase 5** can start in parallel after Phase 2 is complete.
> **Phase 6** requires Phases 3, 4, and 5 to all be complete.
> **Phase 7** is the final integration pass.

---

## Phase 1: Backend Foundation & Database Schema

Fix the core backend to match the spec before building any features.

---

#### [MODIFY] `backend/config.py`
- PostgreSQL only — no SQLite fallback
- Load `DATABASE_URL`, `JWT_SECRET_KEY`, `GEMINI_API_KEY`, `CHROMA_PERSIST_PATH`, `UPLOAD_FOLDER` from `.env`
- Two config classes: `DevelopmentConfig`, `ProductionConfig`

#### [MODIFY] `backend/models/`
Complete rewrite to match spec schema exactly. One file per model.

- **`administrator.py`** — `admin_id (SERIAL PK)`, `admin_name`, `email (UNIQUE)`, `password`, `created_at`
- **`broker.py`** — `broker_id (SERIAL PK)`, `broker_name`, `email (UNIQUE)`, `phone`, `password`, `company_name`, `created_at`
- **`user.py`** — Table name: `users` (not `user` — reserved keyword in PostgreSQL). Fields: `user_id (SERIAL PK)`, `user_name`, `email (UNIQUE)`, `phone`, `password`, `created_at`
- **`property.py`** — `property_id (SERIAL PK)`, `broker_id (FK→broker ON DELETE CASCADE)`, `title`, `description`, `broker_notes`, `property_type`, `price`, `location`, `bedrooms`, `bathrooms`, `area_sqft`, `availability_status (DEFAULT 'Available')`, `created_at`
- **`property_image.py`** — `image_id (SERIAL PK)`, `property_id (FK→property ON DELETE CASCADE)`, `image_url`
- **`booking.py`** — `booking_id (SERIAL PK)`, `user_id (FK→users ON DELETE CASCADE)`, `property_id (FK→property ON DELETE CASCADE)`, `booking_date`, `visit_date`, `status (DEFAULT 'Pending')`

#### [MODIFY] `backend/requirements.txt`
Ensure all of these are present:
```
flask
flask-sqlalchemy
flask-jwt-extended
flask-cors
flask-bcrypt
psycopg2-binary
python-dotenv
chromadb
langchain
langchain-google-genai
google-generativeai
```

#### [MODIFY] `backend/.env`
```env
DATABASE_URL=postgresql://username:password@localhost:5432/nestquest
JWT_SECRET_KEY=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
CHROMA_PERSIST_PATH=./chroma_store
UPLOAD_FOLDER=./static/uploads/properties
FLASK_ENV=development
```
Add `.env` to `.gitignore` immediately. Never commit it.

#### [MODIFY] `backend/app.py`
- Register all blueprints under `/api/v1/` prefix
- Configure CORS: `CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})`
- Configure static file serving for image uploads
- Import and init `flask-bcrypt`, `flask-jwt-extended`

#### [NEW] `backend/utils/seed_admin.py`
Standalone script to create the first administrator directly in the DB:
```python
# Run once: python utils/seed_admin.py
# Creates admin: admin@nestquest.com / admin123
```
Not a route. Not accessible via API.

#### [NEW] `backend/utils/seed_properties.py`
Seed script with **at least 20 diverse mock properties** with varied `broker_notes`.
Notes must include lifestyle keywords like "pet-friendly", "quiet area", "near IT park",
"suitable for students", "family friendly", "good ventilation", "safe locality" etc.
This is critical — the RAG search is meaningless without a rich corpus to search against.
Run after Phase 4 is complete and ChromaDB is ready.

---

## Phase 2: Authentication & Authorization

Build real auth with role-based access control. All phases depend on this being correct.

---

#### [NEW] `backend/utils/responses.py`
Standard response helpers used by every route:
```python
def success_response(data, message="Success", status_code=200): ...
def error_response(message="Error", status_code=400): ...
```
All routes must use these. No ad-hoc JSON responses anywhere.

#### [NEW] `backend/utils/decorators.py`
- `role_required(*roles)` — Decorator that validates JWT role claim against allowed roles
- Returns `403` with standard error envelope on unauthorized access

#### [MODIFY] `backend/routes/auth.py`
- `POST /api/v1/auth/register` — Register as `user` or `broker` (role in request body). Hash password with bcrypt. Save to correct table.
- `POST /api/v1/auth/login` — Query Administrator → Broker → User tables in order by email. First match wins. Return JWT containing `role`, `id`, `email`. No role selector on frontend — server detects role.
- `GET /api/v1/auth/me` — Return current user profile decoded from JWT. Role-aware response.
- All responses use `success_response` / `error_response`.

---

## Phase 3: Core Backend Features

Implement all CRUD operations with proper role enforcement. Always extract `broker_id` / `user_id` from JWT — never trust IDs from the request body.

---

#### [MODIFY] `backend/routes/property.py`
- `GET /api/v1/properties/` — List properties (public, with optional query filters)
- `GET /api/v1/properties/<id>` — Get single property with all images
- `POST /api/v1/properties/` — Broker creates property. After saving to PostgreSQL, trigger `embed_property()` to sync ChromaDB. `broker_id` from JWT only.
- `PUT /api/v1/properties/<id>` — Broker updates own property. If `description` or `broker_notes` changed, trigger `update_property_embedding()`. Broker can only update their own properties.
- `DELETE /api/v1/properties/<id>` — Broker deletes own property. Before deletion: cancel all `Pending` bookings for this property. After deletion: call `delete_property_embedding()`.
- `POST /api/v1/properties/<id>/images` — Upload images. Validate: max 5MB, allowed types jpg/jpeg/png/webp only. Save to `static/uploads/properties/<property_id>/`. Store relative path in `property_image` table.
- `PATCH /api/v1/properties/<id>/availability` — Toggle `availability_status`. **No ChromaDB update needed** — availability is PostgreSQL only.

#### [MODIFY] `backend/routes/booking.py`
- `POST /api/v1/bookings/` — User books a visit. Validate property `availability_status = 'Available'` before creating. `user_id` from JWT.
- `GET /api/v1/bookings/` — Users see own bookings. Brokers see bookings for their own properties.
- `PATCH /api/v1/bookings/<id>/status` — Broker confirms or cancels a booking. Valid transitions: `Pending → Confirmed`, `Pending → Cancelled`, `Confirmed → Completed`, `Confirmed → Cancelled`.
- `GET /api/v1/bookings/<id>` — Get booking details (user sees own, broker sees for own properties).

#### [NEW] `backend/routes/admin.py`
All routes: `role_required('admin')`.
- `GET /api/v1/admin/brokers` — List all brokers
- `DELETE /api/v1/admin/brokers/<id>` — Remove broker (cascades to their properties and bookings)
- `GET /api/v1/admin/users` — List all users
- `DELETE /api/v1/admin/users/<id>` — Remove user
- `GET /api/v1/admin/properties` — List all properties across all brokers
- `GET /api/v1/admin/reports` — Dashboard stats: total properties, available properties, total bookings, pending bookings, total users, total brokers

---

## Phase 4: RAG Pipeline — The Core AI Feature

The most critical phase. Follow the pipeline exactly as specified. Do not deviate.

---

#### [NEW] `backend/services/embedding_service.py`
ChromaDB sync layer. All ChromaDB operations live here and nowhere else.

- `init_chroma()` — Initialize persistent ChromaDB client from `CHROMA_PERSIST_PATH`. Collection name: `nestquest_properties`.
- `_sanitize_text(title, description, broker_notes)` — Always use this before embedding:
  ```python
  return f"{title}. {description or ''}. {broker_notes or ''}".strip()
  ```
  Never pass None or empty string to the embedding model.
- `embed_property(property_id, title, description, broker_notes)` — Sanitize text → generate embedding → store in ChromaDB with metadata `{"property_id": str(property_id)}`.
- `update_property_embedding(property_id, title, description, broker_notes)` — Delete old vector → insert new vector.
- `delete_property_embedding(property_id)` — Remove from ChromaDB by `property_id` metadata.
- `semantic_search(query_text, available_property_ids, top_k=5)` — Embed query → search ChromaDB **constrained to `available_property_ids`** using `where` metadata filter → return list of matching `property_id`s in ranked order.

#### [MODIFY] `backend/services/rag_service.py`
Full 10-step RAG pipeline. This is the exact sequence — do not reorder:

1. Receive `query` string from search route.
2. Validate `query` is not empty — raise error if blank.
3. Query PostgreSQL: `SELECT property_id FROM property WHERE availability_status = 'Available'`.
4. If result is empty → return early: `"No properties are currently available."`. Do not proceed.
5. Call `embedding_service.semantic_search(query, available_ids, top_k=5)`.
6. If zero matches → return early: `"No properties matched your search. Try different keywords."`.
7. Hydrate full property details from PostgreSQL for the matched IDs (price, location, images, etc.). ChromaDB does not store full details.
8. Assemble LangChain prompt: user query + retrieved property context.
9. Call Gemini via LangChain for AI match explanations. If Gemini call fails → set `ai_explanation: null` for all results. Do not crash or raise.
10. Return ranked list of properties with `ai_explanation` field per property.

#### [MODIFY] `backend/services/gemini_service.py`
- Use `ChatGoogleGenerativeAI` from `langchain-google-genai` — not the raw Gemini SDK.
- Model: `gemini-1.5-flash` (default) or `gemini-1.5-pro`.
- Prompt template must instruct Gemini to explain specifically why each property matches the user query based on the retrieved context.
- Wrap in try/except — return `None` on any API failure (graceful degradation).

#### [MODIFY] `backend/routes/search.py`
- `POST /api/v1/search/` — JWT required (`user` role). Validate query not empty (400 if blank). Call `rag_service.search()`. Return standard response.

#### [NEW] `backend/utils/sync_chroma.py`
Standalone recovery script. Run this whenever ChromaDB and PostgreSQL fall out of sync (e.g. after manual DB edits during development).
```bash
# From backend directory:
python utils/sync_chroma.py
```
Behaviour: Fetch all properties from PostgreSQL → clear ChromaDB collection → re-embed everything from scratch.

#### Run `seed_properties.py` now
After ChromaDB is ready, run the seed script from Phase 1 to populate the DB and ChromaDB with the 20 mock properties. Verify search returns sensible results before moving to frontend.

---

## Phase 5: Frontend Foundation

Can start in parallel with Phases 3 and 4 after Phase 2 is complete.

---

#### Install frontend dependencies
```bash
npm install react-router-dom axios react-icons
npm install react-hot-toast
```

#### [NEW] `frontend/src/services/api.js`
- Axios instance with `baseURL: http://localhost:5000/api/v1`
- Request interceptor: attach `Authorization: Bearer <token>` from localStorage
- Response interceptor: handle 401 (redirect to login), 403 (show access denied)

#### [NEW] `frontend/src/context/AuthContext.jsx`
- React Context providing `user`, `token`, `role`, `isAuthenticated`
- `login(email, password)` — Call API, store token in localStorage, decode JWT for role
- `logout()` — Clear localStorage, reset context state
- `register(formData, role)` — Call register API
- Auto-restore session from localStorage on app load

#### [MODIFY] `frontend/src/App.jsx`
Wrap everything in `AuthProvider`. Define all routes:
- `/` — Home / Landing
- `/login` — Login page
- `/register` — Register page
- `/search` — Search page (protected: `user` role)
- `/property/:id` — Property details (public)
- `/broker/*` — Broker dashboard routes (protected: `broker` role)
- `/admin/*` — Admin dashboard routes (protected: `admin` role)

#### [NEW] `frontend/src/components/Layout/`
- `Navbar.jsx` — Shows Login/Register for guests; role-appropriate dashboard links for authenticated users
- `Footer.jsx`
- `ProtectedRoute.jsx` — Route guard: checks `isAuthenticated` + role. Redirects to `/login` if not authenticated. Redirects to `/` if wrong role.
- `MainLayout.jsx` — Wraps pages with Navbar + Footer

---

## Phase 6: Frontend Pages & Components

Requires Phases 3, 4, and 5 to be complete before starting.

---

#### Pages — `frontend/src/pages/`

| Page | Key Behaviour |
|---|---|
| `Home.jsx` | Hero section, natural language search bar, brief feature highlights |
| `Login.jsx` | Single form, email + password. No role selector — role returned from server in JWT |
| `Register.jsx` | Form with role selector (User / Broker). Broker shows extra field for `company_name` |
| `SearchResults.jsx` | NL search input at top, results list below. Each result shows property card + AI explanation. Loading state while RAG pipeline runs. Empty state if no results |
| `PropertyDetails.jsx` | Full property view: image gallery, all details, broker info, Book Visit button (users only) |
| `UserDashboard.jsx` | Booking history with status badges, profile info |
| `BrokerDashboard.jsx` | Property list, Add/Edit property form with image upload, incoming bookings management |
| `AdminDashboard.jsx` | Stats overview, broker list with delete, user list with delete, all properties view |

#### Components — `frontend/src/components/`

| Component | Notes |
|---|---|
| `Common/PropertyCard.jsx` | Reusable card: image, title, location, price, availability badge, View Details link |
| `Common/LoadingSpinner.jsx` | Used during API calls |
| `Common/Modal.jsx` | Reusable modal for confirmations (delete, cancel booking, etc.) |
| `Common/StatusBadge.jsx` | Coloured badge for booking status and availability status |
| `Search/SearchBar.jsx` | NL search input with submit button |
| `Search/AIExplanation.jsx` | Styled display for AI match explanation. Shows "AI explanation unavailable" if `ai_explanation` is null |
| `Broker/PropertyForm.jsx` | Add/Edit form. Image upload with client-side type + size validation (5MB / jpg/jpeg/png/webp) before sending to API |
| `Broker/BookingList.jsx` | Table of bookings with Confirm / Cancel actions |

---

## Phase 7: Integration, Polish & Testing

---

### End-to-End Test Flows

Run all of these manually before considering the project done:

1. **Auth Flow** — Register as User → Login → Verify dashboard. Register as Broker → Login → Verify dashboard. Login as Admin (seeded) → Verify dashboard.
2. **Broker Flow** — Login as Broker → Add property with broker notes → Verify it appears in search → Edit description → Verify re-embed → Delete → Verify removed from search.
3. **RAG Search** — With 20+ seeded properties: search "quiet apartment near IT park" → verify semantically relevant results → verify AI explanation present per result.
4. **Booking Flow** — Login as User → Search → Book visit → Login as Broker → Confirm booking → Login as User → Verify status updated.
5. **Admin Flow** — Login as Admin → View all properties → Delete a broker → Verify cascade removes broker's properties and bookings.
6. **ChromaDB Sync** — Add property → confirm found in search → Delete property → confirm no longer in search results.
7. **Graceful Degradation** — Set invalid Gemini API key → Search → Verify results still return with `ai_explanation: null`, no crash.
8. **Role Isolation** — Attempt to access `/api/v1/broker/` routes with a user JWT → Verify 403. Attempt to access `/api/v1/admin/` routes with a broker JWT → Verify 403.
9. **Edge Cases** — Submit empty search query → Verify 400. Search when no properties are available → Verify friendly message. Upload a file over 5MB → Verify rejection.

### CORS Verification
Confirm React (port 5173) can successfully call Flask (port 5000) without browser console errors.

### Responsive Design
Test all pages on a mobile viewport. Tailwind breakpoints should handle most of this.

---

## Folder Structure (Final)

```text
nestquest/
├── backend/
│   ├── app.py                        # Flask entry point, blueprint registration, CORS
│   ├── config.py                     # Dev/Prod config classes
│   ├── .env                          # Secrets — NEVER commit
│   ├── requirements.txt
│   ├── models/
│   │   ├── __init__.py
│   │   ├── administrator.py
│   │   ├── broker.py
│   │   ├── user.py                   # Table name: users
│   │   ├── property.py
│   │   ├── property_image.py
│   │   └── booking.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── property.py
│   │   ├── search.py
│   │   ├── booking.py
│   │   └── admin.py
│   ├── services/
│   │   ├── rag_service.py            # Full 10-step RAG pipeline
│   │   ├── embedding_service.py      # ChromaDB CRUD and sync
│   │   └── gemini_service.py         # LangChain + Gemini via langchain-google-genai
│   └── utils/
│       ├── responses.py              # success_response / error_response
│       ├── decorators.py             # role_required decorator
│       ├── seed_admin.py             # Run once to create first admin
│       ├── seed_properties.py        # Run after Phase 4 — 20 mock properties
│       └── sync_chroma.py            # Recovery: rebuild ChromaDB from PostgreSQL
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── MainLayout.jsx
│   │   │   ├── Common/
│   │   │   │   ├── PropertyCard.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── StatusBadge.jsx
│   │   │   ├── Search/
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   └── AIExplanation.jsx
│   │   │   └── Broker/
│   │   │       ├── PropertyForm.jsx
│   │   │       └── BookingList.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SearchResults.jsx
│   │   │   ├── PropertyDetails.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── BrokerDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   └── App.jsx
│   └── package.json
│
├── PROJECT_CONTEXT.md
├── IMPLEMENTATION_PLAN.md            # This file
└── README.md
```

---

## What NOT To Do During Implementation

These apply to every phase. Read before every coding session.

- **Do not** use SQLite — PostgreSQL only
- **Do not** name the users table `user` — reserved keyword, use `users`
- **Do not** skip ChromaDB sync on property create/update/delete
- **Do not** query all of ChromaDB — always constrain to available property IDs from PostgreSQL first
- **Do not** call Gemini API directly — always via LangChain
- **Do not** hardcode secrets — `.env` only
- **Do not** trust `broker_id` or `user_id` from request body — extract from JWT always
- **Do not** allow cross-role route access
- **Do not** return unavailable properties in search results
- **Do not** pass NULL or empty string to the embedding model — always sanitize first
- **Do not** configure CORS as a wildcard in production
