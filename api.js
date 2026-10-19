// ==========================================
// API Client - Project 2 (Refactored api.js)
// ==========================================

const API_URL = "https://jsonplaceholder.typicode.com/posts";

// DOM Elements - GET & Status
const loadBtn = document.querySelector("#load-btn");
const statusP = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

// DOM Elements - POST Form
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");

/**
 * Centralized reusable request wrapper for all HTTP operations.
 * Ensures uniform error transformations, consistent headers, and single-point maintenance.
 */
async function request(url, options = {}) {
    // Default headers for JSON payloads
    const defaultHeaders = {
        "Content-Type": "application/json; charset=UTF-8",
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        // Allow 404 through for mock DELETE handling on JSONPlaceholder if needed,
        // otherwise strictly verify response.ok
        if (!response.ok && !(options.allow404 && response.status === 404)) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }

        return response;
    } catch (error) {
        throw error;
    }
}

// Render notes list safely using textContent
function renderNotes(notes) {
    notesList.textContent = "";

    if (!notes || notes.length === 0) {
        const emptyLi = document.createElement("li");
        emptyLi.className = "empty-state";
        emptyLi.textContent = "No notes available.";
        notesList.appendChild(emptyLi);
        return;
    }

    notes.forEach((note) => {
        appendNoteToUI(note, false);
    });
}

// Helper to append individual note cards to the DOM
function appendNoteToUI(note, prepend = false) {
    const emptyState = notesList.querySelector(".empty-state");
    if (emptyState) {
        emptyState.remove();
    }

    const li = document.createElement("li");
    li.className = "note-card";

    const contentDiv = document.createElement("div");
    contentDiv.className = "note-content";

    const titleDiv = document.createElement("div");
    titleDiv.className = "note-title";
    titleDiv.textContent = note.title;

    const bodyDiv = document.createElement("div");
    bodyDiv.className = "note-body";
    bodyDiv.textContent = note.body;

    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(bodyDiv);

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteNote(note.id, li));

    li.appendChild(contentDiv);
    li.appendChild(deleteBtn);

    if (prepend) {
        notesList.prepend(li);
    } else {
        notesList.appendChild(li);
    }
}

// 1. GET Notes
async function loadNotes() {
    loadBtn.disabled = true;
    statusP.textContent = "Loading notes...";
    statusP.className = "loading";

    try {
        const response = await request(`${API_URL}?_limit=10`, { method: "GET" });
        const data = await response.json();
        renderNotes(data);
        statusP.textContent = "Loaded 10 notes from the server.";
        statusP.className = "success";
    } catch (error) {
        statusP.textContent = `Failed to load notes: ${error.message}`;
        statusP.className = "error";
        renderNotes([]);
    } finally {
        loadBtn.disabled = false;
    }
}

// 2. POST Note
async function handleCreateNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        statusP.textContent = "Please enter a note title.";
        statusP.className = "error";
        return;
    }

    if (title.length > 100) {
        statusP.textContent = "Title must be 100 characters or fewer.";
        statusP.className = "error";
        return;
    }

    submitBtn.disabled = true;
    statusP.textContent = "Creating note...";
    statusP.className = "loading";

    try {
        const response = await request(API_URL, {
            method: "POST",
            body: JSON.stringify({
                title,
                body,
                userId: 1,
            }),
        });

        const newNote = await response.json();

        // Prepend new note to the top of the list
        appendNoteToUI(newNote, true);

        statusP.textContent = `Note created (status ${response.status}, id ${newNote.id}).`;
        statusP.className = "success";

        noteForm.reset();
    } catch (error) {
        statusP.textContent = `Failed to create note: ${error.message}`;
        statusP.className = "error";
    } finally {
        submitBtn.disabled = false;
    }
}

// 3. DELETE Note
async function deleteNote(id, listItemElement) {
    statusP.textContent = `Deleting note ${id}...`;
    statusP.className = "loading";

    try {
        const response = await request(`${API_URL}/${id}`, {
            method: "DELETE",
            allow404: true, // Gracefully handle newly created mock IDs in JSONPlaceholder
        });

        listItemElement.remove();
        statusP.textContent = `Note ${id} deleted successfully.`;
        statusP.className = "success";

        if (notesList.children.length === 0) {
            renderNotes([]);
        }
    } catch (error) {
        statusP.textContent = `Failed to delete note: ${error.message}`;
        statusP.className = "error";
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", handleCreateNote);