# QuickNotes System Architecture & Scaling Plan

This document outlines the functional/non-functional requirements, traffic capacity estimates, system architecture, request flows, trade-offs, and high-availability strategies for scaling QuickNotes to 1 million active users.

---

## 1. System Requirements

### Functional Requirements
* Users must be able to securely register, log in, and authenticate via JWT tokens.
* Users can create, read, update, and delete their own notes.
* Users can organize and filter notes using category tags.
* The frontend client must dynamically communicate with backend REST endpoints with real-time error feedback and loading states.

### Non-Functional Requirements
* **High Availability:** Target 99.9% uptime to ensure continuous service availability.
* **Low Latency:** Read requests (feed loading) should respond in under 200ms globally.
* **Security:** All traffic encrypted in transit via HTTPS/TLS; passwords hashed securely using Argon2/bcrypt.
* **Scalability:** Horizontal scaling capabilities across application and database layers to support traffic spikes smoothly.

---

## 2. Load Estimates (1 Million Daily Active Users)

### Core Assumptions
* **Daily Active Users (DAU):** 1,000,000
* **User Activity Rate:** 
  * Each active user creates/updates 5 notes per day.
  * Each active user views/reads their note lists 50 times per day.
* **Data Size:** Average note payload size (title, body, metadata, tags) = 2 KB.
* **Time Conversion:** 1 day = 86,400 seconds.

### Calculations
* **Writes (Creates/Updates):**
  * Total daily writes = $1,000,000 \times 5 = 5,000,000 \text{ writes/day}$.
  * Average write throughput = $5,000,000 / 86400 \approx \mathbf{57.87 \text{ writes/sec}}$.
  * Peak write throughput ($5\times$ peak factor) $\approx \mathbf{289 \text{ writes/sec}}$.
* **Reads (GET requests):**
  * Total daily reads = $1,000,000 \times 50 = 50,000,000 \text{ reads/day}$.
  * Average read throughput = $50,000,000 / 86400 \approx \mathbf{578.70 \text{ reads/sec}}$.
  * Peak read throughput ($5\times$ peak factor) $\approx \mathbf{2,893 \text{ reads/sec}}$.
* **Storage per Year:**
  * Daily data volume = $5,000,000 \text{ notes} \times 2 \text{ KB} = 10,000,000 \text{ KB} \approx 10 \text{ GB/day}$.
  * Annual storage requirement = $10 \text{ GB/day} \times 365 \text{ days} = \mathbf{3,650 \text{ GB} \approx 3.65 \text{ TB/year}}$.

---

## 3. System Architecture Diagram

```
+---------------------------------------+
|        Client (Browser / Mobile)      |
+---------------------------------------+
                    |
                    v
+---------------------------------------+
|         DNS (Route 53 / Cloudflare)   |
+---------------------------------------+
                    |
          +---------+---------+
          |                   |
          v                   v
+-------------------+ +-----------------+
|     CDN (Assets)  | |  Load Balancer  |
+-------------------+ +-----------------+
                              |
                     +--------+--------+
                     |                 |
                     v                 v
             +---------------+ +---------------+
             | App Server 1  | | App Server 2  |
             +---------------+ +---------------+
                     |                 |
         +-----------+-------+---------+-----------+
         |                   |                     |
         v                   v                     v
+-----------------+ +-------------------+ +-------------------+
|  Cache (Redis)  | | Message Queue     | | Primary Database  |
|                 | | (SQS / RabbitMQ)  | | (Writes)          |
+-----------------+ +-------------------+ +-------------------+
                             |                       |
                             v              (Replication Stream)
                     +---------------+               |
                     | Async Worker  |               v
                     +---------------+ +-------------------+
                                       | Read Replica      |
                                       | (Reads)           |
                                       +-------------------+
```

---

## 4. Component Explanations

* **Client:** Renders the user interface and sends asynchronous HTTP requests to backend API services.
* **DNS:** Resolves domain names to IP addresses and routes users to the nearest regional data center.
* **CDN:** Caches and delivers static frontend assets globally at the edge to reduce server load and latency.
* **Load Balancer:** Distributes incoming web and API traffic evenly across multiple backend application servers to ensure high availability.
* **App Servers:** Stateless servers that execute business logic, authenticate requests, and process API payloads.
* **Cache:** An in-memory data store (Redis) that caches frequent database queries and user sessions for sub-millisecond retrieval.
* **Message Queue:** Buffers asynchronous background tasks and job requests to decouple heavy processing from immediate HTTP cycles.
* **Async Worker:** Background service that consumes queued jobs to handle offloaded tasks like analytics or bulk notifications.
* **Primary Database:** Relational database instance dedicated to handling write operations and maintaining strict ACID consistency.
* **Read Replica:** Synchronized database clone dedicated to handling high-volume read queries to relieve pressure off the primary node.

---

## 5. Step-by-Step Request Flows

### A. Flow for `GET /notes`
1. The client sends an HTTP `GET /api/v1/notes` request with a JWT Bearer token to the domain.
2. The Load Balancer receives the request and routes it to an available App Server.
3. The App Server validates the JWT token and checks the **In-Memory Cache (Redis)** for cached note lists belonging to the user.
4. If a cache miss occurs, the App Server queries the **Database Read Replica** to fetch the user's notes.
5. The database returns the result set, which the App Server caches in Redis for subsequent requests and returns as a JSON response (`200 OK`) to the client.

### B. Flow for `POST /notes`
1. The client sends an HTTP `POST /api/v1/notes` request containing the note title, body, and authentication token.
2. The Load Balancer routes the request to an App Server.
3. The App Server validates the user's authentication token and validates the payload (e.g., checking that the title is present and $\le 100$ characters).
4. Upon successful validation, the App Server writes the new note record into the **Primary Database**.
5. The database commits the transaction and returns the newly created record (including its generated ID and timestamp).
6. The App Server invalidates the user's stale cache keys in Redis and returns a `201 Created` response with the new note payload to the client.

---

## 6. System Trade-offs & Single Points of Failure (SPOF) Avoidance

### Trade-off 1: Consistency vs. Availability in Replication
* **Decision:** Utilizing asynchronous replication between the Primary Database and Read Replicas.
* **Pros:** Maximizes read throughput and scales read performance horizontally without blocking write transactions.
* **Cons:** Introduces minor replication lag; a user might experience eventual consistency where an updated note takes a fraction of a second to appear on subsequent read queries.

### Trade-off 2: Cache Invalidation vs. Stale Reads
* **Decision:** Implementing a cache-aside pattern where writes invalidate cache keys.
* **Pros:** Drastically reduces database query loads and ensures blazing-fast dashboard loads.
* **Cons:** Adds complexity to application code; if cache invalidation logic fails, users may temporarily see stale data until TTL expires.

### How Single Points of Failure (SPOFs) Are Avoided
* **App Servers:** Deployed across multiple redundant nodes behind an intelligent Load Balancer that automatically reroutes traffic if a server instance fails.
* **Database:** Configured with active-passive replication. If the Primary Database node experiences hardware failure, automated failover promotes a Read Replica to become the new primary master.
* **Infrastructure:** Deployed across multiple Availability Zones (Multi-AZ cloud infrastructure) to survive data-center-level outages.