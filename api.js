// ==========================================
// API Client - Task 1 (GET Notes)
// ==========================================

const API_URL = "https://jsonplaceholder.typicode.com/posts";

// DOM Elements
const loadBtn = document.querySelector("#load-btn");
const statusP = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

// Reusable request wrapper with error checking and try/catch
async function request(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }
        return await response.json();
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
        notesList.appendChild(li);
    });
}

// Load 10 notes via GET
async function loadNotes() {
    loadBtn.disabled = true;
    statusP.textContent = "Loading notes...";
    statusP.className = "loading";

    try {
        const data = await request(`${API_URL}?_limit=10`);
        renderNotes(data);
        statusP.textContent = "Loaded 10 notes from the server.";
        statusP.className = "success";
    } catch (error) {
        statusP.textContent = `Failed to load notes: ${error.message}`;
        statusP.className = "error";
        renderNotes([]); // Show empty state on failure
    } finally {
        loadBtn.disabled = false;
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadNotes);