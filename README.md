# QuickNotes System Design & API Client

QuickNotes is a comprehensive full-stack service design and frontend implementation project. It bridges the gap between a client-side JavaScript application and a production-ready cloud architecture designed to scale to 1 million daily active users.

---

## Project Overview

This repository contains two main parts:
1. **Frontend API Client (`index.html`, `style.css`, `api.js`):** A vanilla JavaScript application that successfully communicates with a remote REST API (JSONPlaceholder) supporting `GET`, `POST`, and `DELETE` operations with robust loading, success, error, and empty states.
2. **System Design & Architecture Documentation (`docs/`):** Comprehensive engineering documentation covering REST API endpoints, a normalized relational database schema, and a high-availability cloud architecture scaling plan.

---

## How to Run the API Client Locally

1. Clone or download this repository to your local computer.
2. Ensure all root files (`index.html`, `style.css`, `api.js`) and the `docs/` folder reside in the repository root.
3. Open `index.html` directly in any modern web browser, or serve it using a local development server such as the **Live Server** extension in Visual Studio Code.
4. Click **"Load notes"** to fetch records, use the form to **Create** new notes, and click **Delete** on any note card to remove entries.

---

## Documentation Links

* [API Design Document](docs/api-design.md) - Details REST endpoints, request/response JSON payloads, and HTTP error codes.
* [Data Model Document](docs/data-model.md) - Details entities, columns, primary/foreign keys, relational diagrams, SQL queries, and SQL vs NoSQL justification.
* [Architecture Document](docs/architecture.md) - Details functional/non-functional requirements, traffic capacity estimations, system architecture diagram, component explanations, request flows, and trade-offs.

---

## What I Learned

1. **Robust Asynchronous Error Handling**: Implementing reusable `fetch` wrapper functions using `async/await` and `try/catch/finally` blocks to gracefully handle network failures and manage button states.
2. **Relational Database Design**: Designing normalized schemas with primary keys, foreign keys, unique constraints, and join tables to efficiently model many-to-many relationships while maintaining ACID compliance.
3. **Large-Scale System Architecture**: Calculating read/write throughput and annual storage growth for 1 million active users, and designing resilient, scalable architectures utilizing CDNs, Load Balancers, Read Replicas, Caches, and Asynchronous Message Queues.