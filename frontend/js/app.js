// ===============================
// PDF.js WORKER (MUST BE FIRST)
// ===============================
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ===============================
// API CONFIG
// ===============================
const apiUrl = "https://fullstackprojectnotesapp-4.onrender.com/api/notes/";
const BASE_URL = "https://fullstackprojectnotesapp-4.onrender.com";

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
  themeToggle.textContent =
    document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
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

    const res = await fetch(url);
    const notes = await res.json();
    displayNotes(notes);

  } catch (error) {
    notesContainer.innerHTML = "<p>Error fetching notes</p>";
  }
}

// ===============================
// DISPLAY NOTES
// ===============================
function displayNotes(notes) {
  notesContainer.innerHTML = "";

  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = "<p>No notes found</p>";
    return;
  }

  notes.forEach(note => {
    const viewUrl = note.file.startsWith("http")
      ? note.file
      : BASE_URL + note.file;

    const downloadUrl = `${apiUrl}${note.id}/download/`;
    const ext = viewUrl.split(".").pop().toLowerCase();

    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <div class="pdf-preview" id="preview-${note.id}">
        Loading preview...
      </div>

      <h3>${note.title}</h3>
      <p>${note.description}</p>

      <div class="card-actions">
        <button class="view-btn">View</button>
        <a href="${downloadUrl}" class="download-btn">Download</a>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    // ===== PDF FIRST PAGE PREVIEW =====
    if (ext === "pdf") {
      renderPdfPreview(viewUrl, `preview-${note.id}`);
    } else {
      const box = document.getElementById(`preview-${note.id}`);
      if (box) box.innerText = "No preview";
    }

    // ===== VIEW BUTTON =====
    card.querySelector(".view-btn").addEventListener("click", () => {
      if (ext === "pdf") {
        window.open(viewUrl, "_blank");
      } else if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
        const googleViewer =
          "https://docs.google.com/gview?url=" +
          encodeURIComponent(viewUrl) +
          "&embedded=true";
        window.open(googleViewer, "_blank");
      } else {
        alert("Preview not supported. Please download.");
      }
    });

    // ===== DELETE BUTTON =====
    card.querySelector(".delete-btn").addEventListener("click", async () => {
      const confirmDelete = confirm("Are you sure you want to delete this note?");
      if (!confirmDelete) return;

      try {
        const res = await fetch(`${apiUrl}${note.id}/`, {
          method: "DELETE"
        });

        if (res.ok) {
          alert("✅ Note deleted");
          getNotes(); // refresh list
        } else {
          alert("❌ Failed to delete note");
        }
      } catch (error) {
        alert("❌ Error deleting note");
      }
    });

    notesContainer.appendChild(card);
  });
}

// ===============================
// PDF PREVIEW FUNCTION
// ===============================
async function renderPdfPreview(pdfUrl, containerId) {
  try {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdf.getPage(1);

    const scale = 0.4;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const container = document.getElementById(containerId);
    container.innerHTML = "";
    container.appendChild(canvas);

  } catch (error) {
    const container = document.getElementById(containerId);
    if (container) container.innerText = "No preview";
  }
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
      getNotes();
    } else {
      uploadMessage.innerText = "❌ Upload failed";
    }
  } catch {
    uploadMessage.innerText = "❌ Upload error";
  }
});

// ===============================
// LIVE SEARCH (DEBOUNCE)
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