# NestQuest — Task Tracker

> Update this file regularly. Status values: `[ ]` Not Started · `[~]` In Progress · `[x]` Done · `[!]` Blocked

---

## Pre-Coding Checklist

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| P0 | PostgreSQL installed locally | Both | `[x]` | Create `nestquest` database |
| P1 | Gemini API key obtained | Yadhu | `[x]` | Add to `.env` |
| P2 | Git repo initialized | Yadhu | `[x]` | |
| P3 | `.gitignore` created | Yadhu | `[x]` | Include `.env`, `chroma_store/`, `__pycache__/`, `node_modules/`, `static/uploads/` |
| P4 | Initial folder structure created | Yadhu | `[x]` | Match spec in `IMPLEMENTATION_PLAN.md` |
| P5 | `.env` file created (not committed) | Yadhu | `[x]` | Use template from `PROJECT_CONTEXT.md` |
| P6 | Wireframes done | Jacob | `[ ]` | Landing, Search Results, Broker Dashboard minimum |
| P7 | UX spec documented | Jacob | `[ ]` | |
| P8 | Work split agreed | Both | `[ ]` | This document |

---

## Phase 1 — Backend Foundation & Database Schema
> Owner: **Yadhu** · Dependency: P0 complete

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 1.1 | `config.py` — Dev/Prod config classes, load from `.env` | Yadhu | `[x]` | PostgreSQL only, no SQLite |
| 1.2 | `models/administrator.py` | Yadhu | `[x]` | SERIAL PK |
| 1.3 | `models/broker.py` | Yadhu | `[x]` | SERIAL PK |
| 1.4 | `models/user.py` | Yadhu | `[x]` | Table name: `users` not `user` |
| 1.5 | `models/property.py` | Yadhu | `[x]` | Include `broker_notes` column |
| 1.6 | `models/property_image.py` | Yadhu | `[x]` | ON DELETE CASCADE |
| 1.7 | `models/booking.py` | Yadhu | `[x]` | ON DELETE CASCADE |
| 1.8 | `requirements.txt` complete | Yadhu | `[x]` | See `IMPLEMENTATION_PLAN.md` for full list |
| 1.9 | `app.py` — Flask init, CORS, blueprints, static files | Yadhu | `[x]` | CORS restricted to port 5173 |
| 1.10 | `utils/responses.py` — `success_response`, `error_response` | Yadhu | `[x]` | Used by every route |
| 1.11 | `utils/decorators.py` — `role_required` decorator | Yadhu | `[x]` | |
| 1.12 | `utils/seed_admin.py` — Create first admin | Yadhu | `[x]` | Run once manually |
| 1.13 | `utils/seed_properties.py` — 20 mock properties | Yadhu | `[x]` | Run after Phase 4. Rich broker_notes required |
| 1.14 | DB tables created and verified in pgAdmin | Yadhu | `[x]` | |

---

## Phase 2 — Authentication & Authorization
> Owner: **Yadhu** · Dependency: Phase 1 complete

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 2.1 | `POST /api/v1/auth/register` | Yadhu | `[x]` | user or broker role, bcrypt hashing |
| 2.2 | `POST /api/v1/auth/login` | Yadhu | `[x]` | Query all 3 tables, role in JWT |
| 2.3 | `GET /api/v1/auth/me` | Yadhu | `[x]` | Decode JWT, return profile |
| 2.4 | Auth endpoints tested in Postman | Yadhu | `[x]` | Register → Login → Me flow |
| 2.5 | **Handoff to Jacob** — Share auth API response format | Yadhu | `[x]` | Jacob needs this for AuthContext |

---

## Phase 3 — Properties, Bookings & Admin Routes
> Owner: **Jacob** · Dependency: Phase 2 complete

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 3.1 | `GET /api/v1/properties/` | Jacob | `[ ]` | Public, optional filters |
| 3.2 | `GET /api/v1/properties/<id>` | Jacob | `[ ]` | Include images |
| 3.3 | `POST /api/v1/properties/` | Jacob | `[ ]` | Broker only. Trigger `embed_property()` after save |
| 3.4 | `PUT /api/v1/properties/<id>` | Jacob | `[ ]` | Own properties only. Trigger re-embed if text changed |
| 3.5 | `DELETE /api/v1/properties/<id>` | Jacob | `[ ]` | Cancel pending bookings first, then delete embedding |
| 3.6 | `POST /api/v1/properties/<id>/images` | Jacob | `[ ]` | Max 5MB, jpg/jpeg/png/webp only |
| 3.7 | `PATCH /api/v1/properties/<id>/availability` | Jacob | `[ ]` | No ChromaDB update needed |
| 3.8 | `POST /api/v1/bookings/` | Jacob | `[ ]` | Validate availability before creating |
| 3.9 | `GET /api/v1/bookings/` | Jacob | `[ ]` | Role-aware: user sees own, broker sees own properties' |
| 3.10 | `PATCH /api/v1/bookings/<id>/status` | Jacob | `[ ]` | Broker only, valid status transitions |
| 3.11 | `GET /api/v1/bookings/<id>` | Jacob | `[ ]` | |
| 3.12 | `GET /api/v1/admin/brokers` | Jacob | `[ ]` | Admin only |
| 3.13 | `DELETE /api/v1/admin/brokers/<id>` | Jacob | `[ ]` | Admin only |
| 3.14 | `GET /api/v1/admin/users` | Jacob | `[ ]` | Admin only |
| 3.15 | `DELETE /api/v1/admin/users/<id>` | Jacob | `[ ]` | Admin only |
| 3.16 | `GET /api/v1/admin/properties` | Jacob | `[ ]` | Admin only |
| 3.17 | `GET /api/v1/admin/reports` | Jacob | `[ ]` | Stats: properties, bookings, users, brokers |
| 3.18 | All Phase 3 endpoints tested in Postman | Jacob | `[ ]` | |
| 3.19 | **Handoff to Yadhu** — Confirm embedding hooks are called correctly | Jacob | `[ ]` | 3.3, 3.4, 3.5 call embedding_service |

---

## Phase 4 — RAG Pipeline
> Owner: **Yadhu** · Dependency: Phase 3 complete (for embedding hooks)

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 4.1 | `services/embedding_service.py` — `init_chroma()` | Yadhu | `[ ]` | Collection: `nestquest_properties` |
| 4.2 | `embedding_service.py` — `_sanitize_text()` | Yadhu | `[ ]` | Handle NULL broker_notes |
| 4.3 | `embedding_service.py` — `embed_property()` | Yadhu | `[ ]` | Store with `property_id` metadata |
| 4.4 | `embedding_service.py` — `update_property_embedding()` | Yadhu | `[ ]` | Delete old → insert new |
| 4.5 | `embedding_service.py` — `delete_property_embedding()` | Yadhu | `[ ]` | |
| 4.6 | `embedding_service.py` — `semantic_search()` | Yadhu | `[ ]` | Constrained to available_property_ids |
| 4.7 | `services/gemini_service.py` — LangChain + Gemini setup | Yadhu | `[ ]` | Use `ChatGoogleGenerativeAI`, graceful degradation |
| 4.8 | `services/rag_service.py` — Full 10-step pipeline | Yadhu | `[ ]` | See IMPLEMENTATION_PLAN Phase 4 |
| 4.9 | `routes/search.py` — `POST /api/v1/search/` | Yadhu | `[ ]` | JWT required, user role |
| 4.10 | `utils/sync_chroma.py` — Recovery script | Yadhu | `[ ]` | Run: `python utils/sync_chroma.py` |
| 4.11 | Run `seed_properties.py` | Yadhu | `[ ]` | 20 properties in DB + ChromaDB |
| 4.12 | RAG search tested end-to-end via Postman | Yadhu | `[ ]` | Verify semantic relevance + AI explanations |
| 4.13 | Graceful degradation tested | Yadhu | `[ ]` | Invalid Gemini key → results return, no crash |
| 4.14 | **Handoff to Jacob** — Share search endpoint response format | Yadhu | `[ ]` | Jacob builds SearchResults + AIExplanation against this |

---

## Phase 5 — Frontend Foundation
> Owner: **Jacob** · Dependency: Phase 2 handoff (2.5)
> Can run in parallel with Phases 3 & 4

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 5.1 | Install frontend dependencies | Jacob | `[ ]` | react-router-dom, axios, react-icons, react-hot-toast |
| 5.2 | `services/api.js` — Axios instance + interceptors | Jacob | `[ ]` | baseURL, Bearer token, 401/403 handling |
| 5.3 | `context/AuthContext.jsx` — Auth state + login/logout/register | Jacob | `[ ]` | Persist token in localStorage, decode role |
| 5.4 | `App.jsx` — BrowserRouter + all routes defined | Jacob | `[ ]` | Wrap in AuthProvider |
| 5.5 | `Layout/Navbar.jsx` — Dynamic based on auth state + role | Jacob | `[ ]` | Frosted glass on scroll |
| 5.6 | `Layout/Footer.jsx` | Jacob | `[ ]` | |
| 5.7 | `Layout/ProtectedRoute.jsx` — Auth + role guard | Jacob | `[ ]` | Redirect to /login if not authenticated |
| 5.8 | `Layout/MainLayout.jsx` | Jacob | `[ ]` | |
| 5.9 | Basic routing verified — all routes render without errors | Jacob | `[ ]` | |

---

## Phase 6 — Frontend Pages & Components
> Owner: **Jacob** (pages/components) + **Yadhu** (dual-mode concept)
> Dependency: Phases 3, 4, 5 all complete

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 6.1 | `Common/PropertyCard.jsx` | Jacob | `[ ]` | Reusable, hover lift effect |
| 6.2 | `Common/LoadingSpinner.jsx` | Jacob | `[ ]` | |
| 6.3 | `Common/Modal.jsx` | Jacob | `[ ]` | For confirmations |
| 6.4 | `Common/StatusBadge.jsx` | Jacob | `[ ]` | Booking + availability statuses |
| 6.5 | `Search/SearchBar.jsx` | Jacob | `[ ]` | Typewriter placeholder effect |
| 6.6 | `Search/AIExplanation.jsx` | Jacob | `[ ]` | Handle null ai_explanation gracefully |
| 6.7 | `Broker/PropertyForm.jsx` | Jacob | `[ ]` | Image upload, client-side validation |
| 6.8 | `Broker/BookingList.jsx` | Jacob | `[ ]` | Confirm/Cancel actions |
| 6.9 | `pages/Home.jsx` | Jacob | `[ ]` | Hero, search bar, how it works, featured listings |
| 6.10 | `pages/Login.jsx` | Jacob | `[ ]` | Single form, no role selector |
| 6.11 | `pages/Register.jsx` | Jacob | `[ ]` | Role selector, extra field for broker |
| 6.12 | `pages/SearchResults.jsx` | Jacob | `[ ]` | Skeleton loaders, results + AI explanation cards |
| 6.13 | `pages/PropertyDetails.jsx` | Jacob | `[ ]` | Image gallery, details, booking button |
| 6.14 | `pages/UserDashboard.jsx` | Jacob | `[ ]` | Booking history, profile |
| 6.15 | `pages/BrokerDashboard.jsx` | Jacob | `[ ]` | Property list, add/edit, booking management |
| 6.16 | `pages/AdminDashboard.jsx` | Jacob | `[ ]` | Stats, manage brokers/users/properties |
| 6.17 | Framer Motion installed | Yadhu | `[ ]` | `npm install framer-motion` |
| 6.18 | Dual-mode toggle button — fixed position, icon switch | Yadhu | `[ ]` | House ↔ Person icon |
| 6.19 | Portfolio mode — curtain reveal transition | Yadhu | `[ ]` | Framer Motion `AnimatePresence` |
| 6.20 | Portfolio mode — content (about, skills, projects, contact) | Yadhu | `[ ]` | |
| 6.21 | Scroll-triggered animations on landing page | Yadhu | `[ ]` | Framer Motion `whileInView` |
| 6.22 | Page transition animations | Yadhu | `[ ]` | |

---

## Phase 7 — Integration & Testing
> Owner: **Both** · Dependency: Phase 6 complete

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 7.1 | Auth flow — Register all 3 roles → Login → Dashboard | Both | `[ ]` | |
| 7.2 | Broker flow — Add → Search → Edit → Delete property | Both | `[ ]` | Verify ChromaDB sync each step |
| 7.3 | RAG search — NL queries return semantically relevant results | Yadhu | `[ ]` | Test 10+ different queries |
| 7.4 | Booking flow — User books → Broker confirms → User sees update | Both | `[ ]` | |
| 7.5 | Admin flow — View all → Delete broker → Verify cascade | Both | `[ ]` | |
| 7.6 | ChromaDB sync — Add → found in search. Delete → not found | Yadhu | `[ ]` | |
| 7.7 | Graceful degradation — Gemini failure → results still return | Yadhu | `[ ]` | |
| 7.8 | Role isolation — User JWT on broker routes → 403 | Both | `[ ]` | |
| 7.9 | Edge cases — empty search, no available properties | Both | `[ ]` | |
| 7.10 | Image upload — over 5MB rejected, wrong type rejected | Jacob | `[ ]` | |
| 7.11 | CORS verified — no browser console errors | Both | `[ ]` | |
| 7.12 | Responsive design — mobile viewport check | Jacob | `[ ]` | |
| 7.13 | Dual-mode transition — smooth on all screen sizes | Yadhu | `[ ]` | |
| 7.14 | Final Postman collection — all endpoints documented | Both | `[ ]` | |
| 7.15 | Demo data verified — 20 properties give good search results | Yadhu | `[ ]` | |

---

## Sync Points (Do Not Skip)

| Sync | When | What to share |
|---|---|---|
| **Sync 1** | After 2.5 | Yadhu → Jacob: Auth API response format + JWT structure |
| **Sync 2** | After 3.19 | Jacob → Yadhu: Confirm embedding hooks in property routes are correct |
| **Sync 3** | After 4.14 | Yadhu → Jacob: Search endpoint response format with `ai_explanation` field |
| **Sync 4** | After Phase 6 | Both: Full integration walkthrough before Phase 7 |

---

## Progress Summary

| Phase | Owner | Total Tasks | Done | Status |
|---|---|---|---|---|
| Pre-Coding | Both | 9 | 6 | `[~]` In Progress |
| Phase 1 | Yadhu | 14 | 14 | `[x]` Done |
| Phase 2 | Yadhu | 5 | 5 | `[x]` Done |
| Phase 3 | Jacob | 19 | 0 | `[ ]` Not Started |
| Phase 4 | Yadhu | 14 | 0 | `[ ]` Not Started |
| Phase 5 | Jacob | 9 | 0 | `[ ]` Not Started |
| Phase 6 | Both | 22 | 0 | `[ ]` Not Started |
| Phase 7 | Both | 15 | 0 | `[ ]` Not Started |
| **Total** | | **107** | **25** | |
