# NestQuest — Intelligent Rental & Real Estate Matchmaker

An AI-powered real estate platform that replaces rigid filter-based property search with natural language understanding. Users describe what they are looking for in plain language, and the system retrieves and explains the most relevant matches using a Retrieval-Augmented Generation pipeline built on a dual-database architecture.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [The RAG Pipeline](#the-rag-pipeline)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [User Roles](#user-roles)
- [Scope](#scope)
- [Development Status](#development-status)
- [Team](#team)
- [License](#license)

---

## Overview

Most property listing platforms rely on structured filters — location, price, bedroom count — that fail to capture the lifestyle-oriented way people actually search for a home. A query like *"a quiet apartment near Infopark suitable for someone working night shifts"* cannot be expressed through dropdown menus, yet this is exactly how modern users describe their requirements.

NestQuest addresses this gap by combining structured data storage with semantic search and generative AI, allowing users to search conversationally while receiving recommendations grounded in real property data and explained in plain language.

---

## Problem Statement

Property brokers routinely capture valuable context in unstructured notes and descriptions — neighborhood quality, tenant suitability, ventilation, safety, proximity to amenities — information that conventional relational search cannot interpret. As a result, users encounter irrelevant results or zero-result searches despite suitable listings existing in the database, while brokers spend significant time manually matching enquiries to properties.

NestQuest resolves this by treating unstructured broker notes as a first-class, searchable data source rather than discarding their value.

---

## Key Features

- Natural language property search using semantic understanding rather than keyword matching
- AI-generated explanations describing why each recommended property matches a user's query
- Role-based access for Administrators, Brokers, and Users
- Broker dashboard for property, image, and vacancy management
- Real-time availability filtering to ensure only vacant properties are recommended
- Visit booking and booking status management
- Responsive, modern web interface

---

## System Architecture

NestQuest follows a three-tier architecture with a dual-database design, separating transactional data from semantic search data.

```
React Frontend
      |
      v
Flask REST API
      |
  --------------------
  |                  |
  v                  v
PostgreSQL        ChromaDB
(structured data) (vector embeddings)
  |                  |
  ------------------
        |
        v
    LangChain
        |
        v
   Gemini API
```

PostgreSQL is the system of record for all transactional data: users, brokers, properties, bookings, and availability. ChromaDB stores vector embeddings generated from property descriptions and broker notes, enabling similarity search based on meaning rather than exact terms. LangChain orchestrates retrieval and prompt construction, while the Gemini API generates natural language justifications for each recommendation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, HTML5, CSS3 |
| Backend | Python, Flask |
| Relational Database | PostgreSQL |
| Vector Database | ChromaDB |
| AI Orchestration | LangChain |
| Language Model | Google Gemini API |
| Authentication | JWT |
| Password Security | bcrypt |
| Version Control | Git, GitHub |

---

## The RAG Pipeline

The recommendation engine follows a fixed retrieval sequence to ensure results are both relevant and current:

1. The user submits a natural language query.
2. The backend authenticates the request and identifies the user's role.
3. PostgreSQL is queried to retrieve only properties with an available status.
4. The query is converted into a vector embedding.
5. ChromaDB performs a semantic similarity search constrained to the available property set.
6. The top matching property identifiers are retrieved.
7. Full structured details for these properties are fetched from PostgreSQL.
8. LangChain assembles a prompt combining the user query and retrieved property context.
9. The Gemini API generates a natural language explanation for each match.
10. Ranked results with explanations are returned to the frontend.

This design ensures that availability is always verified against the transactional database before semantic retrieval occurs, and that generated explanations are grounded in actual property data rather than model inference alone.

---

## Database Schema

The system is built around six core entities: Administrator, Broker, User, Property, PropertyImage, and Booking. Brokers list properties; properties may have multiple images; users make bookings against properties. Referential integrity is enforced through foreign key constraints with cascading deletes where appropriate.

Full schema definitions, including field-level constraints, are documented in the project's Software Design Specification.

---

## Project Structure

```
nestquest/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── context/
├── PROJECT_CONTEXT.md
├── IMPLEMENTATION_PLAN.md
├── TASK_TRACKER.md
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10 or later
- Node.js and npm
- PostgreSQL 14 or later
- A Google Gemini API key

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS or Linux

pip install -r requirements.txt
```

Create a PostgreSQL database named `nestquest`, then configure the environment variables described below.

Initialize the PostgreSQL database tables and seed initial data:

```bash
# Create database tables
python -c "from app import create_app; from models import db; app = create_app(); app.app_context().push(); db.create_all()"

# Seed administrator and property dataset
python utils/seed_admin.py
python utils/seed_properties.py

# Start the Flask REST API server
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173` by default.

---

## Environment Variables

Create a `.env` file inside the `backend` directory with the following keys:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/nestquest
SECRET_KEY=your_strong_flask_secret_key_here
JWT_SECRET_KEY=your_strong_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CHROMA_PERSIST_PATH=./chroma_store
UPLOAD_FOLDER=./static/uploads/properties
FLASK_ENV=development
```

> **Security Note:** `SECRET_KEY` and `JWT_SECRET_KEY` must be configured with strongly generated unique values in production environments. This file is excluded from version control and must never be committed.

---

## API Overview

All endpoints are prefixed with `/api/v1/`. Responses follow a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "message": "Description of the result"
}
```

| Endpoint | Method | Description |
|---|---|---|
| `/auth/register` | POST | Register a new user or broker |
| `/auth/login` | POST | Authenticate and receive a JWT |
| `/auth/me` | GET | Retrieve authenticated profile |
| `/properties/` | GET, POST | List or create properties |

### Authentication API Contract (Handoff Specification)

#### 1. Register (`POST /api/v1/auth/register`)
**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secretpassword",
  "phone": "9876543210",
  "role": "user",
  "company_name": "Skyline Realty"
}
```
> Note: `role` must be `'user'` or `'broker'`. `company_name` is optional (used when `role == 'broker'`). Admin registration via API is strictly prohibited.

**Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  },
  "message": "Registration successful as user"
}
```

#### 2. Login (`POST /api/v1/auth/login`)
**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "secretpassword"
}
```
> Note: Role selection is not required on the frontend. The server detects the account type (`admin`, `broker`, or `user`) automatically.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "access_token": "<JWT_ACCESS_TOKEN>",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    }
  },
  "message": "Login successful"
}
```

#### 3. Current User Profile (`GET /api/v1/auth/me`)
**Headers:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9876543210",
    "role": "user",
    "created_at": "2026-07-27T06:50:32.731083"
  },
  "message": "Profile fetched successfully"
}
```
| `/properties/<id>` | GET, PUT, DELETE | Manage a specific property |
| `/search/` | POST | Submit a natural language search query |
| `/bookings/` | GET, POST | View or create visit bookings |
| `/admin/reports` | GET | Retrieve platform-level statistics |

Authenticated requests require an `Authorization: Bearer <token>` header.

---

## User Roles

| Role | Responsibilities |
|---|---|
| Administrator | Manage brokers and users, monitor listings, view platform reports |
| Broker | Manage own property listings, images, availability, and bookings |
| User | Search properties, view recommendations, and book visits |

Access to each role's functionality is enforced at the API level through JWT-based role validation.

---

## Scope

NestQuest is focused on intelligent property discovery and does not include payment processing, digital rent agreements, tenant background verification, or property valuation services. These exclusions keep the system focused on search and recommendation rather than full transaction handling.

---

## Team

| Name | Role |
|---|---|
| Yadhunandhan TJ | Backend architecture, RAG pipeline, frontend animation layer |
| Jacob Joy | Frontend foundation and pages, backend CRUD and admin modules |

---

## License

MIT
