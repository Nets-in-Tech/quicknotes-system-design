// ==========================================
// API Client - Task 1 & Task 2 (GET & POST)
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

// Reusable request wrapper with error checking and try/catch
async function request(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
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

// Helper to add individual notes to UI
function appendNoteToUI(note, prepend = false) {
    const emptyState = notesList.querySelector(".empty-state");
    if (emptyState) {
        emptyState.remove();
    }

    const li = document.createElement("li");
    li.className = "note-card";

    const titleDiv = document.createElement("div");
    titleDiv.className = "note-title";
    titleDiv.textContent = note.title;

    const bodyDiv = document.createElement("div");
    bodyDiv.className = "note-body";
    bodyDiv.textContent = note.body;

    li.appendChild(titleDiv);
    li.appendChild(bodyDiv);

    if (prepend) {
        notesList.prepend(li);
    } else {
        notesList.appendChild(li);
    }
}

// Load 10 notes via GET
async function loadNotes() {
    loadBtn.disabled = true;
    statusP.textContent = "Loading notes...";
    statusP.className = "loading";

    try {
        const response = await request(`${API_URL}?_limit=10`);
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

// Create a note via POST
async function handleCreateNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    // Validation: Title required, max 100 characters
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
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                title,
                body,
                userId: 1,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }

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

// Event Listeners
loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", handleCreateNote);