// ===============================
// API CONFIG
// ===============================
const apiUrl = "http://127.0.0.1:8000/api/notes/";
const BASE_URL = "http://127.0.0.1:8000";

// ===============================
// DOM ELEMENTS
// ===============================
const notesContainer = document.getElementById("notesContainer");
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");

// ===============================
// DARK / LIGHT MODE
// ===============================
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

// ===============================
// FETCH NOTES
// ===============================
async function getNotes() {
  try {
    const searchText = searchInput.value.trim();
    let url = apiUrl;

    if (searchText) {
      url += `?search=${encodeURIComponent(searchText)}`;
    }

    const res = await fetch(url, { method: "GET" });
    const notes = await res.json();

    displayNotes(notes);

  } catch (error) {
    console.error("Error fetching notes:", error);
    notesContainer.innerHTML = "<p>Error fetching notes</p>";
  }
}

// ===============================
// DISPLAY NOTES AS CARDS
// ===============================
function displayNotes(notes) {
  notesContainer.innerHTML = "";

  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = "<p>No notes found</p>";
    return;
  }

  notes.forEach(note => {
    const fileUrl = note.file.startsWith("http") ? note.file : BASE_URL + note.file;

    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.description}</p>
      <div class="card-actions">
        <button class="view-btn">View</button>
        <button class="download-btn">Download</button>
      </div>
    `;

    // 🔹 View button → open PDF in new tab
    card.querySelector(".view-btn").addEventListener("click", () => {
      window.open(fileUrl, "_blank");
    });

    // 🔹 Download button → fetch file and download
    card.querySelector(".download-btn").addEventListener("click", async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();

        const link = document.createElement("a");
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = note.title + ".pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Failed to download file.");
      }
    });

    notesContainer.appendChild(card);
  });
}

// ===============================
// UPLOAD NOTE
// ===============================
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("file", document.getElementById("file").files[0]);

  try {
    const res = await fetch(apiUrl, { method: "POST", body: formData });
    if (res.ok) {
      uploadMessage.innerText = "✅ Note uploaded!";
      uploadForm.reset();
      getNotes(); // refresh all notes
    } else {
      uploadMessage.innerText = "❌ Failed to upload note";
    }
  } catch (error) {
    uploadMessage.innerText = "❌ Error uploading note";
  }
});

// ===============================
// LIVE SEARCH (DEBOUNCED)
// ===============================
let searchTimeout;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(getNotes, 300);
});

// ===============================
// INITIAL LOAD
// ===============================
getNotes();
