# QuickNotes REST API Design

This document outlines the RESTful API endpoints, request/response structures, and error handling for the production-ready QuickNotes service.

---

## 1. API Endpoints Overview

| Method | Endpoint Path | Description | Success Status Code |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/notes` | Retrieve a list of all notes for the authenticated user (supports optional `?tag=` query parameter). | `200 OK` |
| **GET** | `/api/v1/notes/{id}` | Retrieve details for a single note by its unique ID. | `200 OK` |
| **POST** | `/api/v1/notes` | Create a new note record. | `201 Created` |
| **PUT** | `/api/v1/notes/{id}` | Completely update an existing note by its unique ID. | `200 OK` |
| **DELETE** | `/api/v1/notes/{id}` | Permanently delete a note by its unique ID. | `204 No Content` |
| **GET** | `/api/v1/tags` | Retrieve all tags associated with the authenticated user's notes. | `200 OK` |

---

## 2. Request and Response Examples

### A. List Notes (`GET /api/v1/notes`)
* **Request Headers:**
  ```http
  Authorization: Bearer <jwt_token>
  Accept: application/json
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "count": 2,
      "notes": [
        {
          "id": 101,
          "title": "Project Architecture Draft",
          "body": "Finalize the system diagram and review read replica scaling.",
          "user_id": 42,
          "created_at": "2026-06-06T10:15:30Z",
          "updated_at": "2026-06-06T10:15:30Z",
          "tags": ["work", "backend"]
        },
        {
          "id": 102,
          "title": "Grocery Shopping",
          "body": "Milk, eggs, coffee beans, and fresh bread.",
          "user_id": 42,
          "created_at": "2026-06-06T08:00:00Z",
          "updated_at": "2026-06-06T08:00:00Z",
          "tags": ["personal"]
        }
      ]
    }
  }
  ```

### B. Create a Note (`POST /api/v1/notes`)
* **Request Headers:**
  ```http
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
  ```
* **Request Body:**
  ```json
  {
    "title": "Sprint Planning Notes",
    "body": "Discuss database migration schedules and CDN caching policies.",
    "tags": ["work", "planning"]
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Note created successfully",
    "data": {
      "id": 103,
      "title": "Sprint Planning Notes",
      "body": "Discuss database migration schedules and CDN caching policies.",
      "user_id": 42,
      "created_at": "2026-06-06T12:30:00Z",
      "updated_at": "2026-06-06T12:30:00Z",
      "tags": ["work", "planning"]
    }
  }
  ```

---

## 3. Error Handling and Status Codes

The API returns standard HTTP status codes along with a consistent JSON error body format:

```json
{
  "status": "error",
  "code": 400,
  "message": "Validation failed",
  "errors": {
    "title": "The title field is required and cannot exceed 100 characters."
  }
}
```

### Common Error Status Codes:
* **`400 Bad Request`**: Triggered when client payload validation fails (e.g., missing mandatory `title`, title exceeds 100 characters, or malformed JSON syntax).
* **`401 Unauthorized`**: Triggered when a request lacks a valid authentication token or the token has expired.
* **`403 Forbidden`**: Triggered when an authenticated user attempts to access or modify a resource (such as another user's note) that they do not have permissions for.
* **`404 Not Found`**: Triggered when the requested note ID or endpoint URL does not exist on the server.
* **`500 Internal Server Error`**: Triggered by unexpected server-side failures, such as unhandled database connection losses or query timeouts.