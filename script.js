// 🔗 YAHAN APNA CLOUDFLARE WORKER URL PASTE KARO
const API_URL = "https://sahilfiles.sahilsuthar687.workers.dev/";
const DEFAULT_CREDENTIALS = { username: "admin", password: "mysecret123" };

document.addEventListener("DOMContentLoaded", () => {
  // Page detection by element existence (URL path independent)
  const loginForm = document.getElementById("loginForm");
  const fileListDiv = document.getElementById("fileList");
  const session = JSON.parse(localStorage.getItem("tg_session") || "null");

  // 🔁 Auto Redirect Logic
  if (loginForm && session) {
    window.location.href = "./dashboard.html";
    return;
  }
  if (fileListDiv && !session) {
    window.location.href = "./login.html";
    return;
  }

  // ================= LOGIN PAGE LOGIC =================
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault(); // Page reload rokta hai
      const user = document.getElementById("username").value.trim();
      const pass = document.getElementById("password").value;
      const msg = document.getElementById("loginMsg");

      if (user === DEFAULT_CREDENTIALS.username && pass === DEFAULT_CREDENTIALS.password) {
        const sessionData = { user, loginTime: new Date().toISOString() };
        localStorage.setItem("tg_session", JSON.stringify(sessionData));
        msg.textContent = "✅ Login Successful! Redirecting...";
        msg.style.color = "#22c55e";
        
        // Thoda delay taaki user message dekh sake
        setTimeout(() => {
          window.location.href = "./dashboard.html";
        }, 600);
      } else {
        msg.textContent = "❌ Invalid Username or Password!";
        msg.style.color = "#ef4444";
      }
    });
  }

  // ================= DASHBOARD LOGIC =================
  if (fileListDiv) {
    document.getElementById("displayUser").textContent = session.user;
    document.getElementById("loginTime").textContent = `Logged in: ${new Date(session.loginTime).toLocaleString()}`;

    window.logout = function() {
      localStorage.removeItem("tg_session");
      window.location.href = "./login.html";
    };

    // 📤 Upload Handler
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
        status.textContent = "❌ Network or CORS Error";
      }
      e.target.value = "";
    });

    // 💾 Save File
    function saveFile(meta) {
      let files = JSON.parse(localStorage.getItem("tg_files") || "[]");
      files.unshift(meta);
      localStorage.setItem("tg_files", JSON.stringify(files));
    }

    // 📊 Activity Logger
    function logActivity(type, detail) {
      let logs = JSON.parse(localStorage.getItem("tg_logs") || "[]");
      logs.unshift({ type, detail, time: new Date().toLocaleString() });
      if (logs.length > 50) logs.pop();
      localStorage.setItem("tg_logs", JSON.stringify(logs));
      renderLogs();
    }

    // 📄 Render & Filter Files
    let currentFilter = "All";
    window.filterFiles = function(cat) {
      currentFilter = cat;
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      event.target.classList.add("active");
      renderFiles();
    };

    function renderFiles() {
      let files = JSON.parse(localStorage.getItem("tg_files") || "[]");
      if (currentFilter !== "All") files = files.filter(f => f.category === currentFilter);

      if (files.length === 0) {
        fileListDiv.innerHTML = "<p class='status'>No files found.</p>";
        return;
      }
      fileListDiv.innerHTML = "";
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
