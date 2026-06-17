// 🔗 YAHAN APNA CLOUDFLARE WORKER URL PASTE KARO
const API_URL = "https://sahilfiles.sahilsuthar687.workers.dev/";

// Auth Check
if (!localStorage.getItem("tg_auth")) window.location.href = "login.html";

function logout() {
  localStorage.removeItem("tg_auth");
  window.location.href = "login.html";
}

// File Upload Handler
document.getElementById("fileInput").addEventListener("change", async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const status = document.getElementById("uploadStatus");
  status.textContent = "⏳ Uploading to Telegram...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      status.textContent = "✅ Upload Successful!";
      saveFileMeta(data);
      renderList();
    } else {
      status.textContent = "❌ " + (data.message || data.error || "Upload failed");
    }
  } catch (err) {
    status.textContent = "❌ Network Error";
  }
  e.target.value = ""; // Reset input
});

// Save Metadata to LocalStorage (No DB/KV needed)
function saveFileMeta(meta) {
  let files = JSON.parse(localStorage.getItem("tg_files") || "[]");
  files.unshift(meta); // Newest first
  localStorage.setItem("tg_files", JSON.stringify(files));
}

// Render File List
function renderList() {
  const listDiv = document.getElementById("fileList");
  const files = JSON.parse(localStorage.getItem("tg_files") || "[]");

  if (files.length === 0) {
    listDiv.innerHTML = "<p class='status'>Koi file upload nahi hui.</p>";
    return;
  }

  listDiv.innerHTML = "";
  files.forEach(f => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
    const date = new Date(f.date).toLocaleDateString();
    
    const item = document.createElement("div");
    item.className = "file-item";
    item.innerHTML = `
      <div class="f-info">
        <div class="f-name">${f.name}</div>
        <div class="f-meta">${sizeMB} MB • ${date}</div>
      </div>
      <div class="f-actions">
        <button class="btn-view" onclick="window.open('${API_URL}/view?file_id=${f.file_id}&name=${encodeURIComponent(f.name)}', '_blank')">👁️ View</button>
        <button class="btn-down" onclick="window.open('${API_URL}/download?file_id=${f.file_id}&name=${encodeURIComponent(f.name)}', '_blank')">⬇️ Download</button>
      </div>
    `;
    listDiv.appendChild(item);
  });
}

// Initial Load
renderList();
