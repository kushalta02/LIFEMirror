
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const PROMPTS = [
  "How was your day?",
  "What made you smile?",
  "What's on your mind?",
  "What would you like to let go of?",
];

const MOOD_STYLES = {
  positive: { label: "Positive", icon: "☀", color: "#76E6D0" },
  happy: { label: "Happy", icon: "☀", color: "#76E6D0" },
  negative: { label: "Low mood", icon: "☾", color: "#B6A4FF" },
  sad: { label: "Sad", icon: "☾", color: "#B6A4FF" },
  neutral: { label: "Neutral", icon: "◌", color: "#91BFFF" },
};

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getMood(mood) {
  const value = String(mood || "").toLowerCase();

  if (value.includes("happy") || value.includes("positive")) {
    return MOOD_STYLES.positive;
  }

  if (value.includes("sad") || value.includes("negative")) {
    return MOOD_STYLES.negative;
  }

  return MOOD_STYLES.neutral;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  let date;

  if (typeof value === "object" && value.$date) {
    date = new Date(value.$date);
  } else if (typeof value === "object" && value.iso) {
    date = new Date(value.iso);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEntryId(entry) {
  const id = entry?._id ?? entry?.id;
  if (typeof id === "string") return id;
  if (id && typeof id === "object") {
    return id.$oid || id.toString?.() || "";
  }
  return "";
}

function normalizeEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.journals)) return payload.journals;
  if (Array.isArray(payload?.entries)) return payload.entries;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function Journal() {
  const user = useMemo(() => readUser(), []);

  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState("all");


  const [showEditor, setShowEditor] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!user?.email) {
      setError("Your login session was not found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/journals/${encodeURIComponent(user.email)}`
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Journal history endpoint was not found. Check your backend route."
            : "Couldn't load your journal history."
        );
      }

      const payload = await response.json();
      const result = normalizeEntries(payload);

      result.sort((a, b) => {
        const first = new Date(a.timestamp || 0).getTime() || 0;
        const second = new Date(b.timestamp || 0).getTime() || 0;
        return second - first;
      });

      setEntries(result);

      setActiveEntry((current) => {
        if (!current) return null;
        const id = getEntryId(current);
        return result.find((entry) => getEntryId(entry) === id) || null;
      });
    } catch (err) {
      console.error("Journal history:", err);
      setError(
        err.message === "Failed to fetch"
          ? "Can't reach the backend. Check that FastAPI is running."
          : err.message || "Something went wrong loading your entries."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries
      .filter((entry) => {
        const matchesText =
          !query ||
          String(entry.text || "").toLowerCase().includes(query) ||
          String(entry.mood || "").toLowerCase().includes(query);

        const mood = String(entry.mood || "").toLowerCase();

        const matchesMood =
          moodFilter === "all" ||
          (moodFilter === "positive" &&
            (mood.includes("positive") || mood.includes("happy"))) ||
          (moodFilter === "negative" &&
            (mood.includes("negative") || mood.includes("sad"))) ||
          (moodFilter === "neutral" && mood.includes("neutral"));

        return matchesText && matchesMood;
      })
      .sort((a, b) => {
        const first = new Date(a.timestamp || 0).getTime() || 0;
        const second = new Date(b.timestamp || 0).getTime() || 0;
        return sortOrder === "newest" ? second - first : first - second;
      });
  }, [entries, search, moodFilter, sortOrder]);

  const saveEntry = async () => {
    if (!text.trim()) {
      setError("Write a little something before saving your entry.");
      return;
    }

    if (!user?.email) {
      setError("Please log in again before saving your journal.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/journals/${encodeURIComponent(editingId)}`
        : `${API_URL}/add_journal`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? { text: text.trim() }
            : { text: text.trim(), email: user.email }
        ),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.detail ||
            (isEditing
              ? "Couldn't update this entry. Check the update endpoint."
              : "Couldn't save this entry.")
        );
      }

      const result = await response.json().catch(() => ({}));

      setText("");
      setEditingId(null);
      setActiveEntry(null);
      setShowEditor(false);

      setNotice(
        isEditing
          ? "Your journal entry has been updated."
          : "Your thoughts have been saved successfully."
      );

      // Refresh history so MongoDB remains the source of truth.
      await loadEntries();

      // Display the analysis returned by the existing add endpoint.
      if (!isEditing && result.mood) {
        setNotice(`Entry saved successfully · AI mood: ${result.mood}`);
      }
    } catch (err) {
      console.error("Save journal:", err);
      setError(
        err.message === "Failed to fetch"
          ? "Can't reach the backend. Check your connection."
          : err.message || "Unable to save your entry."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (entry) => {
    setEditingId(getEntryId(entry));
    setText(entry.text || "");
    setActiveEntry(entry);
    setShowEditor(true);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setText("");
    setActiveEntry(null);
    setError("");
    setShowEditor(false);
  };

  
  const openEntry = (entry) => {
    setActiveEntry(entry);
    setView("all");
  };

  const firstName =
    user?.name?.trim()?.split(/\s+/)[0] || "there";

  const totalEntries = entries.length;
  const positiveEntries = entries.filter((entry) => {
    const mood = String(entry.mood || "").toLowerCase();
    return mood.includes("positive") || mood.includes("happy");
  }).length;

  const todayKey = new Date().toDateString();
  const wroteToday = entries.some((entry) => {
    const date = new Date(entry.timestamp || 0);
    return !Number.isNaN(date.getTime()) && date.toDateString() === todayKey;
  });
const deleteEntry = async (id) => {
  if (!id) {
    setError("Unable to identify this journal entry.");
    return false;
  }

  setDeletingId(id);
  setError("");
  setNotice("");

  try {
    const response = await fetch(
      `${API_URL}/journals/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        body.detail || "Couldn't delete this journal entry."
      );
    }

    setEntries((prev) =>
      prev.filter((entry) => getEntryId(entry) !== id)
    );

    setActiveEntry((prev) =>
      prev && getEntryId(prev) === id ? null : prev
    );

    if (editingId === id) {
      setEditingId(null);
      setText("");
      setShowEditor(false);
    }

    setNotice("Journal entry deleted successfully.");
    return true;
  } catch (err) {
    console.error("Delete journal:", err);
    setError(
      err.message === "Failed to fetch"
        ? "Can't reach the backend. Check your connection."
        : err.message || "Unable to delete journal entry."
    );
    return false;
  } finally {
    setDeletingId(null);
  }
};


  return (
    <div className="journal-page">
      <style>{journalCSS}</style>

      <header className="journal-topbar">
        <button
          className="journal-brand"
          onClick={() => (window.location.href = "/dashboard")}
          aria-label="Go to dashboard"
        >
          <span className="journal-brand-mark">✿</span>
          <span>
            <strong>Life<span>Mirror</span></strong>
            <small>YOUR PERSONAL WELLNESS SPACE</small>
          </span>
        </button>

        <div className="journal-top-right">
          <span className="journal-status"><i /> PRIVATE JOURNAL</span>
          <span className="journal-user-avatar">
            {firstName.charAt(0).toUpperCase()}
          </span>
        </div>
      </header>

      <main className="journal-main">
        <section className="journal-hero">
          <div className="journal-hero-copy">
            <span className="journal-eyebrow">YOUR REFLECTION SPACE</span>
            <h1>Your thoughts.<br /><span>Your own little universe.</span></h1>
            <p>
              Take a moment for yourself, {firstName}. Write without judgment,
              revisit your memories, and notice how your story unfolds.
            </p>

            <button
              className="journal-primary-button"
              onClick={() => {
                setEditingId(null);
                setActiveEntry(null);
                setText("");
                setError("");
                setNotice("");
                setShowEditor(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span>＋</span> Write a new entry
            </button>
          </div>

          <div className="journal-hero-art" aria-hidden="true">
            <div className="journal-orbit orbit-one" />
            <div className="journal-orbit orbit-two" />
            <div className="journal-orbit orbit-three" />
            <div className="journal-hero-star">✦</div>
            <div className="journal-hero-quote">
              <span>✧ A gentle reminder</span>
              <p>You don't have to have it all figured out today.</p>
            </div>
          </div>
        </section>

        <section className="journal-stats">
          <article className="journal-stat-card">
            <span className="journal-stat-icon mint">▤</span>
            <div><small>ALL ENTRIES</small><strong>{totalEntries}</strong><p>Your thoughts, collected</p></div>
          </article>
          <article className="journal-stat-card">
            <span className="journal-stat-icon purple">☀</span>
            <div><small>POSITIVE MOMENTS</small><strong>{positiveEntries}</strong><p>Based on saved mood labels</p></div>
          </article>
          <article className="journal-stat-card">
            <span className="journal-stat-icon blue">♡</span>
            <div><small>TODAY'S CHECK-IN</small><strong>{wroteToday ? "Done" : "Not yet"}</strong><p>{wroteToday ? "You made space for yourself" : "Your page is open today"}</p></div>
          </article>
        </section>

        {error && (
          <div className="journal-alert journal-alert-error" role="alert">
            <span>ⓘ</span><p>{error}</p>
            <button onClick={() => setError("")} aria-label="Dismiss error">×</button>
          </div>
        )}

        {notice && (
          <div className="journal-alert journal-alert-success" role="status">
            <span>✓</span><p>{notice}</p>
            <button onClick={() => setNotice("")} aria-label="Dismiss message">×</button>
          </div>
        )}

        <div className="journal-workspace">
          <section className="journal-editor-column">
            {showEditor ? (
              <article className="journal-panel journal-editor">
                <div className="journal-panel-heading">
                  <div>
                    <span className="journal-eyebrow">
                      {editingId ? "EDIT YOUR STORY" : "A MOMENT FOR YOU"}
                    </span>
                    <h2>{editingId ? "Revisit this entry" : "What's on your mind?"}</h2>
                    <p>There's no right or wrong way to write here.</p>
                  </div>
                  <span className="journal-editor-symbol">✎</span>
                </div>

                <div className="journal-prompts">
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() =>
                        setText((current) =>
                          current.trim()
                            ? `${current.trim()}\n\n${prompt}\n`
                            : `${prompt}\n`
                        )
                      }
                    >
                      {prompt} <span>↗</span>
                    </button>
                  ))}
                </div>

                <label className="journal-field-label" htmlFor="journal-writing-area">
                  YOUR ENTRY
                </label>
                <textarea
                  id="journal-writing-area"
                  className="journal-textarea"
                  placeholder={"Start wherever you are...\n\nWhat did today feel like? What do you wish someone understood? You can put it all here."}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={10000}
                />

                <div className="journal-editor-footer">
                  <span>{text.length} / 10,000 characters</span>
                  <span>Your space. Your pace.</span>
                </div>

                <div className="journal-editor-actions">
                  {editingId && (
                    <button className="journal-secondary-button" onClick={cancelEditing}>
                      Cancel
                    </button>
                  )}
                  {!editingId && (
                    <button
                      className="journal-secondary-button"
                      onClick={() => setText("")}
                      disabled={!text}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    className="journal-save-button"
                    onClick={saveEntry}
                    disabled={saving || !text.trim()}
                  >
                    {saving ? "Saving..." : editingId ? "Update entry  ✓" : "Save entry  ↗"}
                  </button>
                </div>

                <div className="journal-privacy-note">
                  <span>◇</span>
                  <p>Your entry is saved to your LifeMirror account. Write only what you're comfortable storing.</p>
                </div>
              </article>
            ) : (
              <article className="journal-panel journal-start-card">
                <div className="journal-start-icon">✧</div>
                <span className="journal-eyebrow">YOUR SPACE IS READY</span>
                <h2>Make room for your thoughts.</h2>
                <p>Even a few honest lines can help you pause and reflect.</p>
                <button className="journal-save-button" onClick={() => setShowEditor(true)}>
                  ＋ Start writing
                </button>
              </article>
            )}

            {activeEntry && (
              <article className="journal-panel journal-detail-card">
                <div className="journal-panel-heading">
                  <div>
                    <span className="journal-eyebrow">ENTRY DETAILS</span>
                    <h2>A moment from your story</h2>
                    <p>{formatDate(activeEntry.timestamp)}</p>
                  </div>
                  <button className="journal-close-button" onClick={() => setActiveEntry(null)} aria-label="Close entry">×</button>
                </div>

                <div className="journal-detail-mood">
                  <span>{getMood(activeEntry.mood).icon}</span>
                  <div><small>AI MOOD ANALYSIS</small><strong>{activeEntry.mood || "Not available"}</strong></div>
                </div>

                <p className="journal-entry-full">{activeEntry.text}</p>

                <div className="journal-detail-actions">
                  <button className="journal-secondary-button" onClick={() => startEditing(activeEntry)}>
                    ✎ Edit entry
                  </button>
                  
                    <button
                      className="journal-delete-button"
                      onClick={() => setDeleteTarget(activeEntry)}
                      disabled={Boolean(deletingId)}
                    >
                      Delete
                    </button>

                </div>
              </article>
            )}
          </section>

          <section className="journal-history-column">
            <article className="journal-panel journal-history">
              <div className="journal-panel-heading history-heading">
                <div>
                  <span className="journal-eyebrow">YOUR PERSONAL ARCHIVE</span>
                  <h2>Journal history</h2>
                  <p>Every entry is part of your journey.</p>
                </div>
                <span className="journal-history-count">{totalEntries} saved</span>
              </div>

              <div className="journal-search-wrap">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search your entries..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search journal entries"
                />
                {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
              </div>

              <div className="journal-filter-row">
                <select value={moodFilter} onChange={(event) => setMoodFilter(event.target.value)} aria-label="Filter by mood">
                  <option value="all">All moods</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Low mood</option>
                  <option value="neutral">Neutral</option>
                </select>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort journal entries">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>

              {loading ? (
                <div className="journal-loading">
                  <span className="journal-spinner" />
                  <p>Opening your journal...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="journal-empty">
                  <span>{search || moodFilter !== "all" ? "⌕" : "✧"}</span>
                  <h3>{search || moodFilter !== "all" ? "No matching entries" : "Your story starts here"}</h3>
                  <p>
                    {search || moodFilter !== "all"
                      ? "Try another search or change your filters."
                      : "Your saved journal entries will appear here. Write your first reflection whenever you're ready."}
                  </p>
                  {(search || moodFilter !== "all") && (
                    <button onClick={() => { setSearch(""); setMoodFilter("all"); }}>
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="journal-entry-list">
                  {filteredEntries.map((entry, index) => {
                    const mood = getMood(entry.mood);
                    const id = getEntryId(entry);
                    const selected = getEntryId(activeEntry) === id;

                    return (
                      <article className={`journal-entry-card ${selected ? "selected" : ""}`} key={id || `${entry.timestamp}-${index}`}>
                        <button className="journal-entry-open" onClick={() => openEntry(entry)}>
                          <div className="journal-entry-top">
                            <span className="journal-entry-date">{formatDate(entry.timestamp)}</span>
                            <span className="journal-entry-mood" style={{ "--mood-color": mood.color }}>
                              <i>{mood.icon}</i>{entry.mood || "No mood"}
                            </span>
                          </div>
                          <p className="journal-entry-preview">{entry.text || "Empty entry"}</p>
                          <span className="journal-read-link">Read entry <span>↗</span></span>
                        </button>

                        <div className="journal-entry-actions">
                          <button onClick={() => startEditing(entry)} title="Edit entry" aria-label="Edit entry">✎</button>
                          <button onClick={() => setDeleteTarget(entry)}>
                              Delete entry
                            </button>
                        </div>
                      </article>
                    );
                  })}
                  
                </div>
              )}

              <div className="journal-history-footer">
                <span>Showing {filteredEntries.length} of {totalEntries} entries</span>
                <button onClick={loadEntries} disabled={loading}>↻ Refresh</button>
              </div>
            </article>
          </section>
        </div>

        <section className="journal-bottom-note">
          <div className="journal-bottom-icon">☾</div>
          <div>
            <span className="journal-eyebrow">A LITTLE REMINDER</span>
            <h2>You are more than any one difficult day.</h2>
            <p>Your journal is a place to notice your feelings, not judge yourself for having them.</p>
          </div>
          <span className="journal-bottom-star">✦</span>
        </section>

        <footer className="journal-footer">
          <span>LifeMirror <i>•</i> Your reflection space</span>
          <span>Be gentle with yourself today.</span>
        </footer>
      </main>
{deleteTarget && (
  <div
    className="journal-modal-overlay"
    onClick={() => {
      if (!deletingId) setDeleteTarget(null);
    }}
  >
    <section
      className="journal-delete-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-delete-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="journal-modal-icon">
        <span>⌫</span>
      </div>

      <span className="journal-eyebrow">
        YOUR PERSONAL ARCHIVE
      </span>

      <h2 id="journal-delete-title">
        Delete this entry?
      </h2>

      <p>
        Are you sure you want to remove this journal entry?
        Once deleted, it cannot be recovered.
      </p>

      <div className="journal-modal-actions">
        <button
          type="button"
          className="journal-modal-cancel"
          disabled={Boolean(deletingId)}
          onClick={() => setDeleteTarget(null)}
        >
          Keep entry
        </button>

        <button
          type="button"
          className="journal-modal-confirm"
          disabled={Boolean(deletingId)}
          onClick={async () => {
            const id = getEntryId(deleteTarget);
            const success = await deleteEntry(id);

            if (success) {
              setDeleteTarget(null);
            }
          }}
        >
          {deletingId ? "Deleting..." : "Delete entry"}
        </button>
      </div>
    </section>
  </div>
)}


    </div>
  );
}

const journalCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

.journal-page{
  --j-bg:#090A0F;--j-panel:#15151B;--j-inner:#101015;--j-raised:#201D29;
  --j-border:#292832;--j-text:#F1EFF5;--j-muted:#B7B2C1;--j-subtle:#8F899B;
  --j-mint:#76E6D0;--j-purple:#B6A4FF;--j-blue:#91BFFF;
  min-height:100vh;background:var(--j-bg);color:var(--j-text);
  font-family:'DM Sans',sans-serif;padding:0 0 22px;
}
.journal-page *{box-sizing:border-box}
.journal-page button,.journal-page input,.journal-page textarea,.journal-page select{font:inherit}
.journal-page button{transition:background .18s ease,border-color .18s ease,transform .18s ease}
.journal-page button:focus-visible,.journal-page input:focus-visible,.journal-page textarea:focus-visible,.journal-page select:focus-visible{outline:2px solid var(--j-purple);outline-offset:2px}
.journal-topbar{height:76px;display:flex;align-items:center;justify-content:space-between;gap:15px;padding:0 clamp(18px,4vw,54px);border-bottom:1px solid var(--j-border);background:#111116}
.journal-brand{display:flex;align-items:center;gap:11px;border:0;background:transparent;color:var(--j-text);text-align:left;cursor:pointer;padding:0}
.journal-brand-mark{color:var(--j-mint);font-size:32px}
.journal-brand>span:last-child{display:flex;flex-direction:column;gap:3px}
.journal-brand strong{font:800 20px 'Manrope',sans-serif;letter-spacing:-.6px}
.journal-brand strong span{color:var(--j-mint)}
.journal-brand small{font-size:8px;letter-spacing:1.3px;color:var(--j-muted)}
.journal-top-right{display:flex;align-items:center;gap:13px}
.journal-status{display:flex;align-items:center;gap:8px;border:1px solid var(--j-border);border-radius:30px;background:var(--j-panel);padding:9px 12px;color:var(--j-mint);font-size:9px;font-weight:700;letter-spacing:.6px}
.journal-status i{width:7px;height:7px;border-radius:50%;background:var(--j-mint);box-shadow:0 0 10px #76E6D055}
.journal-user-avatar{width:35px;height:35px;border-radius:50%;display:grid;place-items:center;background:var(--j-purple);color:#15151B;font-weight:800}
.journal-main{width:min(1380px,100%);margin:0 auto;padding:30px clamp(18px,4vw,54px) 0}
.journal-hero{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(260px,.7fr);align-items:center;gap:25px;min-height:250px;padding:28px 32px;border:1px solid var(--j-border);border-radius:20px;background:linear-gradient(110deg,#17161F 0%,#15151B 62%,#201D29 100%);overflow:hidden;position:relative}
.journal-hero-copy{position:relative;z-index:1}
.journal-eyebrow{display:block;font-size:9px;letter-spacing:1.5px;color:var(--j-purple);font-weight:700}
.journal-hero h1{font:800 clamp(29px,3.4vw,44px)/1.15 'Manrope',sans-serif;letter-spacing:-1.5px;margin:13px 0 11px}
.journal-hero h1 span{color:var(--j-mint)}
.journal-hero-copy>p{max-width:520px;color:var(--j-muted);font-size:12px;line-height:1.8;margin:0 0 21px}
.journal-primary-button,.journal-save-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:12px 17px;border:1px solid var(--j-mint);border-radius:10px;background:var(--j-mint);color:#090A0F;font-size:11px;font-weight:800;cursor:pointer}
.journal-primary-button:hover,.journal-save-button:hover:not(:disabled){background:#9BF0E0;transform:translateY(-1px)}
.journal-primary-button span{font-size:17px}
.journal-hero-art{height:205px;position:relative;display:grid;place-items:center;overflow:hidden}
.journal-orbit{position:absolute;left:50%;top:48%;border:1px solid #B6A4FF35;border-radius:50%;transform:translate(-50%,-50%) rotate(-22deg)}
.orbit-one{width:160px;height:160px}.orbit-two{width:220px;height:105px;transform:translate(-50%,-50%) rotate(36deg)}.orbit-three{width:250px;height:150px;transform:translate(-50%,-50%) rotate(-50deg)}
.journal-hero-star{width:94px;height:94px;display:grid;place-items:center;border-radius:30px;background:radial-gradient(circle at 30% 25%,#39334B,#201D29 70%);border:1px solid #B6A4FF45;color:var(--j-mint);font-size:52px;box-shadow:0 0 55px #B6A4FF16;transform:rotate(-9deg)}
.journal-hero-quote{position:absolute;right:0;bottom:0;max-width:225px;padding:12px 14px;border:1px solid #393443;border-radius:12px;background:#15151BEF}
.journal-hero-quote span{font-size:8px;letter-spacing:.7px;color:var(--j-purple);font-weight:700}
.journal-hero-quote p{font:600 10px/1.6 'Manrope',sans-serif;color:var(--j-text);margin:6px 0 0}
.journal-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-top:15px}
.journal-stat-card{display:flex;align-items:center;gap:13px;min-width:0;padding:15px 17px;border:1px solid var(--j-border);border-radius:14px;background:var(--j-panel)}
.journal-stat-icon{width:39px;height:39px;display:grid;place-items:center;flex:0 0 39px;border-radius:12px;background:var(--j-raised);font-size:21px;color:var(--j-mint)}
.journal-stat-icon.purple{color:var(--j-purple)}.journal-stat-icon.blue{color:var(--j-blue)}
.journal-stat-card>div{min-width:0;display:flex;flex-direction:column;gap:3px}
.journal-stat-card small{color:var(--j-muted);font-size:8px;letter-spacing:1px;font-weight:700}
.journal-stat-card strong{font:800 22px 'Manrope',sans-serif;color:var(--j-text)}
.journal-stat-card p{margin:0;color:var(--j-subtle);font-size:9px;line-height:1.5}
.journal-alert{display:flex;align-items:center;gap:10px;margin-top:14px;padding:12px 14px;border:1px solid var(--j-border);border-radius:11px;font-size:11px}
.journal-alert>span{font-size:17px}.journal-alert p{margin:0;flex:1;line-height:1.5}.journal-alert button{border:0;background:transparent;color:var(--j-muted);font-size:18px;cursor:pointer}
.journal-alert-error{background:#26191F;border-color:#53303B;color:#F2B7C3}.journal-alert-success{background:#152420;border-color:#284B43;color:var(--j-mint)}
.journal-workspace{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);align-items:start;gap:15px;margin-top:16px}
.journal-editor-column,.journal-history-column{min-width:0;display:flex;flex-direction:column;gap:15px}
.journal-panel{min-width:0;border:1px solid var(--j-border);border-radius:16px;background:var(--j-panel);padding:20px}
.journal-panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.journal-panel-heading h2{font:700 19px 'Manrope',sans-serif;letter-spacing:-.4px;margin:7px 0 5px}
.journal-panel-heading p{font-size:10px;line-height:1.6;color:var(--j-muted);margin:0}
.journal-editor-symbol{display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:12px;background:var(--j-raised);color:var(--j-mint);font-size:22px}
.journal-prompts{display:flex;flex-wrap:wrap;gap:7px;margin:20px 0 19px}
.journal-prompts button{display:flex;align-items:center;gap:7px;border:1px solid var(--j-border);border-radius:20px;background:var(--j-inner);color:var(--j-muted);padding:8px 10px;font-size:9px;cursor:pointer}
.journal-prompts button span{color:var(--j-purple)}
.journal-prompts button:hover{border-color:var(--j-purple);color:var(--j-text);background:var(--j-raised)}
.journal-field-label{display:block;margin-bottom:8px;font-size:8px;font-weight:700;letter-spacing:1.3px;color:var(--j-muted)}
.journal-textarea{width:100%;min-height:260px;display:block;resize:vertical;border:1px solid var(--j-border);border-radius:12px;padding:15px;background:var(--j-inner);color:var(--j-text);font-size:12px;line-height:1.9;outline:none}
.journal-textarea::placeholder{color:#777180}
.journal-textarea:focus{border-color:#70618E}
.journal-editor-footer{display:flex;justify-content:space-between;gap:10px;margin-top:8px;color:var(--j-subtle);font-size:8px}
.journal-editor-actions{display:flex;align-items:center;justify-content:flex-end;gap:9px;margin-top:17px}
.journal-secondary-button,.journal-delete-button{border:1px solid var(--j-border);border-radius:9px;background:var(--j-raised);color:var(--j-text);padding:10px 13px;font-size:10px;font-weight:700;cursor:pointer}
.journal-secondary-button:hover{border-color:var(--j-purple)}
.journal-delete-button{color:#E8A9D0}
.journal-delete-button:hover{background:#2B1C29;border-color:#75415F}
.journal-save-button{padding:11px 15px;font-size:10px}
.journal-page button:disabled{opacity:.5;cursor:not-allowed;transform:none}
.journal-privacy-note{display:flex;gap:8px;align-items:flex-start;margin-top:17px;padding-top:13px;border-top:1px solid var(--j-border)}
.journal-privacy-note span{color:var(--j-mint);font-size:15px}
.journal-privacy-note p{color:var(--j-subtle);font-size:9px;line-height:1.6;margin:0}
.journal-start-card{text-align:center;padding:34px 22px}
.journal-start-icon{width:55px;height:55px;display:grid;place-items:center;border:1px solid var(--j-border);border-radius:17px;background:var(--j-raised);color:var(--j-mint);font-size:28px;margin:0 auto 17px}
.journal-start-card h2{font:700 19px 'Manrope',sans-serif;margin:10px 0}
.journal-start-card p{color:var(--j-muted);font-size:11px;line-height:1.7;margin:0 auto 18px;max-width:320px}
.journal-history{padding:20px 16px 13px}
.history-heading{padding:0 3px}
.journal-history-count{border:1px solid var(--j-border);border-radius:20px;padding:7px 9px;background:var(--j-inner);font-size:9px;color:var(--j-mint);white-space:nowrap}
.journal-search-wrap{display:flex;align-items:center;gap:9px;margin-top:18px;padding:0 11px;border:1px solid var(--j-border);border-radius:10px;background:var(--j-inner)}
.journal-search-wrap>span{font-size:22px;color:var(--j-subtle)}
.journal-search-wrap input{flex:1;min-width:0;height:40px;border:0;outline:0;background:transparent;color:var(--j-text);font-size:10px}
.journal-search-wrap input::placeholder{color:var(--j-subtle)}
.journal-search-wrap button{border:0;background:transparent;color:var(--j-muted);font-size:17px;cursor:pointer}
.journal-filter-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
.journal-filter-row select{width:100%;min-width:0;border:1px solid var(--j-border);border-radius:9px;background:var(--j-raised);color:var(--j-muted);padding:9px;font-size:9px;outline:none}
.journal-entry-list{display:flex;flex-direction:column;gap:9px;margin-top:14px}
.journal-entry-card{position:relative;border:1px solid var(--j-border);border-radius:12px;background:var(--j-inner);overflow:hidden}
.journal-entry-card:hover,.journal-entry-card.selected{border-color:#615477;background:#191720}
.journal-entry-open{display:block;width:100%;padding:13px 13px 12px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}
.journal-entry-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.journal-entry-date{font-size:8px;color:var(--j-subtle);line-height:1.5}
.journal-entry-mood{display:inline-flex;align-items:center;gap:5px;max-width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mood-color);font-size:8px;border:1px solid var(--j-border);background:var(--j-raised);padding:5px 7px;border-radius:20px}
.journal-entry-mood i{font-style:normal}
.journal-entry-preview{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line;overflow-wrap:anywhere;color:#D8D4E0;font-size:10px;line-height:1.75;margin:12px 0 9px;padding-right:18px}
.journal-read-link{font-size:9px;color:var(--j-mint);font-weight:700}
.journal-read-link span{margin-left:4px}
.journal-entry-actions{position:absolute;right:9px;bottom:9px;display:flex;gap:5px}
.journal-entry-actions button{width:25px;height:25px;display:grid;place-items:center;border:1px solid var(--j-border);border-radius:7px;background:#201D29;color:var(--j-muted);font-size:13px;cursor:pointer}
.journal-entry-actions button:hover{border-color:var(--j-purple);color:var(--j-text)}
.journal-entry-actions button:last-child:hover{border-color:#75415F;color:#E8A9D0}
.journal-history-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--j-border);margin-top:13px;padding-top:12px;color:var(--j-subtle);font-size:8px}
.journal-history-footer button{border:0;background:transparent;color:var(--j-mint);font-size:9px;cursor:pointer}
.journal-empty,.journal-loading{display:flex;flex-direction:column;align-items:center;text-align:center;padding:35px 17px 29px}
.journal-empty>span{width:49px;height:49px;display:grid;place-items:center;border:1px solid var(--j-border);border-radius:15px;background:var(--j-raised);color:var(--j-purple);font-size:25px}
.journal-empty h3{font:700 14px 'Manrope',sans-serif;margin:13px 0 6px}
.journal-empty p,.journal-loading p{max-width:290px;color:var(--j-muted);font-size:10px;line-height:1.8;margin:0}
.journal-empty button{margin-top:13px;padding:8px 11px;border:1px solid var(--j-border);border-radius:8px;background:var(--j-raised);color:var(--j-mint);font-size:9px;cursor:pointer}
.journal-spinner{width:26px;height:26px;border:2px solid var(--j-border);border-top-color:var(--j-mint);border-radius:50%;animation:journalSpin .8s linear infinite;margin-bottom:12px}
@keyframes journalSpin{to{transform:rotate(360deg)}}
.journal-detail-card{padding:18px}
.journal-close-button{width:30px;height:30px;border:1px solid var(--j-border);border-radius:9px;background:var(--j-raised);color:var(--j-muted);font-size:20px;cursor:pointer}
.journal-detail-mood{display:flex;align-items:center;gap:10px;margin:17px 0;padding:11px;border:1px solid var(--j-border);border-radius:10px;background:var(--j-inner)}
.journal-detail-mood>span{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:var(--j-raised);color:var(--j-mint);font-size:20px}
.journal-detail-mood>div{display:flex;flex-direction:column;gap:4px}
.journal-detail-mood small{font-size:8px;letter-spacing:1px;color:var(--j-subtle)}
.journal-detail-mood strong{font-size:11px;color:var(--j-text)}
.journal-entry-full{white-space:pre-wrap;overflow-wrap:anywhere;color:#D8D4E0;font-size:11px;line-height:1.9;margin:0;padding:5px 2px 15px}
.journal-detail-actions{display:flex;gap:8px;border-top:1px solid var(--j-border);padding-top:13px}
.journal-bottom-note{display:flex;align-items:center;gap:15px;margin-top:16px;padding:18px 21px;border:1px solid var(--j-border);border-radius:15px;background:linear-gradient(100deg,#201D29,#15151B 75%)}
.journal-bottom-icon{width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border:1px solid #3C354D;border-radius:13px;background:#292436;color:var(--j-purple);font-size:25px}
.journal-bottom-note>div:nth-child(2){flex:1;min-width:0}
.journal-bottom-note h2{font:700 14px 'Manrope',sans-serif;margin:6px 0}
.journal-bottom-note p{font-size:10px;color:var(--j-muted);line-height:1.6;margin:0}
.journal-bottom-star{color:var(--j-mint);font-size:25px}
.journal-footer{display:flex;justify-content:space-between;gap:12px;padding:17px 2px 0;color:var(--j-subtle);font-size:8px}
.journal-footer i{font-style:normal;color:var(--j-mint);margin:0 4px}
@media(max-width:1000px){
  .journal-hero{grid-template-columns:minmax(0,1fr) 250px;padding:25px}
  .journal-workspace{grid-template-columns:1fr}
  .journal-history{padding:20px}
  .journal-entry-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:650px){
  .journal-topbar{height:65px;padding:0 15px}
  .journal-brand-mark{font-size:27px}
  .journal-brand strong{font-size:17px}
  .journal-brand small{font-size:6px;letter-spacing:.8px}
  .journal-status{font-size:0;padding:9px}.journal-status i{margin:0}
  .journal-user-avatar{width:31px;height:31px}
  .journal-main{padding:17px 12px 0}
  .journal-hero{grid-template-columns:1fr;min-height:auto;padding:23px 18px}
  .journal-hero h1{font-size:30px}
  .journal-hero-copy>p{font-size:11px}
  .journal-hero-art{height:145px;margin-top:0}
  .journal-hero-star{width:70px;height:70px;font-size:38px}
  .journal-hero-quote{right:0;bottom:0;max-width:190px}
  .journal-stats{gap:7px;grid-template-columns:1fr}
  .journal-stat-card{padding:11px 13px}
  .journal-stat-icon{width:34px;height:34px;flex-basis:34px}
  .journal-stat-card strong{font-size:19px}
  .journal-panel{padding:15px}
  .journal-panel-heading h2{font-size:17px}
  .journal-prompts{gap:6px;margin:15px 0}
  .journal-prompts button{font-size:8px;padding:7px 8px}
  .journal-textarea{min-height:225px;padding:12px;font-size:11px}
  .journal-editor-footer{font-size:7px}
  .journal-editor-actions{flex-wrap:wrap}
  .journal-save-button,.journal-secondary-button{padding:10px 11px}
  .journal-entry-list{grid-template-columns:1fr}
  .journal-history{padding:15px}
  .journal-entry-preview{padding-right:26px}
  .journal-bottom-note{padding:14px;gap:10px;align-items:flex-start}
  .journal-bottom-icon{width:35px;height:35px;flex-basis:35px;font-size:20px}
  .journal-bottom-note h2{font-size:12px;line-height:1.5}
  .journal-bottom-note p{font-size:9px}
  .journal-bottom-star{display:none}
  .journal-footer{font-size:7px;flex-direction:column;gap:6px}
}
/* Custom journal delete confirmation modal */
.journal-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(5, 5, 12, 0.78);
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
  animation: journalModalFade 0.18s ease;
}

.journal-delete-modal {
  width: 100%;
  max-width: 420px;
  padding: 28px;
  border: 1px solid #393344;
  border-radius: 20px;
  background: linear-gradient(145deg, #1B1924, #121218);
  color: var(--j-text);
  box-shadow: 0 25px 90px rgba(0, 0, 0, 0.55);
  animation: journalModalRise 0.22s ease;
}

.journal-modal-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  border: 1px solid #69404D;
  border-radius: 14px;
  background: #30202A;
  color: #FF9CAC;
  font-size: 26px;
}

.journal-delete-modal h2 {
  margin: 10px 0;
  font: 800 23px 'Manrope', sans-serif;
  letter-spacing: -0.6px;
}

.journal-delete-modal > p {
  margin: 0;
  color: var(--j-muted);
  font-size: 12px;
  line-height: 1.8;
}

.journal-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

.journal-modal-actions button {
  flex: 1;
  min-height: 43px;
  padding: 11px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.journal-modal-cancel {
  border: 1px solid #393443;
  background: #201D29;
  color: #F1EFF5;
}

.journal-modal-cancel:hover:not(:disabled) {
  border-color: #75658D;
  background: #292435;
}

.journal-modal-confirm {
  border: 1px solid #B94359;
  background: #B94359;
  color: #FFFFFF;
}

.journal-modal-confirm:hover:not(:disabled) {
  background: #D05269;
}

.journal-modal-actions button:disabled {
  opacity: 0.6;
  cursor: wait;
}

@keyframes journalModalFade {
  from { opacity: 0; }
  to { opacity: 1; }
}


@keyframes journalModalRise {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Keep Edit and Delete buttons inside each journal card */
.journal-entry-card {
  box-sizing: border-box;
  padding-bottom: 12px;
  overflow: hidden;
}

.journal-entry-actions {
  position: static;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px 12px 12px;
}

.journal-entry-actions button {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  height: 30px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid var(--j-border);
  border-radius: 7px;
  background: #201D29;
  color: var(--j-muted);
  font-size: 11px;
  cursor: pointer;
}

.journal-entry-actions button:first-child {
  width: 30px;
  min-width: 30px;
  padding: 0;
  font-size: 15px;
}

.journal-entry-actions button:last-child {
  color: #E8A9D0;
}

.journal-entry-actions button:last-child:hover {
  background: #2B1C29;
  border-color: #75415F;
}

@media (max-width: 480px) {
  .journal-entry-actions {
    gap: 6px;
    padding-right: 8px;
    padding-left: 8px;
  }

  .journal-entry-actions button {
    height: 28px;
    padding: 0 8px;
    font-size: 10px;
  }

  .journal-entry-actions button:first-child {
    width: 28px;
    min-width: 28px;
  }
}

/* Fix edit/delete actions inside each journal card */
.journal-entry-card {
  padding-bottom: 42px;
}

.journal-entry-actions {
  position: absolute;
  right: 10px;
  bottom: 9px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  max-width: calc(100% - 20px);
}

.journal-entry-actions button {
  min-width: 28px;
  width: auto;
  height: 28px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border: 1px solid var(--j-border);
  border-radius: 7px;
  background: #201D29;
  color: var(--j-muted);
  font-size: 10px;
  cursor: pointer;
}

.journal-entry-actions button:first-child {
  width: 28px;
  min-width: 28px;
  padding: 0;
  font-size: 14px;
}

.journal-entry-actions button:last-child {
  color: #E8A9D0;
}

.journal-entry-actions button:last-child:hover {
  background: #2B1C29;
  border-color: #75415F;
}

  
}


`;
