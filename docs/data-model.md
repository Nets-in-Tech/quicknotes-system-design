# QuickNotes Relational Data Model

This document outlines the database schema, table structures, relationships, indexes, and architectural rationale for the production-ready QuickNotes backend.

---

## 1. Entities and Columns

### A. `users` Table
Stores registered user account information.
* `user_id`: `INTEGER` (Primary Key, Auto-increment)
* `username`: `VARCHAR(50)` (Not Null, Unique)
* `email`: `VARCHAR(100)` (Not Null, Unique)
* `created_at`: `TIMESTAMP` (Default: Current Timestamp)

### B. `notes` Table
Stores individual note content created by users.
* `note_id`: `INTEGER` (Primary Key, Auto-increment)
* `user_id`: `INTEGER` (Foreign Key referencing `users(user_id)`, Not Null)
* `title`: `VARCHAR(100)` (Not Null)
* `body`: `TEXT` (Nullable)
* `created_at`: `TIMESTAMP` (Default: Current Timestamp)
* `updated_at`: `TIMESTAMP` (Default: Current Timestamp)

### C. `tags` Table
Stores unique category or organizational tags.
* `tag_id`: `INTEGER` (Primary Key, Auto-increment)
* `name`: `VARCHAR(30)` (Not Null, Unique)

### D. `note_tags` (Join Table)
Resolves the many-to-many relationship between notes and tags.
* `note_id`: `INTEGER` (Foreign Key referencing `notes(note_id)`, Not Null)
* `tag_id`: `INTEGER` (Foreign Key referencing `tags(tag_id)`, Not Null)
* **Composite Primary Key:** (`note_id`, `tag_id`)

---

## 2. Entity Relationships

* **Users to Notes (One-to-Many):** A single user can create and own multiple notes, but each note belongs to exactly one user. Enforced by the `user_id` foreign key in the `notes` table.
* **Notes to Tags (Many-to-Many):** A single note can be associated with multiple tags (e.g., `#work`, `#urgent`), and a single tag can be applied to many different notes. This relationship is implemented using the `note_tags` associative join table.

---

## 3. CREATE TABLE Statements

```sql
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    note_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE tags (
    tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);
```

---

## 4. Example SQL Queries

### Query 1: Retrieve all notes for a specific user
```sql
SELECT note_id, title, body, created_at 
FROM notes 
WHERE user_id = 42 
ORDER BY created_at DESC;
```

### Query 2: Retrieve all tags associated with a specific note (JOIN)
```sql
SELECT t.name AS tag_name
FROM tags t
JOIN note_tags nt ON t.tag_id = nt.tag_id
WHERE nt.note_id = 101;
```

### Query 3: Count how many notes belong to each user
```sql
SELECT u.username, COUNT(n.note_id) AS total_notes
FROM users u
LEFT JOIN notes n ON u.user_id = n.user_id
GROUP BY u.user_id, u.username;
```

---

## 5. Recommended Database Index

```sql
CREATE INDEX idx_notes_user_id ON notes(user_id);
```

### Reason for Index Choice
In a multi-user note-taking application, fetching a user's personal feed (`SELECT * FROM notes WHERE user_id = ?`) is the most frequent and critical database operation. Without an index on `user_id`, the database engine would perform an expensive full-table scan across every note in the system as user growth scales toward 1 million users. Adding this B-tree index ensures that user note lookups execute in logarithmic time ($O(\log n)$), keeping dashboard load times exceptionally fast.

---

## 6. Architectural Decision: SQL vs. NoSQL

For QuickNotes, a relational **SQL database** (such as PostgreSQL) is chosen over a NoSQL document store. Note-taking and user management require strict data integrity, structured schemas, and ACID transactional guarantees (e.g., ensuring orphan records are prevented and user relations remain consistent). Relational constraints like foreign keys and unique emails guarantee data validity at the database layer, which is essential for user authentication and relational queries like tag filtering and note ownership verification.