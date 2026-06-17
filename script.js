// 🔗 YAHAN APNA CLOUDFLARE WORKER URL PASTE KARO
const API_URL = "https://sahilfiles.sahilsuthar687.workers.dev/";
const DEFAULT_CREDENTIALS = { username: "admin", password: "mysecret123" };

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const fileListDiv = document.getElementById("fileList");
  const session = JSON.parse(localStorage.getItem("tg_session") || "null");

  if (loginForm && session) { window.location.href = "./dashboard.html"; return; }
  if (fileListDiv && !session) { window.location.href = "./login.html"; return; }

  // ================= LOGIN =================
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const user = document.getElementById("username").value.trim();
      const pass = document.getElementById("password").value;
      const msg = document.getElementById("loginMsg");

      if (user === DEFAULT_CREDENTIALS.username && pass === DEFAULT_CREDENTIALS.password) {
        localStorage.setItem("tg_session", JSON.stringify({ user, loginTime: new Date().toISOString() }));
        msg.textContent = "✅ Login Successful! Redirecting...";
        msg.style.color = "#22c55e";
        setTimeout(() => window.location.href = "./dashboard.html", 600);
      } else {
        msg.textContent = "❌ Invalid Username or Password!";
        msg.style.color = "#ef4444";
      }
    });
  }

  // ================= DASHBOARD =================
  if (fileListDiv) {
    document.getElementById("displayUser").textContent = session.user;
    document.getElementById("loginTime").textContent = `Logged in: ${new Date(session.loginTime).toLocaleString()}`;

    window.logout = () => { localStorage.removeItem("tg_session"); window.location.href = "./login.html"; };
    window.clearLocalList = () => {
      if(confirm("List clear ho jayegi. Files Telegram mein safe rahengi. Continue?")) {
        localStorage.removeItem("tg_files");
        renderFiles();
        logActivity("🗑️ Clear", "Local file list cleared");
      }
    };

    // 📤 UPLOAD WITH PROGRESS %
    document.getElementById("fileInput").addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const category = document.getElementById("categorySelect").value;
      const statusEl = document.getElementById("uploadStatus");
      const progressBar = document.getElementById("progressBar");
      const progressText = document.getElementById("progressText");
      const progressContainer = document.getElementById("progressContainer");

      statusEl.textContent = "⏳ Starting upload...";
      statusEl.style.color = "#94a3b8";
      progressBar.style.width = "0%";
      progressText.textContent = "0%";
      progressContainer.style.display = "flex";

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/upload`, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          progressBar.style.width = percent + "%";
          progressText.textContent = percent + "%";
          statusEl.textContent = `⏳ Uploading: ${percent}%`;
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              statusEl.textContent = "✅ Upload Successful!";
              statusEl.style.color = "#22c55e";
              saveFile({ ...data, category, uploadTime: new Date().toISOString() });
              logActivity("📤 Upload", `${file.name} (${category})`);
              renderFiles();
            } else {
              statusEl.textContent = "❌ " + (data.message || data.error || "Upload failed");
              statusEl.style.color = "#ef4444";
            }
          } catch {
            statusEl.textContent = "❌ Invalid server response";
            statusEl.style.color = "#ef4444";
          }
        } else {
          statusEl.textContent = `❌ Server Error (${xhr.status})`;
          statusEl.style.color = "#ef4444";
        }
        setTimeout(() => progressContainer.style.display = "none", 2000);
      };

      xhr.onerror = () => {
        statusEl.textContent = "❌ Network/CORS Error. Check Worker URL.";
        statusEl.style.color = "#ef4444";
        progressContainer.style.display = "none";
      };

      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
      e.target.value = "";
    });

    // 💾 DB FUNCTIONS
    function saveFile(meta) {
      let files = JSON.parse(localStorage.getItem("tg_files") || "[]");
      files.unshift(meta);
      localStorage.setItem("tg_files", JSON.stringify(files));
    }
    function logActivity(type, detail) {
      let logs = JSON.parse(localStorage.getItem("tg_logs") || "[]");
      logs.unshift({ type, detail, time: new Date().toLocaleString() });
      if (logs.length > 50) logs.pop();
      localStorage.setItem("tg_logs", JSON.stringify(logs));
      renderLogs();
    }

    let currentFilter = "All";
    window.filterFiles = (cat) => {
      currentFilter = cat;
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      event.target.classList.add("active");
      renderFiles();
    };

    function renderFiles() {
      let files = JSON.parse(localStorage.getItem("tg_files") || "[]");
      if (currentFilter !== "All") files = files.filter(f => f.category === currentFilter);
      if (files.length === 0) { fileListDiv.innerHTML = "<p class='status'>No files found.</p>"; return; }
      fileListDiv.innerHTML = "";
      files.forEach(f => {
        const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
        const date = new Date(f.uploadTime || f.date).toLocaleDateString();
        const item = document.createElement("div");
        item.className = "file-item";
        item.innerHTML = `
          <div class="f-info"><div class="f-name">${f.name} <span class="f-tag">${f.category}</span></div><div class="f-meta">${sizeMB} MB • ${date}</div></div>
          <div class="f-actions">
            <button class="btn-view" onclick="window.open('${API_URL}/view?file_id=${f.file_id}&name=${encodeURIComponent(f.name)}', '_blank')">👁️ View</button>
            <button class="btn-down" onclick="window.open('${API_URL}/download?file_id=${f.file_id}&name=${encodeURIComponent(f.name)}', '_blank')">⬇️ Download</button>
          </div>`;
        fileListDiv.appendChild(item);
      });
    }

    function renderLogs() {
      const logDiv = document.getElementById("activityLog");
      if (!logDiv) return;
      const logs = JSON.parse(localStorage.getItem("tg_logs") || "[]");
      if (logs.length === 0) { logDiv.innerHTML = "No activity yet."; return; }
      logDiv.innerHTML = "";
      logs.forEach(l => {
        const item = document.createElement("div");
        item.className = "log-item";
        item.innerHTML = `<span>${l.type} • ${l.detail}</span><span class="log-time">${l.time}</span>`;
        logDiv.appendChild(item);
      });
    }

    renderFiles();
    renderLogs();
  }
});
