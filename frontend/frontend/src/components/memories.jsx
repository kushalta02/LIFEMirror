
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const categoryLabels = {
  preference: "Preferences",
  goal: "Goals",
  important_context: "Important context",
  boundary: "Personal boundaries",
};

function getToken() {
  return sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong. Please try again.");
  }

  return data;
}

export default function Memories() {
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [pendingData, savedData] = await Promise.all([
        apiRequest("/memory/suggestions"),
        apiRequest("/memory"),
      ]);

      setSuggestions(
        Array.isArray(pendingData.suggestions) ? pendingData.suggestions : []
      );

      const saved = Array.isArray(savedData)
        ? savedData
        : Array.isArray(savedData.memories)
          ? savedData.memories
          : [];

      setMemories(saved);
    } catch (err) {
      setError(err.message || "Couldn't load your memories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  async function approveSuggestion(item) {
    const id = item._id;
    setBusyId(id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/memory/suggestions/${id}/approve`, {
        method: "POST",
      });

      setSuggestions((current) => current.filter((entry) => entry._id !== id));
      await loadSavedOnly();
      setNotice("Saved. I'll keep this in mind. ♡");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function rejectSuggestion(item) {
    const id = item._id;
    setBusyId(id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/memory/suggestions/${id}/reject`, {
        method: "POST",
      });

      setSuggestions((current) => current.filter((entry) => entry._id !== id));
      setNotice("No problem. This won't be saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function loadSavedOnly() {
    const data = await apiRequest("/memory");
    setMemories(
      Array.isArray(data)
        ? data
        : Array.isArray(data.memories)
          ? data.memories
          : []
    );
  }

  async function deleteMemory(item) {
    const id = item._id;
    setBusyId(id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/memory/${id}`, { method: "DELETE" });
      setMemories((current) => current.filter((entry) => entry._id !== id));
      setNotice("Memory deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="lm-memory-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

        .lm-memory-page, .lm-memory-page * { box-sizing: border-box; }
        .lm-memory-page {
          min-height: 100vh;
          padding: 30px clamp(16px, 5vw, 70px) 60px;
          color: #f1f3f5;
          background:
            radial-gradient(ellipse at 8% 0%, #78e4bb16, transparent 34%),
            radial-gradient(ellipse at 95% 85%, #b9aaff15, transparent 32%),
            #0d1014;
          font-family: 'DM Sans', sans-serif;
        }
        .lm-memory-wrap { max-width: 1050px; margin: 0 auto; }
        .lm-memory-top {
          display:flex; align-items:center; justify-content:space-between;
          gap:14px; margin-bottom:55px;
        }
        .lm-memory-brand {
          display:flex; align-items:center; gap:11px;
          color:#f1f3f5; font:800 17px Manrope,sans-serif;
        }
        .lm-memory-mark {
          width:40px;height:40px;display:grid;place-items:center;
          border:1px solid #78e4bb44;border-radius:13px;
          color:#a9f2d4;background:#78e4bb13;font-size:21px;
        }
        .lm-memory-nav { display:flex; gap:9px; flex-wrap:wrap; }
        .lm-memory-nav button {
          border:1px solid #ffffff18;border-radius:11px;
          padding:10px 14px;color:#cbd5d1;background:#ffffff08;
          cursor:pointer;font:600 12px 'DM Sans',sans-serif;
          transition:.2s;
        }
        .lm-memory-nav button:hover {
          border-color:#78e4bb66;background:#78e4bb12;color:#c7f5df;
          transform:translateY(-2px);
        }
        .lm-memory-heading { max-width:650px; margin-bottom:35px; }
        .lm-memory-eyebrow {
          color:#78e4bb;font-size:10px;font-weight:700;
          letter-spacing:2.3px;text-transform:uppercase;
        }
        .lm-memory-heading h1 {
          margin:13px 0 12px;color:#f4f5f6;
          font:800 clamp(32px,5vw,49px)/1.12 Manrope,sans-serif;
          letter-spacing:-1.8px;
        }
        .lm-memory-heading h1 span { color:#a9e8ca; }
        .lm-memory-heading p {
          margin:0;color:#9ba8a5;font-size:13px;line-height:1.9;
        }
        .lm-memory-note {
          display:flex;align-items:flex-start;gap:12px;
          padding:15px 17px;margin-bottom:35px;
          border:1px solid #b9aaff25;border-radius:15px;
          background:linear-gradient(110deg,#b9aaff0c,#78e4bb08);
          color:#b9c0c8;font-size:12px;line-height:1.8;
        }
        .lm-memory-note b { color:#d5caff; }
        .lm-memory-section { margin-top:38px; }
        .lm-memory-section-head {
          display:flex;align-items:center;justify-content:space-between;
          gap:12px;margin-bottom:17px;
        }
        .lm-memory-section-head h2 {
          margin:0;color:#edf2f0;
          font:700 19px Manrope,sans-serif;letter-spacing:-.4px;
        }
        .lm-memory-count {
          padding:6px 10px;border:1px solid #78e4bb2b;border-radius:30px;
          color:#9ee8c4;background:#78e4bb10;font-size:10px;font-weight:700;
        }
        .lm-memory-list { display:grid;gap:12px; }
        .lm-memory-card {
          position:relative;padding:20px;
          border:1px solid #ffffff13;border-radius:17px;
          background:linear-gradient(135deg,#19211f,#151b20);
          box-shadow:0 12px 30px #0002;
          animation:memoryIn .4s ease both;
          transition:border-color .2s,transform .2s;
        }
        .lm-memory-card:hover {
          transform:translateY(-2px);border-color:#78e4bb35;
        }
        .lm-memory-card-top {
          display:flex;align-items:center;justify-content:space-between;
          gap:12px;margin-bottom:12px;
        }
        .lm-memory-category {
          display:inline-flex;align-items:center;gap:7px;
          padding:6px 9px;border:1px solid #b9aaff2b;border-radius:30px;
          color:#c9bdff;background:#b9aaff10;
          font-size:10px;font-weight:700;
        }
        .lm-memory-date { color:#718078;font-size:10px; }
        .lm-memory-content {
          margin:0;color:#e4ebe7;font-size:13px;line-height:1.85;
          overflow-wrap:anywhere;
        }
        .lm-memory-actions {
          display:flex;gap:8px;flex-wrap:wrap;margin-top:17px;
        }
        .lm-memory-actions button {
          padding:9px 13px;border-radius:10px;cursor:pointer;
          font:700 11px 'DM Sans',sans-serif;transition:.2s;
        }
        .lm-memory-actions button:disabled { opacity:.45;cursor:wait; }
        .lm-memory-approve {
          border:1px solid #78e4bb55;color:#12271e;
          background:linear-gradient(135deg,#a8f0ce,#78dcb1);
        }
        .lm-memory-approve:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 6px 17px #78e4bb25; }
        .lm-memory-reject {
          border:1px solid #ffffff1b;color:#b5bfba;background:#ffffff08;
        }
        .lm-memory-reject:hover:not(:disabled) { border-color:#ff9eac66;color:#ffb9c2; }
        .lm-memory-delete {
          margin-left:auto;border:1px solid #ff9eac2b;
          color:#e9a6ae;background:#ff9eac0a;
        }
        .lm-memory-delete:hover:not(:disabled) { background:#ff9eac18; }
        .lm-memory-empty {
          padding:35px 20px;text-align:center;
          border:1px dashed #ffffff20;border-radius:17px;
          background:#ffffff05;
        }
        .lm-memory-empty-icon {
          width:46px;height:46px;margin:0 auto 13px;
          display:grid;place-items:center;border-radius:15px;
          color:#a9e8ca;background:#78e4bb12;font-size:21px;
        }
        .lm-memory-empty h3 {
          margin:0 0 7px;color:#e8efeb;font:700 14px Manrope,sans-serif;
        }
        .lm-memory-empty p {
          max-width:390px;margin:0 auto;color:#84918b;
          font-size:11px;line-height:1.8;
        }
        .lm-memory-alert {
          margin:0 0 15px;padding:12px 14px;border-radius:12px;
          font-size:12px;line-height:1.6;
        }
        .lm-memory-error { color:#ffb9b4;border:1px solid #ff9eac40;background:#ff9eac10; }
        .lm-memory-success { color:#a9e8ca;border:1px solid #78e4bb35;background:#78e4bb0d; }
        .lm-memory-loading {
          padding:45px 15px;text-align:center;color:#aab7b0;font-size:12px;
        }
        .lm-memory-footer {
          margin-top:48px;padding-top:20px;border-top:1px solid #ffffff12;
          color:#65736c;font-size:10px;text-align:center;line-height:1.8;
        }
        @keyframes memoryIn {
          from { opacity:0;transform:translateY(9px); }
          to { opacity:1;transform:translateY(0); }
        }
        @media(max-width:600px) {
          .lm-memory-page { padding:18px 13px 40px; }
          .lm-memory-top { margin-bottom:39px;align-items:flex-start; }
          .lm-memory-brand { font-size:14px; }
          .lm-memory-mark { width:35px;height:35px; }
          .lm-memory-nav button { padding:9px 10px;font-size:10px; }
          .lm-memory-heading h1 { letter-spacing:-1.2px; }
          .lm-memory-card { padding:16px; }
          .lm-memory-date { font-size:9px; }
        }
        @media(prefers-reduced-motion:reduce) {
          .lm-memory-card { animation:none; }
          .lm-memory-card,.lm-memory-nav button { transition:none; }
        }
      `}</style>

      <div className="lm-memory-wrap">
        <header className="lm-memory-top">
          <div className="lm-memory-brand">
            <span className="lm-memory-mark">♡</span>
            <span>LifeMirror</span>
          </div>

          <nav className="lm-memory-nav">
            <button onClick={() => navigate("/dashboard")}>← Dashboard</button>
            <button onClick={() => navigate("/chat")}>Open companion ↗</button>
          </nav>
        </header>

        <section className="lm-memory-heading">
          <div className="lm-memory-eyebrow">Your space · Your choice</div>
          <h1>Things worth <span>remembering.</span></h1>
          <p>
            Little things you share can help LifeMirror understand you better.
            But nothing becomes a saved memory without your approval.
          </p>
        </section>

        <div className="lm-memory-note">
          <span>✧</span>
          <div>
            <b>You are in control.</b> Review every suggestion before it is saved.
            You can also remove a saved memory whenever you want.
          </div>
        </div>

        {error && <div className="lm-memory-alert lm-memory-error">{error}</div>}
        {notice && <div className="lm-memory-alert lm-memory-success">{notice}</div>}

        {loading ? (
          <div className="lm-memory-loading">Gathering your memories…</div>
        ) : (
          <>
            <section className="lm-memory-section">
              <div className="lm-memory-section-head">
                <h2>Waiting for your approval</h2>
                <span className="lm-memory-count">{suggestions.length} pending</span>
              </div>

              {suggestions.length === 0 ? (
                <div className="lm-memory-empty">
                  <div className="lm-memory-empty-icon">✧</div>
                  <h3>Nothing waiting right now</h3>
                  <p>
                    As you talk with your companion, it may suggest useful things
                    to remember. You will always decide what stays.
                  </p>
                </div>
              ) : (
                <div className="lm-memory-list">
                  {suggestions.map((item) => (
                    <article className="lm-memory-card" key={item._id}>
                      <div className="lm-memory-card-top">
                        <span className="lm-memory-category">
                          ✧ {categoryLabels[item.category] || "Personal note"}
                        </span>
                        <span className="lm-memory-date">Suggested memory</span>
                      </div>

                      <p className="lm-memory-content">{item.content}</p>

                      <div className="lm-memory-actions">
                        <button
                          className="lm-memory-approve"
                          disabled={busyId === item._id}
                          onClick={() => approveSuggestion(item)}
                        >
                          {busyId === item._id ? "Please wait…" : "✓ Keep this"}
                        </button>
                        <button
                          className="lm-memory-reject"
                          disabled={busyId === item._id}
                          onClick={() => rejectSuggestion(item)}
                        >
                          Not now
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="lm-memory-section">
              <div className="lm-memory-section-head">
                <h2>Memories you've kept</h2>
                <span className="lm-memory-count">{memories.length} saved</span>
              </div>

              {memories.length === 0 ? (
                <div className="lm-memory-empty">
                  <div className="lm-memory-empty-icon">♡</div>
                  <h3>Your memory space is still growing</h3>
                  <p>
                    Approved memories will appear here. You can remove any of
                    them whenever you like.
                  </p>
                </div>
              ) : (
                <div className="lm-memory-list">
                  {memories.map((item) => (
                    <article className="lm-memory-card" key={item._id}>
                      <div className="lm-memory-card-top">
                        <span className="lm-memory-category">
                          ♡ {categoryLabels[item.category] || "Personal note"}
                        </span>
                        <span className="lm-memory-date">Saved memory</span>
                      </div>

                      <p className="lm-memory-content">{item.content}</p>

                      <div className="lm-memory-actions">
                        <button
                          className="lm-memory-delete"
                          disabled={busyId === item._id}
                          onClick={() => deleteMemory(item)}
                        >
                          {busyId === item._id ? "Please wait…" : "Remove memory"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="lm-memory-footer">
          Your memories belong to you. Keep what feels right, remove what doesn't.
          <br />LifeMirror · A little more understanding, one conversation at a time.
        </footer>
      </div>
    </main>
  );
}
