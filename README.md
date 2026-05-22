
# Issue Tracker REST API

A robust RESTful API built with Node.js, Express, and TypeScript for managing and tracking software application issues. It includes secure JWT-based authentication, full CRUD operations, and is fully optimized for production deployment using a PostgreSQL database.

## 🔗 Live Application
- **Live API URL:** 
- **Database Provider:** NeonDB / Supabase / ElephantSQL (PostgreSQL)

---

##  Features

- **User Authentication:** Secure Login and JWT Token Generation.
- **Issue Management:** Complete CRUD functionality (Create, Read, Update, Delete) for tracking application issues.
- **Access Control:** Public routes for viewing issues, and protected routes enforced via `authMiddleware` for managing them.
- **Data Persistence:** Relational data tracking with dynamic timestamps and auto-incrementing tracking IDs using PostgreSQL.
- **Production Ready:** Properly configured CORS and environment variable management for secure deployment.

---

##  Tech Stack

- **Backend Framework:** Node.js, Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (Hosted on NeonDB / Supabase / ElephantSQL)
- **Authentication:** JSON Web Token (JWT)
- **Deployment Platform:** Render / Railway / Vercel

---

##  Database Schema Summary

The application utilizes a relational PostgreSQL database with the following schema structure:

### 1. `Users` Table
- `id`: Serial (Primary Key, Auto-Increment)
- `email`: VARCHAR (Unique, Required)
- `password`: VARCHAR (Hashed, Required)
- `name`: VARCHAR
- `createdAt` / `updatedAt`: TIMESTAMP
- *Relationships:* One-to-Many with `Issues` table (A user can report multiple issues).

### 2. `Issues` Table
- `id`: Serial (Primary Key, Auto-Increment)
- `title`: VARCHAR (Required)
- `description`: TEXT (Required)
- `type`: VARCHAR (e.g., `bug`, `feature_request`)
- `reporterId`: Integer (Foreign Key linking to `Users.id`)
- `createdAt` / `updatedAt`: TIMESTAMP

---

##  API Endpoints & Testing Guide

### 1. Authentication
* **Method:** `POST`
* **URL:** `/api/auth/login`
* **Body (JSON):**
```json
  {
    "email": "zayan@example.com",
    "password": "your_password"
  }