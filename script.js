// 🔗 YAHAN APNA CLOUDFLARE WORKER URL PASTE KARO
const API_URL = "https://sahilfiles.sahilsuthar687.workers.dev/";
const DEFAULT_CREDENTIALS = { username: "admin", password: "mysecret123" }; // Change if needed

// ================= AUTH & SESSION =================
if (window.location.pathname.includes("login.html") || window.location.pathname === "/") {
  if (localStorage.getItem("tg_session")) window.location.href = "dashboard.html";
  
  document.getElementById("loginForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value;
    const msg = document.getElementById("loginMsg");

    if (user === DEFAULT_CREDENTIALS.username && pass === DEFAULT_CREDENTIALS.password) {
      const session = { user, loginTime: new Date().toISOString() };
      localStorage.setItem("tg_session", JSON.stringify(session));
      logActivity("🔐 Login", `User ${user} logged in`);
      window.location.href = "dashboard.html";
    } else {
      msg.textContent = "❌ Invalid Username or Password!";
      msg.style.color = "#ef4444";
    }
  });
}

// ================= DASHBOARD LOGIC =================
if (window.location.pathname.includes("dashboard.html")) {
  const session = JSON.parse(localStorage.getItem("tg_session") || "{}");
  if (!session.user) window.location.href = "login.html";

  document.getElementById("displayUser").textContent = session.user;
  document.getElementById("loginTime").textContent = `Logged in: ${new Date(session.loginTime).toLocaleString()}`;

  function logout() {
    logActivity("🚪 Logout", `User ${session.user} logged out`);
    localStorage.removeItem("tg_session");
    window.location.href = "login.html";
  }

  // 📤 Upload Handler with Category
  document.getElementById("fileInput").addEventListener("change", async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const category = document.getElementById("categorySelect").value;
    const status = document.getElementById("uploadStatus");
    status.textContent = "⏳ Uploading to Telegram...";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        status.textContent = "✅ Upload Successful!";
        const fileMeta = { ...data, category, uploadTime: new Date().toISOString() };
        saveFile(fileMeta);
        logActivity("📤 Upload", `${file.name} (${category})`);
        renderFiles();
      } else {
        status.textContent = "❌ " + (data.message || data.error || "Upload failed");
      }
    } catch (err) {
      status.textContent = "❌ Network Error";
    }
    e.target.value = "";
  });

  // 💾 Save File (DB Feature 1)
  function saveFile(meta) {
    let files = JSON.parse(localStorage.getItem("tg_files") || "[]");
    files.unshift(meta);
    localStorage.setItem("tg_files", JSON.stringify(files));
  }

  // 📊 Activity Logger (DB Feature 2)
  function logActivity(type, detail) {
    let logs = JSON.parse(localStorage.getItem("tg_logs") || "[]");
    logs.unshift({ type, detail, time: new Date().toLocaleString() });
    if (logs.length > 50) logs.pop();
    localStorage.setItem("tg_logs", JSON.stringify(logs));
    if (document.getElementById("activityLog")) renderLogs();
  }

  // 📄 Render Files with Filter (DB Feature 3)
  let currentFilter = "All";
  function filterFiles(cat) {
    currentFilter = cat;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    event.target.classList.add("active");
    renderFiles();
  }

  function renderFiles() {
    const listDiv = document.getElementById("fileList");
    let files = JSON.parse(localStorage.getItem("tg_files") || "[]");
    if (currentFilter !== "All") files = files.filter(f => f.category === currentFilter);

    if (files.length === 0) {
      listDiv.innerHTML = "<p class='status'>No files found.</p>";
      return;
    }
    listDiv.innerHTML = "";
    files.forEach(f => {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
      const date = new Date(f.uploadTime || f.date).toLocaleDateString();
      const item = document.createElement("div");
      item.className = "file-item";
      item.innerHTML = `
        <div class="f-info">
          <div class="f-name">${f.name} <span class="f-tag">${f.category}</span></div>
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

  function renderLogs() {
    const logDiv = document.getElementById("activityLog");
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
