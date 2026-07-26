# NestQuest – Project Context

> **Purpose:** This document defines the architecture, stack, conventions, constraints, and implementation guidelines for NestQuest. All AI-assisted and human development must follow this exact specification. Read this fully before writing any code.

---

## What This Project Is

**NestQuest: Intelligent Rental & Real Estate Matchmaker** is an AI-powered web application that enables users to discover rental and sale properties using natural language instead of traditional filter-based searches.

Example query:
> *"Find a quiet 2BHK near Infopark suitable for IT professionals with good public transport."*

The system interprets the user's intent, retrieves semantically relevant properties, and generates AI-powered explanations describing why each recommendation matches the request.

The AI component is implemented using **Retrieval-Augmented Generation (RAG)** over the project's own private property database.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, HTML5, CSS3 |
| Backend | Python Flask (REST API) |
| ORM | SQLAlchemy |
| Relational Database | PostgreSQL |
| Vector Database | ChromaDB |
| AI Orchestration | LangChain |
| LLM | Google Gemini API (`gemini-1.5-flash` or `gemini-1.5-pro`) |
| Embedding Model | `models/embedding-001` (Gemini) or `all-MiniLM-L6-v2` (local fallback) |
| Authentication | JWT (`flask-jwt-extended`) |
| Password Hashing | bcrypt |
| HTTP Client (Frontend) | Axios |
| Environment Variables | python-dotenv |
| Version Control | Git & GitHub |
| API Testing | Postman |
| IDE | Visual Studio Code |

---

## System Architecture

Three-tier architecture with a dual-database design. **Do not collapse into a single database — this is the core architectural decision.**

```text
React Frontend  (port 5173 in dev)
      │
      │  HTTP / Axios
      ▼
Flask REST API  (port 5000 in dev)
      │
 ┌────┴────────────────┐
 │                     │
 ▼                     ▼
PostgreSQL          ChromaDB
(structured data)   (vector embeddings)
 │                     │
 └──────┬──────────────┘
        ▼
    LangChain
        │
        ▼
   Gemini API
```

### Database Responsibilities

- **PostgreSQL** — Users, Brokers, Admins, Properties, Images, Bookings, availability status, all transactional data.
- **ChromaDB** — Vector embeddings generated from each property's `(title + description + broker_notes)`. Each vector is mapped to a `property_id`. ChromaDB is **never** responsible for availability filtering — that is always PostgreSQL's job.

---

## The RAG Pipeline (Core Feature)

This is the most critical part of the system. Always follow this exact sequence — do not reorder steps:

1. User submits a natural language query.
2. Backend validates JWT session and extracts user role.
3. **PostgreSQL retrieves only `property_id` list where `availability_status = 'Available'`.**
4. The user's query is converted into a vector embedding.
5. ChromaDB performs semantic similarity search **constrained to the `property_id` list from step 3** using metadata filtering.
6. Top K=5 matching property descriptions are retrieved from ChromaDB.
7. Full structured details for these K properties are fetched from PostgreSQL (price, location, bedrooms, etc.).
8. LangChain assembles a prompt combining the user query + retrieved property context.
9. Gemini API generates a personalised match explanation for each recommendation.
10. Backend returns ranked properties + AI explanations to the frontend as JSON.

**Critical rules:**
- Step 3 before step 5 — always. Never query the full ChromaDB collection.
- Step 7 is necessary — ChromaDB only stores embeddings and notes, not full property details. Always hydrate from PostgreSQL before returning to frontend.
- If step 3 returns zero available properties → return early with an empty result and a user-friendly message. Do not proceed to ChromaDB.
- If Gemini API call fails → return the property results without AI explanation (graceful degradation). Do not crash the search.

---

## ChromaDB Synchronisation Rules

ChromaDB and PostgreSQL **must stay in sync at all times.** All sync operations happen inside `embedding_service.py`.

| Event | Action |
|---|---|
| Property Created | Generate embedding from `(title + description + broker_notes)` → insert into ChromaDB with metadata `{"property_id": id}` |
| Description or Notes Updated | Regenerate embedding → delete old vector → insert new vector |
| Property Deleted | Delete corresponding vector from ChromaDB using `property_id` |
| Availability Status Changed | **No ChromaDB action needed** — availability is filtered at PostgreSQL layer |

**Handling NULL broker_notes:**
- `broker_notes` may be NULL or empty if the broker did not provide notes.
- Always sanitise before embedding: `text = f"{title}. {description or ''}. {broker_notes or ''}".strip()`
- Never pass a None or empty string directly to the embedding model.

**If ChromaDB and PostgreSQL get out of sync** (e.g. manual DB edits during development):
- Run the `sync_chroma.py` utility script (to be created at `backend/utils/sync_chroma.py`).
- This script fetches all properties from PostgreSQL and rebuilds ChromaDB from scratch.
- During development, treat this as the recovery tool whenever search results look wrong.

---

## Database Schema

Use `SERIAL` for all primary keys (PostgreSQL auto-increment).

### Administrator
```sql
CREATE TABLE administrator (
    admin_id    SERIAL PRIMARY KEY,
    admin_name  VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Broker
```sql
CREATE TABLE broker (
    broker_id    SERIAL PRIMARY KEY,
    broker_name  VARCHAR(100) NOT NULL,
    email        VARCHAR(100) UNIQUE NOT NULL,
    phone        VARCHAR(15) NOT NULL,
    password     VARCHAR(255) NOT NULL,
    company_name VARCHAR(100),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User
```sql
CREATE TABLE users (
    user_id    SERIAL PRIMARY KEY,
    user_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    phone      VARCHAR(15) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> Note: Table is named `users` not `user` — `user` is a reserved keyword in PostgreSQL.

### Property
```sql
CREATE TABLE property (
    property_id         SERIAL PRIMARY KEY,
    broker_id           INTEGER REFERENCES broker(broker_id) ON DELETE CASCADE,
    title               VARCHAR(150) NOT NULL,
    description         TEXT,
    broker_notes        TEXT,                  -- Key RAG field. Embedded into ChromaDB.
    property_type       VARCHAR(50) NOT NULL,  -- 'Apartment', 'House', 'Villa', etc.
    price               DECIMAL(10,2) NOT NULL,
    location            VARCHAR(150) NOT NULL,
    bedrooms            INTEGER,
    bathrooms           INTEGER,
    area_sqft           INTEGER,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'Available',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### PropertyImage
```sql
CREATE TABLE property_image (
    image_id    SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES property(property_id) ON DELETE CASCADE,
    image_url   VARCHAR(500) NOT NULL
);
```

### Booking
```sql
CREATE TABLE booking (
    booking_id   SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    property_id  INTEGER REFERENCES property(property_id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    visit_date   DATE NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'Pending'
    -- status values: 'Pending', 'Confirmed', 'Completed', 'Cancelled'
);
```

---

## Image Storage

Property images are stored on the **local filesystem** during development.

- Upload directory: `backend/static/uploads/properties/<property_id>/`
- `image_url` in the database stores the relative path from the Flask static folder, e.g. `uploads/properties/3/front.jpg`
- Flask serves images via its static file serving: `GET /static/uploads/properties/3/front.jpg`
- Do not use cloud storage (S3, Firebase, etc.) — out of scope for this project.

---

## User Roles & Access Control

Exactly **three roles.** JWT token must include the `role` field (`admin`, `broker`, `user`). Every protected route must validate the role.

| Role | Access |
|---|---|
| **admin** | Manage brokers, manage users, monitor all listings, view reports |
| **broker** | Add/edit/delete own properties only, upload images, manage vacancy, view/manage bookings for own properties |
| **user** | Register, natural language search, view recommendations, book visits, view own booking history |

- A `user` cannot access any `/broker/` or `/admin/` routes.
- A `broker` can only modify their own properties — always filter by `broker_id` from JWT, never trust `broker_id` from request body.
- An `admin` can access everything.

---

## Project Folder Structure

```text
nestquest/
├── backend/
│   ├── app.py                      # Flask app entry point, blueprint registration, CORS setup
│   ├── config.py                   # Config classes (Dev, Prod)
│   ├── .env                        # Secrets — NEVER commit to GitHub
│   ├── requirements.txt
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── broker.py
│   │   ├── property.py
│   │   ├── booking.py
│   │   └── admin.py
│   ├── routes/
│   │   ├── auth.py                 # Login, register for all roles
│   │   ├── property.py             # Broker property CRUD
│   │   ├── search.py               # RAG search endpoint
│   │   ├── booking.py              # Booking management
│   │   └── admin.py                # Admin management routes
│   ├── services/
│   │   ├── rag_service.py          # Full RAG pipeline (LangChain + ChromaDB + Gemini)
│   │   └── embedding_service.py    # ChromaDB CRUD and sync logic
│   └── utils/
│       └── sync_chroma.py          # Recovery script: rebuilds ChromaDB from PostgreSQL
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── BrokerDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── SearchResults.jsx
│   │   │   └── PropertyDetails.jsx
│   │   ├── services/               # Axios API call functions
│   │   │   └── api.js
│   │   ├── context/                # Auth context / JWT storage
│   │   └── App.jsx
│   └── package.json
│
├── PROJECT_CONTEXT.md              # This file
└── README.md
```

---

## API Conventions

- **Base URL:** `/api/v1/`
- **Standard response format (always):**
```json
{
  "success": true,
  "data": {},
  "message": "Human readable message"
}
```
- **Error response format:**
```json
{
  "success": false,
  "data": null,
  "message": "What went wrong"
}
```
- Authentication: `Authorization: Bearer <token>` header on all protected routes.
- All secrets in `.env`, loaded via `python-dotenv`. Never hardcode.
- Validate all incoming request data before processing.
- Use HTTPS in production.

---

## CORS Configuration

**CORS must be configured in `app.py` or the app will not work during development.**

Flask runs on port 5000, React runs on port 5173. Without CORS, every API call from the frontend will be blocked by the browser.

```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
```

Install: `pip install flask-cors`

Do not use `CORS(app)` with a wildcard in production — restrict to the actual frontend domain.

---

## Environment Variables (.env)

```env
# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/nestquest

# JWT
JWT_SECRET_KEY=your_jwt_secret_here

# Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# ChromaDB
CHROMA_PERSIST_PATH=./chroma_store

# Flask
FLASK_ENV=development
```

Never commit `.env` to GitHub. Add it to `.gitignore` immediately.

---

## Zero Result & Edge Case Handling

| Scenario | Expected Behaviour |
|---|---|
| No available properties in PostgreSQL | Return `{"success": true, "data": [], "message": "No properties are currently available."}` |
| ChromaDB returns zero matches | Return `{"success": true, "data": [], "message": "No properties matched your search. Try different keywords."}` |
| Gemini API call fails | Return property results without AI explanation. Set `"ai_explanation": null` per result. Do not crash. |
| `broker_notes` is NULL | Sanitise before embedding: `f"{title}. {description or ''}. {broker_notes or ''}"` |
| User submits empty search query | Validate at API level, return 400 with `"Search query cannot be empty."` |
| Broker deletes a property with pending bookings | Cancel all pending bookings for that property before deletion. |

---

## What NOT To Do

- **Do not** use SQLite — PostgreSQL only.
- **Do not** name the users table `user` — it is a reserved keyword in PostgreSQL. Use `users`.
- **Do not** store vectors in PostgreSQL or merge both databases into one.
- **Do not** skip ChromaDB sync when a property is created or updated.
- **Do not** query all of ChromaDB — always constrain to available `property_id` list from PostgreSQL first.
- **Do not** call Gemini API directly — always go through LangChain.
- **Do not** hardcode API keys, DB URIs, or JWT secrets anywhere in source code.
- **Do not** trust `broker_id` or `user_id` from the request body — always extract from the JWT token.
- **Do not** allow cross-role route access.
- **Do not** return unavailable properties in search results under any circumstance.
- **Do not** configure CORS as a wildcard in production.
- **Do not** pass NULL or empty string directly to the embedding model.

---

## Out of Scope (Do Not Implement)

- Online payments or payment gateway
- Digital rent agreements or e-signatures
- Tenant background verification or credit scoring
- Live chat between brokers and users
- Video property tours
- Property valuation services
- Cloud image storage (S3, Firebase, etc.)
- Multilingual search

---

## Key Contacts

- **Group Members:** Jacob Joy (Roll No. 27), Yadhunandhan TJ (Roll No. 59)
- **Guide:** Greeshma K V
- **Institution:** UCC – MCA, Batch A
