import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const PROMPTS = [
  "What felt important today?",
  "What is taking up space in my mind?",
  "What am I proud of, even a little?",
  "What do I need more of right now?",
];

const REMINDERS = [
  "You can begin again, as many times as you need.",
  "You do not have to solve everything today.",
  "Small progress is still progress.",
  "Rest is allowed. You have nothing to prove.",
  "You deserve the same kindness you give others.",
  "One difficult moment does not define your whole day.",
  "You are allowed to take things one step at a time.",
];

const CELEBRATION_BITS = ["✦", "✧", "♡", "✿", "☀", "✨", "💛", "🌿"];

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function entryId(entry) {
  const id = entry?._id ?? entry?.id;
  if (typeof id === "string") return id;
  if (id && typeof id === "object") return id.$oid || "";
  return "";
}

function moodInfo(value) {
  const mood = String(value || "").toLowerCase();
  if (mood.includes("positive") || mood.includes("happy")) {
    return { label: "Positive", icon: "☀", className: "positive" };
  }
  if (mood.includes("negative") || mood.includes("sad")) {
    return { label: "Negative", icon: "☁", className: "negative" };
  }
  return { label: "Neutral", icon: "◌", className: "neutral" };
}

function dateValue(value) {
  if (value && typeof value === "object") {
    value = value.$date || value.iso || value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, includeTime = true) {
  const date = dateValue(value);
  if (!date) return "Date unavailable";
  return date.toLocaleString("en-IN", includeTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" });
}

function normalizeEntries(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.journals || payload?.entries || payload?.data || [];
}

function prettyLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Journal() {
  const user = useMemo(readUser, []);
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
  const [showEditor, setShowEditor] = useState(true);
  const [reminderIndex, setReminderIndex] = useState(0);
  const [breathingActive, setBreathingActive] = useState(false);
  const [moodFeedback, setMoodFeedback] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const loadEntries = useCallback(async (quiet = false) => {
    if (!user?.email) {
      setError("Your session could not be found. Please sign in again.");
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/journals/${encodeURIComponent(user.email)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not load journal history.");
      const rows = normalizeEntries(payload).slice().sort((a, b) =>
        (dateValue(b.timestamp)?.getTime() || 0) - (dateValue(a.timestamp)?.getTime() || 0)
      );
      setEntries(rows);
      setActiveEntry((current) => current
        ? rows.find((row) => entryId(row) === entryId(current)) || null
        : null);
    } catch (err) {
      console.error("Journal history:", err);
      setError(err.message === "Failed to fetch"
        ? "LifeMirror could not reach the backend. Check that FastAPI is running."
        : err.message || "Could not load your journal.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Scroll-linked scene reveals and a small memory mote that follows the reading journey.
  useEffect(() => {
    const updateProgress = () => {
      const root = document.documentElement;
      const maxScroll = root.scrollHeight - window.innerHeight;
      setScrollProgress(maxScroll > 0 ? Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)) : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => {
    const root = document.querySelector(".lm-journal");
    if (!root) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = root.querySelectorAll(
      ".lj-hero, .lj-gentle-banner, .lj-breathe-card, .lj-stat, .lj-composer, .lj-write-again, .lj-detail, .lj-archive, .lj-bottom-reminder"
    );
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("lj-reveal", "is-visible"));
      return undefined;
    }
    root.classList.add("lj-motion-ready");
    const observer = new IntersectionObserver((observations) => {
      observations.forEach((observation) => {
        if (observation.isIntersecting) {
          observation.target.classList.add("is-visible");
          observer.unobserve(observation.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    targets.forEach((element, index) => {
      element.classList.add("lj-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 85}ms`);
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [entries.length, showEditor, activeEntry]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setReminderIndex((current) => (current + 1) % REMINDERS.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!moodFeedback) return undefined;
    const timeout = window.setTimeout(() => setMoodFeedback(null), 5200);
    return () => window.clearTimeout(timeout);
  }, [moodFeedback]);

  useEffect(() => {
    if (!deleteTarget) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !deletingId) setDeleteTarget(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, deletingId]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const analysis = entry.ai_analysis || {};
      const searchable = [
        entry.text, entry.mood, analysis.summary,
        ...(analysis.themes || []),
        ...(analysis.emotions || []).map((emotion) => emotion.label),
      ].join(" ").toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const mood = moodInfo(entry.mood).label.toLowerCase();
      return matchesQuery && (moodFilter === "all" || mood === moodFilter);
    }).sort((a, b) => {
      const delta = (dateValue(a.timestamp)?.getTime() || 0) - (dateValue(b.timestamp)?.getTime() || 0);
      return sortOrder === "newest" ? -delta : delta;
    });
  }, [entries, search, moodFilter, sortOrder]);

  const saveEntry = async () => {
    if (!text.trim()) {
      setError("Write a few words first. Even one honest sentence is enough.");
      return;
    }
    if (!user?.email) {
      setError("Please sign in again before saving your journal.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    const isEditing = Boolean(editingId);
    try {
      const url = isEditing
        ? `${API_URL}/journals/${encodeURIComponent(editingId)}?email=${encodeURIComponent(user.email)}`
        : `${API_URL}/add_journal`;
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing
          ? { text: text.trim() }
          : { text: text.trim(), email: user.email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || (isEditing
        ? "Could not update this entry."
        : "Could not save this entry."));
      const savedMood = moodInfo(result.mood || result.analysis?.mood).label;
      setMoodFeedback({
        mood: savedMood,
        title: savedMood === "Positive"
          ? "Let this little win count."
          : savedMood === "Negative"
            ? "Thank you for being honest with yourself."
            : "You made space for yourself today.",
        message: savedMood === "Positive"
          ? "You deserve to notice the good moments, even the small ones."
          : savedMood === "Negative"
            ? "You do not have to turn this feeling into a positive one. One gentle step is enough."
            : "You do not need to feel a certain way for this check-in to matter.",
      });
      setText("");
      setEditingId(null);
      setShowEditor(false);
      setNotice(isEditing ? "Your reflection has been updated." : "Your reflection has been saved.");
      await loadEntries(true);
      if (result.analysis) {
        setActiveEntry({
          id: result.id,
          text: isEditing ? text.trim() : text.trim(),
          mood: result.mood || result.analysis.mood,
          ai_analysis: result.analysis,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Save journal:", err);
      setError(err.message === "Failed to fetch"
        ? "LifeMirror could not reach the backend. Check your connection."
        : err.message || "Unable to save this entry.");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (entry) => {
    setEditingId(entryId(entry));
    setText(entry.text || "");
    setActiveEntry(entry);
    setShowEditor(true);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNewEntry = () => {
    setEditingId(null);
    setText("");
    setActiveEntry(null);
    setError("");
    setNotice("");
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setText("");
    setError("");
    setShowEditor(false);
  };

  const deleteEntry = async () => {
    const id = entryId(deleteTarget);
    if (!id || !user?.email) {
      setError("Could not identify this entry or your signed-in account.");
      return;
    }
    setDeletingId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_URL}/journals/${encodeURIComponent(id)}?email=${encodeURIComponent(user.email)}`,
        { method: "DELETE" }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not delete this entry.");
      setEntries((current) => current.filter((entry) => entryId(entry) !== id));
      setActiveEntry((current) => current && entryId(current) === id ? null : current);
      if (editingId === id) {
        setEditingId(null);
        setText("");
        setShowEditor(false);
      }
      setDeleteTarget(null);
      setNotice("Entry deleted. Your archive has been updated.");
    } catch (err) {
      console.error("Delete journal:", err);
      setError(err.message === "Failed to fetch"
        ? "LifeMirror could not reach the backend."
        : err.message || "Unable to delete this entry.");
    } finally {
      setDeletingId(null);
    }
  };

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "there";
  const positiveCount = entries.filter((entry) => moodInfo(entry.mood).label === "Positive").length;
  const todayCount = entries.filter((entry) => {
    const date = dateValue(entry.timestamp);
    return date && date.toDateString() === new Date().toDateString();
  }).length;
  const activeAnalysis = activeEntry?.ai_analysis || activeEntry?.analysis || null;
  const activeMood = moodInfo(activeEntry?.mood || activeAnalysis?.mood);

  return (
    <div className="lm-journal" style={{ "--page-progress": `${scrollProgress}%` }}>
      <style>{styles}</style>
      <div className="lj-scroll-progress" aria-hidden="true"><span style={{ width: `${scrollProgress}%` }} /></div>
      <div className="lj-memory-rail" aria-hidden="true">
        <span className="lj-memory-rail-track" />
        <span className="lj-memory-mote" style={{ top: `${scrollProgress}%` }}><i /></span>
        <span className="lj-memory-rail-label">YOUR STORY</span>
      </div>
      <header className="lj-topbar">
        <button className="lj-brand" onClick={() => { window.location.href = "/dashboard"; }} aria-label="Go to dashboard">
          <span className="lj-brand-icon">✿</span>
          <span className="lj-brand-name">Life<span>Mirror</span><small>YOUR PERSONAL REFLECTION SPACE</small></span>
        </button>
        <div className="lj-top-actions">
          <span className="lj-private"><span>●</span> A SPACE JUST FOR YOU</span>
          <span className="lj-avatar" aria-label={`Signed in as ${firstName}`}>{firstName.charAt(0).toUpperCase()}</span>
        </div>
      </header>

      <main className="lj-shell">
        <section className="lj-hero lj-scene lj-scene-intro">
          <div className="lj-hero-copy">
            <span className="lj-kicker">PAUSE · NOTICE · REFLECT</span>
            <h1>Make space for <em>yourself,</em> {firstName}.</h1>
            <p>No perfect words needed. Just a softer place to untangle your thoughts, notice what matters, and meet yourself with a little more kindness.</p>
            <button className="lj-button lj-button-primary" onClick={startNewEntry}><span>＋</span> Write a reflection</button>
            <div className="lj-hero-foot"><span>♡</span> Your pace. Your words. No judgement.</div>
          </div>
          <div className="lj-hero-art" aria-hidden="true">
            <div className="lj-sun-glow" />
            <div className="lj-art-ring ring-a" /><div className="lj-art-ring ring-b" />
            <div className="lj-art-flower">✿</div>
            <div className="lj-art-note"><span>A gentle reminder</span><strong key={reminderIndex} className="lj-rotating-quote">{REMINDERS[reminderIndex]}</strong></div>
          </div>
        </section>

        <section className="lj-gentle-banner lj-scene lj-scene-reminder" aria-live="polite">
          <span className="lj-banner-icon">✧</span>
          <div key={reminderIndex} className="lj-reminder-copy">
            <span>A LITTLE REMINDER FOR YOU</span>
            <p>{REMINDERS[reminderIndex]}</p>
          </div>
          <button type="button" className="lj-reminder-next" onClick={() => setReminderIndex((current) => (current + 1) % REMINDERS.length)} aria-label="Show another reminder">↗</button>
        </section>

        <section className={`lj-breathe-card lj-scene lj-scene-breathe ${breathingActive ? "is-breathing" : ""}`}>
          <div className="lj-breathe-copy">
            <span className="lj-kicker">A PAUSE, JUST FOR YOU</span>
            <h2>{breathingActive ? "Breathe in… and slowly out." : "Give your mind a softer moment."}</h2>
            <p>{breathingActive ? "Follow the circle. Inhale as it grows, then exhale as it settles. There is nothing else you need to do right now." : "A short breathing pause can help you step out of the rush. No streaks, no pressure—just a moment to arrive."}</p>
            <button className="lj-button lj-button-quiet" type="button" onClick={() => setBreathingActive((active) => !active)}>{breathingActive ? "Finish my pause" : "Take a 30-second pause"} <span>{breathingActive ? "×" : "↗"}</span></button>
          </div>
          <div className="lj-breathe-visual" aria-label={breathingActive ? "Breathing animation active" : "Breathing circle"}>
            <div className="lj-breathe-orbit orbit-one" /><div className="lj-breathe-orbit orbit-two" />
            <div className="lj-breathe-circle"><span>{breathingActive ? "breathe" : "inhale"}</span><small>{breathingActive ? "and exhale" : "at your pace"}</small></div>
          </div>
        </section>

        <section className="lj-stats lj-scene lj-scene-stats" aria-label="Journal overview">
          <article className="lj-stat"><span className="lj-stat-icon sage">✎</span><div><small>REFLECTIONS</small><strong>{entries.length}</strong><p>Every page is part of your story</p></div></article>
          <article className="lj-stat"><span className="lj-stat-icon peach">☼</span><div><small>POSITIVE MOMENTS</small><strong>{positiveCount}</strong><p>Entries the AI read as positive</p></div></article>
          <article className="lj-stat"><span className="lj-stat-icon lilac">♡</span><div><small>CHECK-INS TODAY</small><strong>{todayCount}</strong><p>{todayCount ? "You made time to check in" : "There is no rush to write"}</p></div></article>
        </section>

        {error && <div className="lj-message error" role="alert"><span>!</span><p>{error}</p><button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
        {notice && <div className="lj-message success" role="status"><span>✓</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}

        <div className="lj-layout">
          <section className="lj-left-column">
            {showEditor ? (
              <article className="lj-card lj-composer lj-scene-editor">
                <div className="lj-section-heading">
                  <div><span className="lj-kicker">{editingId ? "A SECOND LOOK" : "A MOMENT TO CHECK IN"}</span><h2>{editingId ? "Edit your reflection" : "What’s on your mind?"}</h2><p>Start with whatever feels easiest. You can keep it short.</p></div>
                  <span className="lj-heading-flower">✿</span>
                </div>
                <div className="lj-prompts-label">NEED A STARTING POINT?</div>
                <div className="lj-prompts">
                  {PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => setText((current) => current.trim() ? `${current.trim()}\n\n${prompt}\n` : `${prompt}\n`)}>{prompt}<span>↗</span></button>)}
                </div>
                <label className="lj-label" htmlFor="lj-journal-text">YOUR REFLECTION</label>
                <textarea id="lj-journal-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={20000} placeholder={"Start anywhere…\n\nWhat did today feel like? What do you wish someone understood? You don’t need to make it sound a certain way."} />
                <div className="lj-writing-meta"><span>{text.length.toLocaleString()} / 20,000 characters</span><span>{text.trim() ? `${text.trim().split(/\s+/).length} words` : "Take your time"}</span></div>
                <div className="lj-composer-actions">
                  {editingId && <button className="lj-button lj-button-quiet" onClick={cancelEditing} disabled={saving}>Cancel edit</button>}
                  {!editingId && <button className="lj-button lj-button-quiet" onClick={() => setText("")} disabled={!text || saving}>Clear</button>}
                  <button className="lj-button lj-button-primary" onClick={saveEntry} disabled={saving || !text.trim()}>{saving ? <><span className="lj-button-spinner" /> {editingId ? "Updating…" : "Saving…"}</> : editingId ? "Save changes ✓" : "Save reflection ↗"}</button>
                </div>
                <div className="lj-privacy"><span>⌑</span><p>Your writing is personal. AI insights are estimates based on the words you share—not a diagnosis or a definition of who you are.</p></div>
              </article>
            ) : (
              <article className="lj-card lj-write-again"><span className="lj-write-icon">✧</span><span className="lj-kicker">YOUR PAGE IS HERE WHEN YOU NEED IT</span><h2>Make a little room for yourself.</h2><p>Even a few lines count. There is no streak to maintain and nothing to get right.</p><button className="lj-button lj-button-primary" onClick={startNewEntry}>＋ Start writing</button></article>
            )}

            {activeEntry && (
              <article className="lj-card lj-detail">
                <div className="lj-section-heading">
                  <div><span className="lj-kicker">A CLOSER LOOK</span><h2>Your reflection</h2><p>{formatDate(activeEntry.timestamp)}</p></div>
                  <button className="lj-icon-button" onClick={() => setActiveEntry(null)} aria-label="Close entry details">×</button>
                </div>
                <div className={`lj-mood-banner ${activeMood.className}`}><span className="lj-mood-symbol">{activeMood.icon}</span><div><small>AI-INTERPRETED MOOD</small><strong>{activeMood.label}</strong></div><span className="lj-mood-disclaimer">An estimate, not a verdict</span></div>
                <div className="lj-full-entry">{activeEntry.text || "No text was saved for this entry."}</div>
                {activeAnalysis ? (
                  <div className="lj-insights">
                    <div className="lj-insights-heading"><span className="lj-kicker">YOUR JOURNAL INSIGHTS</span><span className="lj-ai-mark">✦ AI reflection</span></div>
                    {activeAnalysis.summary && <div className="lj-insight-block"><h3>What this entry is about</h3><p>{activeAnalysis.summary}</p></div>}
                    {Array.isArray(activeAnalysis.emotions) &&
                      activeAnalysis.emotions.length > 0 && (
                        <div className="lj-insight-block">
                          <h3>Emotions noticed</h3>
                          <div className="lj-emotion-list">
                            {activeAnalysis.emotions.map((emotion, index) => (
                              <div
                                className="lj-emotion"
                                key={`${emotion.label}-${index}`}
                              >
                                <div>
                                  <strong>{prettyLabel(emotion.label)}</strong>
                                  <span>{emotion.intensity}/10 intensity</span>
                                </div>
                                <div className="lj-intensity-track">
                                  <span
                                    style={{
                                      width: `${Math.min(10, Math.max(1, Number(emotion.intensity) || 1)) * 10}%`,
                                    }}
                                  />
                                </div>
                                {emotion.evidence && <p>“{emotion.evidence}”</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    {Array.isArray(activeAnalysis.themes) && activeAnalysis.themes.length > 0 && <div className="lj-insight-block"><h3>Themes in your words</h3><div className="lj-theme-list">{activeAnalysis.themes.map((theme, index) => <span key={`${theme}-${index}`}>{prettyLabel(theme)}</span>)}</div></div>}
                    {Number(activeAnalysis.overall_intensity) > 0 && <div className="lj-intensity-summary"><span>Emotional intensity</span><strong>{activeAnalysis.overall_intensity}/10</strong><div className="lj-intensity-track"><span style={{ width: `${Math.min(10, Math.max(1, Number(activeAnalysis.overall_intensity))) * 10}%` }} /></div></div>}
                    {activeAnalysis.supportive_response && <div className="lj-gentle-response"><span>♡</span><div><h3>A gentle thought</h3><p>{activeAnalysis.supportive_response}</p></div></div>}
                    {activeAnalysis.suggested_action && <div className="lj-next-step"><span>One small next step</span><p>{activeAnalysis.suggested_action}</p></div>}
                    <p className="lj-ai-disclaimer">These are AI-generated interpretations of this entry, not clinical advice. Keep what feels useful and leave the rest.</p>
                  </div>
                ) : (
                  <div className="lj-no-analysis"><span>✧</span><div><strong>Insights aren’t available for this entry yet</strong><p>This may be an older journal saved before AI analysis was added. New saves and edits will include insights.</p></div></div>
                )}
                <div className="lj-detail-actions"><button className="lj-button lj-button-quiet" onClick={() => startEditing(activeEntry)}>✎ Edit reflection</button><button className="lj-button lj-button-danger-quiet" onClick={() => setDeleteTarget(activeEntry)}>Delete entry</button></div>
              </article>
            )}
          </section>

          <section className="lj-card lj-archive lj-scene-archive">
            <div className="lj-section-heading">
              <div><span className="lj-kicker">YOUR PERSONAL ARCHIVE</span><h2>Past reflections</h2><p>Revisit a moment with curiosity, not judgement.</p></div>
              <span className="lj-count">{entries.length} saved</span>
            </div>
            <label className="lj-search"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search words, themes, emotions…" aria-label="Search reflections" />{search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}</label>
            <div className="lj-filters">
              <label><span>MOOD</span><select value={moodFilter} onChange={(event) => setMoodFilter(event.target.value)}><option value="all">All moods</option><option value="positive">Positive</option><option value="negative">Negative</option><option value="neutral">Neutral</option></select></label>
              <label><span>ORDER</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
            </div>
            {loading ? <div className="lj-loading"><span className="lj-loader" /><p>Opening your reflection space…</p></div> : filteredEntries.length === 0 ? (
              <div className="lj-empty"><span>{search || moodFilter !== "all" ? "⌕" : "✿"}</span><h3>{search || moodFilter !== "all" ? "Nothing found just yet" : "Your story begins here"}</h3><p>{search || moodFilter !== "all" ? "Try another search or clear the filters." : "Your saved reflections will live here. Write whenever it feels right."}</p>{(search || moodFilter !== "all") && <button className="lj-button lj-button-quiet" onClick={() => { setSearch(""); setMoodFilter("all"); }}>Clear filters</button>}{!search && moodFilter === "all" && <button className="lj-button lj-button-primary" onClick={startNewEntry}>Write first reflection</button>}</div>
            ) : (
              <div className="lj-entry-list">
                {filteredEntries.map((entry, index) => {
                  const mood = moodInfo(entry.mood || entry.ai_analysis?.mood);
                  const id = entryId(entry);
                  const selected = Boolean(activeEntry && id && entryId(activeEntry) === id);
                  const summary = entry.ai_analysis?.summary;
                  return <article key={id || `${entry.timestamp}-${index}`} className={`lj-entry ${selected ? "selected" : ""}`}>
                    <button className="lj-entry-open" onClick={() => { setActiveEntry(entry); setShowEditor(false); }}>
                      <div className="lj-entry-top"><time>{formatDate(entry.timestamp, false)}</time><span className={`lj-mood-pill ${mood.className}`}>{mood.icon} {mood.label}</span></div>
                      <p>{entry.text || "Empty reflection"}</p>
                      {summary && <small className="lj-entry-summary">{summary}</small>}
                      <span className="lj-entry-link">Open reflection <span>↗</span></span>
                    </button>
                    <div className="lj-entry-actions"><button title="Edit reflection" aria-label="Edit reflection" onClick={() => startEditing(entry)}>✎</button><button className="lj-entry-delete" title="Delete reflection" aria-label="Delete reflection" onClick={() => setDeleteTarget(entry)}>⌫</button></div>
                  </article>;
                })}
              </div>
            )}
            <div className="lj-archive-footer"><span>Showing {filteredEntries.length} of {entries.length}</span><button onClick={() => loadEntries()} disabled={loading}>↻ Refresh archive</button></div>
          </section>
        </div>

        <section className="lj-bottom-reminder lj-scene lj-scene-closing"><span className="lj-reminder-icon">☼</span><div><span className="lj-kicker">A REMINDER TO KEEP</span><h2>You are allowed to feel what you feel.</h2><p>Your journal is a place to notice your experience—not judge yourself for having it.</p></div><span className="lj-reminder-flower">✿</span></section>
        <footer className="lj-footer"><span>LifeMirror <i>•</i> Your reflection space</span><span>Small moments of honesty count, too.</span></footer>
      </main>

      {moodFeedback && <div className={`lj-feedback-toast ${moodFeedback.mood.toLowerCase()}`} role="status" aria-live="polite">
        {moodFeedback.mood === "Positive" && <div className="lj-celebration-bits" aria-hidden="true">{CELEBRATION_BITS.map((bit, index) => <span key={`${bit}-${index}`} style={{ "--bit-index": index }}>{bit}</span>)}</div>}
        <button className="lj-feedback-close" onClick={() => setMoodFeedback(null)} aria-label="Dismiss message">×</button>
        <span className="lj-feedback-icon">{moodFeedback.mood === "Positive" ? "☀" : moodFeedback.mood === "Negative" ? "♡" : "✧"}</span>
        <div><span className="lj-kicker">{moodFeedback.mood === "Positive" ? "A MOMENT WORTH NOTICING" : moodFeedback.mood === "Negative" ? "GIVE YOURSELF SOME GRACE" : "YOU SHOWED UP FOR YOURSELF"}</span><h2>{moodFeedback.title}</h2><p>{moodFeedback.message}</p></div>
      </div>}

      {deleteTarget && <div className="lj-modal-backdrop" onClick={() => !deletingId && setDeleteTarget(null)}>
        <section className="lj-modal" role="dialog" aria-modal="true" aria-labelledby="lj-delete-title" onClick={(event) => event.stopPropagation()}>
          <span className="lj-modal-symbol">⌫</span><span className="lj-kicker">YOUR PERSONAL ARCHIVE</span><h2 id="lj-delete-title">Delete this reflection?</h2><p>This will permanently remove the entry from your journal. If you’re unsure, you can keep it instead.</p>
          <div className="lj-modal-actions"><button className="lj-button lj-button-quiet" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>Keep entry</button><button className="lj-button lj-button-danger" onClick={deleteEntry} disabled={Boolean(deletingId)}>{deletingId ? "Deleting…" : "Delete permanently"}</button></div>
        </section>
      </div>}
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
.lm-journal{--ink:#34423b;--muted:#748078;--line:#e2e8df;--paper:#fbfcf8;--card:#fffefa;--sage:#dcebe0;--sage-deep:#547a65;--sage-dark:#315b48;--lav:#eee8f6;--lav-deep:#84719c;--peach:#f7e6d8;--rose:#f7e5e3;min-height:100vh;background:radial-gradient(ellipse at 8% 0%,#e8f2e7 0,transparent 34%),radial-gradient(ellipse at 100% 25%,#f0eafa 0,transparent 30%),var(--paper);color:var(--ink);font-family:'DM Sans',sans-serif;padding-bottom:30px}
.lm-journal *{box-sizing:border-box}.lm-journal button,.lm-journal input,.lm-journal textarea,.lm-journal select{font:inherit}.lm-journal button{transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease}.lm-journal button:focus-visible,.lm-journal input:focus-visible,.lm-journal textarea:focus-visible,.lm-journal select:focus-visible{outline:3px solid #a7c9b0;outline-offset:3px}.lm-journal button:disabled{opacity:.55;cursor:not-allowed;transform:none}
.lj-topbar{height:76px;padding:0 clamp(18px,5vw,72px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4e9e1;background:#ffffffc9;backdrop-filter:blur(14px)}.lj-brand{display:flex;align-items:center;gap:11px;background:transparent;border:0;color:var(--ink);text-align:left;cursor:pointer}.lj-brand-icon{width:39px;height:39px;border-radius:14px;background:var(--sage);color:var(--sage-dark);display:grid;place-items:center;font-size:25px}.lj-brand-name{font:800 20px Manrope,sans-serif;letter-spacing:-.7px}.lj-brand-name>span{color:var(--sage-deep)}.lj-brand-name small{display:block;margin-top:3px;color:var(--muted);font:700 8px 'DM Sans',sans-serif;letter-spacing:1.4px}.lj-top-actions{display:flex;align-items:center;gap:14px}.lj-private{padding:9px 13px;border:1px solid var(--line);border-radius:30px;color:var(--sage-dark);background:#fffefa;font-size:9px;font-weight:700;letter-spacing:.6px}.lj-private span{color:#78a788;margin-right:6px}.lj-avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--lav);color:#67577f;font-weight:800}
.lj-shell{width:min(1320px,100%);margin:auto;padding:28px clamp(14px,4vw,52px) 0}.lj-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);align-items:center;gap:24px;padding:34px clamp(22px,4vw,48px);min-height:270px;border:1px solid #dfe9dc;border-radius:27px;background:linear-gradient(115deg,#f4f8f0 0%,#f9f7f2 55%,#f1ebf8 100%);box-shadow:0 12px 35px #344b3510}.lj-hero-copy{position:relative;z-index:1}.lj-kicker{display:block;color:var(--sage-deep);font-size:9px;font-weight:800;letter-spacing:1.65px}.lj-hero h1{max-width:630px;margin:13px 0;font:800 clamp(32px,4vw,49px)/1.12 Manrope,sans-serif;letter-spacing:-1.8px}.lj-hero h1 em{font-style:normal;color:var(--sage-deep)}.lj-hero-copy>p{max-width:570px;color:#6d7971;font-size:13px;line-height:1.85;margin:0 0 20px}.lj-button{min-height:41px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:10px 15px;font-size:11px;font-weight:800;cursor:pointer}.lj-button:hover:not(:disabled){transform:translateY(-1px)}.lj-button-primary{border:1px solid var(--sage-dark);background:var(--sage-dark);color:#fff;box-shadow:0 5px 13px #315b481a}.lj-button-primary:hover:not(:disabled){background:#254a39;box-shadow:0 8px 18px #315b4827}.lj-button-quiet{border:1px solid var(--line);background:#fffefa;color:#56645b}.lj-button-quiet:hover:not(:disabled){border-color:#adc7b2;background:#f5faf3}.lj-button-danger-quiet{border:1px solid #edd6d2;background:#fff8f6;color:#9b5e57}.lj-button-danger{border:1px solid #a75c55;background:#a75c55;color:white}.lj-button-spinner{width:13px;height:13px;border:2px solid #ffffff70;border-top-color:white;border-radius:50%;animation:ljspin .7s linear infinite}.lj-hero-foot{display:flex;align-items:center;gap:8px;margin-top:15px;color:#7d897f;font-size:10px}.lj-hero-foot span{color:#b78393;font-size:15px}
.lj-hero-art{height:205px;position:relative;display:grid;place-items:center}.lj-sun-glow{position:absolute;width:155px;height:155px;border-radius:50%;background:radial-gradient(circle,#f4d9a8b8 0,#f5e8c5a0 42%,transparent 72%)}.lj-art-ring{position:absolute;left:50%;top:49%;border:1px solid #9db9a888;border-radius:50%;transform:translate(-50%,-50%)}.ring-a{width:170px;height:170px}.ring-b{width:235px;height:105px;transform:translate(-50%,-50%) rotate(-31deg);border-color:#c4b5d8a0}.lj-art-flower{position:relative;display:grid;place-items:center;width:98px;height:98px;border:1px solid #d7dfc7;border-radius:35px;background:linear-gradient(145deg,#fffdf3,#e2eddf);box-shadow:0 12px 30px #6e8e6f20;color:#78997c;font-size:61px;transform:rotate(-8deg)}.lj-art-note{position:absolute;right:0;bottom:0;max-width:230px;padding:12px 14px;border:1px solid #e4dfeb;border-radius:14px;background:#fffef9eF;box-shadow:0 7px 20px #4d4a5b0c}.lj-art-note span{display:block;margin-bottom:5px;color:var(--lav-deep);font-size:9px;font-weight:800;letter-spacing:.5px}.lj-art-note strong{display:block;font:700 11px/1.6 Manrope,sans-serif;color:#505a52}
.lj-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin:15px 0}.lj-stat{display:flex;align-items:center;gap:13px;min-width:0;padding:17px;border:1px solid #e5e9e0;border-radius:18px;background:#fffefaed;box-shadow:0 5px 17px #3c554008}.lj-stat-icon{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:14px;font-size:22px}.lj-stat-icon.sage{background:#e5f0e4;color:#52785f}.lj-stat-icon.peach{background:#f9ebdf;color:#ad8161}.lj-stat-icon.lilac{background:#eee8f6;color:#8976a2}.lj-stat>div{min-width:0}.lj-stat small{display:block;color:#89938b;font-size:8px;font-weight:800;letter-spacing:1.1px}.lj-stat strong{display:block;margin:3px 0 2px;font:800 23px Manrope,sans-serif}.lj-stat p{margin:0;color:#849087;font-size:9px;line-height:1.5}
.lj-message{display:flex;align-items:center;gap:10px;margin:12px 0;padding:12px 14px;border:1px solid;border-radius:13px;font-size:12px}.lj-message>span{width:23px;height:23px;display:grid;place-items:center;border-radius:50%;font-weight:800}.lj-message p{flex:1;margin:0;line-height:1.5}.lj-message button{border:0;background:transparent;color:inherit;font-size:20px;cursor:pointer}.lj-message.error{border-color:#f0d6d0;background:#fff5f2;color:#965d56}.lj-message.error>span{background:#f4dfda}.lj-message.success{border-color:#d5e7d5;background:#f2f8ef;color:#477454}.lj-message.success>span{background:#dceedd}
.lj-layout{display:grid;grid-template-columns:minmax(0,1.03fr) minmax(0,.97fr);align-items:start;gap:16px;margin-top:16px}.lj-left-column{display:flex;flex-direction:column;gap:16px;min-width:0}.lj-card{min-width:0;border:1px solid #e2e8df;border-radius:20px;background:var(--card);box-shadow:0 7px 24px #33493408}.lj-composer,.lj-detail,.lj-archive{padding:23px}.lj-section-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.lj-section-heading h2{margin:7px 0 5px;font:800 20px Manrope,sans-serif;letter-spacing:-.5px}.lj-section-heading p{margin:0;color:#7c887f;font-size:11px;line-height:1.7}.lj-heading-flower{display:grid;place-items:center;width:41px;height:41px;flex:0 0 41px;border-radius:14px;background:#e7f0e3;color:#739379;font-size:25px}.lj-prompts-label{margin:21px 0 9px;color:#89938b;font-size:8px;font-weight:800;letter-spacing:1.2px}.lj-prompts{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:19px}.lj-prompts button{display:inline-flex;align-items:center;gap:8px;border:1px solid #e1e8dd;border-radius:25px;background:#f8faf5;color:#637368;padding:9px 11px;font-size:9px;cursor:pointer}.lj-prompts button span{color:#789d81}.lj-prompts button:hover{background:#eaf3e7;border-color:#c5d9c4;transform:translateY(-1px)}.lj-label{display:block;margin:0 0 8px;color:#6c7d70;font-size:8px;font-weight:800;letter-spacing:1.2px}.lj-composer textarea{display:block;width:100%;min-height:235px;resize:vertical;border:1px solid #e1e8dd;border-radius:14px;background:#fcfdf9;padding:15px;color:#3d4d42;font-size:12px;line-height:1.9;outline:none}.lj-composer textarea::placeholder{color:#a0aaa0}.lj-composer textarea:focus{border-color:#a9c7ae;box-shadow:0 0 0 4px #dcebdd80}.lj-writing-meta{display:flex;justify-content:space-between;gap:10px;margin-top:8px;color:#929b92;font-size:9px}.lj-composer-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:17px}.lj-privacy{display:flex;gap:9px;align-items:flex-start;margin-top:18px;padding-top:14px;border-top:1px solid #edf0e9}.lj-privacy>span{color:#789a7e;font-size:17px}.lj-privacy p{margin:0;color:#89938b;font-size:9px;line-height:1.7}.lj-write-again{text-align:center;padding:36px 23px}.lj-write-icon{display:grid;place-items:center;width:54px;height:54px;margin:0 auto 16px;border-radius:18px;background:#e7f0e3;color:#709377;font-size:28px}.lj-write-again h2{font:800 20px Manrope,sans-serif;margin:10px 0}.lj-write-again p{max-width:330px;margin:0 auto 17px;color:#7c887f;font-size:12px;line-height:1.8}
.lj-archive{padding:23px 19px}.lj-count{flex:0 0 auto;border:1px solid #dfe9dc;border-radius:24px;background:#f3f8ef;padding:8px 10px;color:#66826b;font-size:9px;font-weight:800}.lj-search{display:flex;align-items:center;gap:9px;margin-top:19px;padding:0 12px;border:1px solid #e1e8dd;border-radius:12px;background:#fcfdf9}.lj-search>span{color:#8c9b8f;font-size:21px}.lj-search input{width:100%;min-width:0;height:42px;border:0;outline:0;background:transparent;color:var(--ink);font-size:10px}.lj-search input::placeholder{color:#9ca69d}.lj-search button{border:0;background:transparent;color:#7c887f;font-size:18px;cursor:pointer}.lj-filters{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.lj-filters label{display:block}.lj-filters label>span{display:block;margin:0 0 5px 2px;color:#909a91;font-size:7px;font-weight:800;letter-spacing:1px}.lj-filters select{width:100%;min-width:0;border:1px solid #e1e8dd;border-radius:10px;background:#f7faf4;color:#627066;padding:10px;font-size:10px;outline:none}.lj-entry-list{display:flex;flex-direction:column;gap:10px;margin-top:15px}.lj-entry{position:relative;border:1px solid #e6ebe3;border-radius:14px;background:#fffefa;overflow:hidden;transition:border-color .18s,box-shadow .18s,background .18s}.lj-entry:hover,.lj-entry.selected{border-color:#c0d6c0;background:#fbfdf8;box-shadow:0 5px 15px #476c4d0c}.lj-entry-open{display:block;width:100%;border:0;background:transparent;text-align:left;padding:14px 43px 14px 14px;cursor:pointer;color:inherit}.lj-entry-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.lj-entry-top time{color:#929b92;font-size:9px}.lj-mood-pill{white-space:nowrap;padding:5px 8px;border-radius:20px;font-size:8px;font-weight:800}.lj-mood-pill.positive{background:#e5f2e3;color:#527a58}.lj-mood-pill.negative{background:#f8e9e6;color:#a36c64}.lj-mood-pill.neutral{background:#eeeaf6;color:#807099}.lj-entry-open>p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line;overflow-wrap:anywhere;margin:12px 0 8px;color:#526055;font-size:11px;line-height:1.75}.lj-entry-summary{display:block;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0 0 9px;color:#8a938a;font-size:9px;line-height:1.6}.lj-entry-link{color:#608568;font-size:9px;font-weight:800}.lj-entry-link span{margin-left:4px}.lj-entry-actions{position:absolute;right:9px;bottom:10px;display:flex;flex-direction:column;gap:5px}.lj-entry-actions button{width:27px;height:27px;border:1px solid #e3e9e0;border-radius:9px;background:#fffefa;color:#7d8c7e;cursor:pointer}.lj-entry-actions button:hover{border-color:#b6cfb6;background:#edf5e9}.lj-entry-actions .lj-entry-delete:hover{border-color:#edd1cb;background:#fff1ed;color:#a75e56}.lj-archive-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:15px;padding-top:13px;border-top:1px solid #edf0e9;color:#919a91;font-size:9px}.lj-archive-footer button{border:0;background:transparent;color:#65876b;font-size:9px;font-weight:800;cursor:pointer}.lj-empty,.lj-loading{display:flex;flex-direction:column;align-items:center;text-align:center;padding:35px 17px 28px}.lj-empty>span{width:49px;height:49px;display:grid;place-items:center;border-radius:16px;background:#eaf2e6;color:#78977b;font-size:25px}.lj-empty h3{margin:12px 0 6px;font:800 15px Manrope,sans-serif}.lj-empty p,.lj-loading p{max-width:290px;margin:0 0 13px;color:#859087;font-size:10px;line-height:1.8}.lj-loader{width:25px;height:25px;margin-bottom:12px;border:2px solid #dce8d9;border-top-color:#709779;border-radius:50%;animation:ljspin .7s linear infinite}@keyframes ljspin{to{transform:rotate(360deg)}}
.lj-detail .lj-section-heading{margin-bottom:17px}.lj-icon-button{width:32px;height:32px;border:1px solid #e1e8dd;border-radius:10px;background:#f8faf5;color:#6e7c70;font-size:20px;cursor:pointer}.lj-mood-banner{display:flex;align-items:center;gap:11px;padding:12px;border:1px solid #e3e9df;border-radius:13px;background:#f8faf5}.lj-mood-banner.positive{background:#f0f7ed;border-color:#d9e9d4}.lj-mood-banner.negative{background:#fff5f1;border-color:#f1ddd7}.lj-mood-banner.neutral{background:#f5f1fa;border-color:#e8dff0}.lj-mood-symbol{width:37px;height:37px;display:grid;place-items:center;border-radius:12px;background:#ffffffb5;color:#658b6d;font-size:20px}.lj-mood-banner>div{display:flex;flex-direction:column;gap:4px}.lj-mood-banner small{color:#8b978c;font-size:7px;font-weight:800;letter-spacing:1px}.lj-mood-banner strong{font:800 13px Manrope,sans-serif}.lj-mood-disclaimer{margin-left:auto;color:#89938a;font-size:8px;text-align:right}.lj-full-entry{padding:17px 3px 20px;white-space:pre-wrap;overflow-wrap:anywhere;color:#526055;font-size:12px;line-height:1.95}.lj-insights{border-top:1px solid #edf0e9;padding-top:18px}.lj-insights-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}.lj-ai-mark{color:#8c79a4;font-size:9px;font-weight:800}.lj-insight-block{margin-top:17px}.lj-insight-block h3,.lj-gentle-response h3{margin:0 0 8px;font:800 12px Manrope,sans-serif;color:#45564a}.lj-insight-block>p{margin:0;color:#748177;font-size:11px;line-height:1.8}.lj-emotion-list{display:grid;gap:9px}.lj-emotion{padding:11px;border:1px solid #e8ece5;border-radius:12px;background:#fcfdf9}.lj-emotion>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:8px}.lj-emotion strong{font-size:10px;color:#526455}.lj-emotion>div:first-child span{color:#8c978d;font-size:8px}.lj-intensity-track{height:5px;margin-top:8px;border-radius:10px;background:#e9eee6;overflow:hidden}.lj-intensity-track span{display:block;height:100%;border-radius:10px;background:linear-gradient(90deg,#b7d5b6,#729a7b)}.lj-emotion>p{margin:8px 0 0;color:#8a958b;font-size:9px;line-height:1.6}.lj-theme-list{display:flex;flex-wrap:wrap;gap:7px}.lj-theme-list span{padding:7px 10px;border:1px solid #e1e9de;border-radius:20px;background:#f4f8f0;color:#6b816e;font-size:9px}.lj-intensity-summary{margin-top:17px;padding:12px;border:1px solid #e6eade;border-radius:12px;background:#f9fbf6}.lj-intensity-summary>span{color:#768378;font-size:10px}.lj-intensity-summary>strong{float:right;color:#597960;font:800 11px Manrope,sans-serif}.lj-gentle-response{display:flex;gap:10px;margin-top:17px;padding:14px;border:1px solid #e0e9dc;border-radius:13px;background:#f4f8f0}.lj-gentle-response>span{color:#7d9e80;font-size:20px}.lj-gentle-response p{margin:0;color:#6e7e70;font-size:10px;line-height:1.8}.lj-next-step{margin-top:12px;padding:13px;border-left:3px solid #b5cdb0;border-radius:0 10px 10px 0;background:#faf8f0}.lj-next-step>span{color:#788c71;font-size:8px;font-weight:800;letter-spacing:.7px;text-transform:uppercase}.lj-next-step p{margin:6px 0 0;color:#68776a;font-size:10px;line-height:1.8}.lj-ai-disclaimer{margin:13px 0 0;color:#98a097;font-size:8px;line-height:1.7}.lj-no-analysis{display:flex;gap:10px;padding:13px;border:1px solid #e8ece4;border-radius:12px;background:#fafbf7}.lj-no-analysis>span{color:#8d7da2;font-size:21px}.lj-no-analysis strong{font-size:10px}.lj-no-analysis p{margin:5px 0 0;color:#879188;font-size:9px;line-height:1.7}.lj-detail-actions{display:flex;flex-wrap:wrap;gap:8px;padding-top:16px;border-top:1px solid #edf0e9}
.lj-bottom-reminder{display:flex;align-items:center;gap:15px;margin-top:17px;padding:20px 23px;border:1px solid #e1e8dc;border-radius:18px;background:linear-gradient(100deg,#f0f6eb,#faf6ef 65%,#f3eef8)}.lj-reminder-icon{width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border-radius:14px;background:#fffefa;color:#b58b60;font-size:24px}.lj-bottom-reminder>div{flex:1}.lj-bottom-reminder h2{margin:6px 0;font:800 15px Manrope,sans-serif}.lj-bottom-reminder p{margin:0;color:#7f8a80;font-size:10px;line-height:1.7}.lj-reminder-flower{color:#86a58a;font-size:28px}.lj-footer{display:flex;justify-content:space-between;gap:12px;padding:17px 2px 0;color:#98a097;font-size:9px}.lj-footer i{font-style:normal;color:#9ab49a;margin:0 5px}
.lj-modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:#26352c66;backdrop-filter:blur(7px)}.lj-modal{width:min(420px,100%);padding:27px;border:1px solid #e2e8dc;border-radius:22px;background:#fffefa;box-shadow:0 25px 80px #24352a30;animation:ljrise .2s ease}.lj-modal-symbol{display:grid;place-items:center;width:47px;height:47px;margin-bottom:18px;border-radius:15px;background:#f8e8e2;color:#a6675e;font-size:24px}.lj-modal h2{margin:9px 0;font:800 22px Manrope,sans-serif;letter-spacing:-.5px}.lj-modal>p{margin:0;color:#78847a;font-size:12px;line-height:1.8}.lj-modal-actions{display:flex;gap:9px;margin-top:23px}.lj-modal-actions button{flex:1}@keyframes ljrise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:980px){.lj-layout{grid-template-columns:1fr}.lj-archive{order:2}.lj-hero{grid-template-columns:minmax(0,1fr) 270px}.lj-entry-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){.lj-topbar{height:66px;padding:0 14px}.lj-brand-icon{width:34px;height:34px;font-size:22px}.lj-brand-name{font-size:17px}.lj-brand-name small{font-size:6px;letter-spacing:.8px}.lj-private{font-size:0;padding:9px}.lj-private span{font-size:10px;margin:0}.lj-avatar{width:32px;height:32px}.lj-shell{padding:15px 11px 0}.lj-hero{grid-template-columns:1fr;padding:24px 19px;gap:8px;border-radius:21px}.lj-hero h1{font-size:32px}.lj-hero-copy>p{font-size:11px}.lj-hero-art{height:145px}.lj-art-flower{width:75px;height:75px;font-size:47px}.lj-art-note{max-width:190px;padding:9px 11px}.lj-art-note strong{font-size:9px}.lj-stats{grid-template-columns:1fr;gap:8px}.lj-stat{padding:12px 14px}.lj-stat-icon{width:36px;height:36px;flex-basis:36px}.lj-stat strong{font-size:20px}.lj-composer,.lj-detail,.lj-archive{padding:16px}.lj-section-heading h2{font-size:18px}.lj-prompts{gap:6px}.lj-prompts button{font-size:8px;padding:8px 9px}.lj-composer textarea{min-height:210px;padding:12px;font-size:11px}.lj-writing-meta{font-size:8px}.lj-composer-actions{justify-content:stretch}.lj-composer-actions .lj-button{flex:1}.lj-entry-list{display:flex}.lj-entry-open{padding-right:42px}.lj-mood-disclaimer{max-width:90px;line-height:1.5}.lj-bottom-reminder{padding:14px;gap:10px;align-items:flex-start}.lj-reminder-icon{width:35px;height:35px;flex-basis:35px;font-size:19px}.lj-bottom-reminder h2{font-size:12px;line-height:1.5}.lj-bottom-reminder p{font-size:9px}.lj-reminder-flower{display:none}.lj-footer{flex-direction:column;gap:7px;font-size:8px}.lj-modal{padding:22px}.lj-modal-actions{flex-direction:column}}
@media(prefers-reduced-motion:reduce){.lm-journal *, .lm-journal *::before, .lm-journal *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}

/* LifeMirror: calm, responsive micro-interactions */
.lm-journal{--sage-deep:#416c52;--sage-dark:#365b45;--ink:#34443a;--muted:#78847a;--line:#e2e8df;--paper:#fbfcf8;--card:#fffefa;}
.lj-hero{animation:lj-soft-arrive .65s ease both;}
.lj-art-flower{animation:lj-flower-drift 6s ease-in-out infinite;}
.lj-art-note{animation:lj-note-arrive .8s .15s ease both;}
.lj-rotating-quote{display:block;animation:lj-reminder-enter .5s ease both;}
.lj-gentle-banner{position:relative;display:flex;align-items:center;gap:15px;margin:15px 0 14px;padding:15px 18px;overflow:hidden;border:1px solid #dfe9dc;border-radius:18px;background:linear-gradient(105deg,#edf5e9 0%,#fff8ee 58%,#f1ebf8 100%);box-shadow:0 8px 25px #516b4d0b;}
.lj-gentle-banner:after{content:"";position:absolute;width:140px;height:140px;right:6%;top:-100px;border-radius:50%;background:#ffffff70;pointer-events:none;}
.lj-banner-icon{display:grid;flex:0 0 42px;width:42px;height:42px;place-items:center;border-radius:15px;background:#fffdf7;color:#719678;font-size:25px;animation:lj-gentle-float 4s ease-in-out infinite;}
.lj-reminder-copy{position:relative;z-index:1;flex:1;min-width:0;animation:lj-reminder-enter .55s ease both;}
.lj-reminder-copy>span{color:#78917a;font-size:8px;font-weight:800;letter-spacing:1.4px;}
.lj-reminder-copy p{margin:5px 0 0;color:#48594b;font:700 13px/1.65 Manrope,sans-serif;}
.lj-reminder-next{position:relative;z-index:1;flex:0 0 34px;width:34px;height:34px;border:1px solid #dce7d8;border-radius:12px;background:#ffffffb8;color:#66856b;cursor:pointer;transition:transform .25s ease,background .25s ease;}
.lj-reminder-next:hover{transform:rotate(45deg);background:white;}
.lj-breathe-card{position:relative;display:flex;align-items:center;justify-content:space-between;gap:25px;margin:0 0 15px;padding:23px 27px;overflow:hidden;border:1px solid #e4e7dc;border-radius:21px;background:linear-gradient(115deg,#f5f8ef,#fbf5eb 62%,#f1edf8);}
.lj-breathe-copy{position:relative;z-index:1;max-width:590px;}
.lj-breathe-copy h2{margin:8px 0 7px;color:#3d5042;font:800 19px/1.35 Manrope,sans-serif;letter-spacing:-.4px;}
.lj-breathe-copy p{max-width:520px;margin:0 0 15px;color:#78847a;font-size:11px;line-height:1.8;}
.lj-breathe-visual{position:relative;display:grid;flex:0 0 145px;width:145px;height:145px;place-items:center;}
.lj-breathe-orbit{position:absolute;border:1px solid #a8c4a57d;border-radius:50%;}
.lj-breathe-visual .orbit-one{inset:5px;}
.lj-breathe-visual .orbit-two{inset:18px;border-color:#c6b6d77d;}
.lj-breathe-circle{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:90px;height:90px;border:1px solid #d9e5d2;border-radius:50%;background:radial-gradient(circle at 35% 28%,#fffef5,#e1edda);color:#5e8064;box-shadow:0 8px 25px #607c5d18;}
.lj-breathe-circle span{font:800 12px Manrope,sans-serif;}
.lj-breathe-circle small{margin-top:4px;color:#849383;font-size:8px;}
.lj-breathe-card.is-breathing .lj-breathe-circle{animation:lj-breath-cycle 8s ease-in-out infinite;}
.lj-breathe-card.is-breathing .orbit-one{animation:lj-orbit-pulse 8s ease-in-out infinite;}
.lj-breathe-card.is-breathing .orbit-two{animation:lj-orbit-pulse 8s .5s ease-in-out infinite;}
.lj-card{transition:box-shadow .3s ease,border-color .3s ease,transform .3s ease;}
.lj-composer:focus-within{border-color:#cbdcc7;box-shadow:0 12px 35px #526d4d0d;}
.lj-entry{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease,background .25s ease;}
.lj-entry:hover{transform:translateY(-2px);}
.lj-entry-actions{top:50%;bottom:auto;transform:translateY(-50%);z-index:3;align-items:center;justify-content:center;gap:6px;width:30px;}
.lj-entry-actions button{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px;min-width:28px;padding:0;line-height:1;font-size:14px;box-sizing:border-box;}
.lj-button-primary{transition:transform .22s ease,box-shadow .22s ease,background .22s ease;}
.lj-button-primary:hover:not(:disabled){transform:translateY(-2px);}
.lj-composer textarea{transition:border-color .25s ease,box-shadow .25s ease,background .25s ease;}
.lj-composer textarea:focus{background:#fffefa;box-shadow:0 0 0 4px #dcebdd65;}
.lj-feedback-toast{position:fixed;right:22px;bottom:22px;z-index:1200;display:flex;align-items:flex-start;gap:13px;width:min(440px,calc(100vw - 28px));padding:20px 42px 20px 18px;overflow:hidden;border:1px solid #dce8d7;border-radius:20px;background:linear-gradient(120deg,#f5faef,#fffaf0 65%,#f5effa);box-shadow:0 20px 65px #304c3430;animation:lj-toast-arrive .55s cubic-bezier(.2,.8,.2,1) both;}
.lj-feedback-toast.negative{border-color:#eedbd5;background:linear-gradient(120deg,#fff8f3,#f8f2fa);}
.lj-feedback-toast.neutral{border-color:#e5e2ed;background:linear-gradient(120deg,#f7f8f1,#f6f1fa);}
.lj-feedback-icon{display:grid;flex:0 0 43px;width:43px;height:43px;place-items:center;border-radius:15px;background:#e3efdc;color:#668c67;font-size:24px;}
.lj-feedback-toast.negative .lj-feedback-icon{background:#f5e5e2;color:#ad7b76;}
.lj-feedback-toast.neutral .lj-feedback-icon{background:#eee8f6;color:#8978a1;}
.lj-feedback-toast h2{margin:7px 0 5px;color:#405143;font:800 16px/1.35 Manrope,sans-serif;}
.lj-feedback-toast p{margin:0;color:#78847a;font-size:10px;line-height:1.75;}
.lj-feedback-close{position:absolute;top:8px;right:10px;width:28px;height:28px;border:0;border-radius:9px;background:transparent;color:#829082;font-size:20px;cursor:pointer;}
.lj-feedback-close:hover{background:#ffffffa8;}
.lj-celebration-bits{position:absolute;inset:0;pointer-events:none;}
.lj-celebration-bits span{position:absolute;top:-25px;left:calc(8% + var(--bit-index)*11%);color:#91b987;font-size:15px;animation:lj-confetti-fall 2.4s calc(var(--bit-index)*.12s) ease-in both;}
.lj-celebration-bits span:nth-child(3n){color:#d7ae7b;font-size:18px;}
.lj-celebration-bits span:nth-child(2n){color:#b8a6d4;}
@keyframes lj-soft-arrive{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes lj-note-arrive{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes lj-flower-drift{0%,100%{transform:rotate(-8deg) translateY(0)}50%{transform:rotate(-3deg) translateY(-5px)}}
@keyframes lj-reminder-enter{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes lj-gentle-float{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}}
@keyframes lj-breath-cycle{0%,100%{transform:scale(.83);box-shadow:0 5px 15px #607c5d12}50%{transform:scale(1.13);box-shadow:0 12px 35px #607c5d25}}
@keyframes lj-orbit-pulse{0%,100%{transform:scale(.92);opacity:.6}50%{transform:scale(1.05);opacity:1}}
@keyframes lj-toast-arrive{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes lj-confetti-fall{0%{transform:translateY(0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(250px) rotate(220deg);opacity:0}}
@media(max-width:650px){.lj-gentle-banner{padding:13px;gap:10px}.lj-banner-icon{flex-basis:36px;width:36px;height:36px}.lj-reminder-copy p{font-size:11px}.lj-breathe-card{padding:18px;gap:6px}.lj-breathe-copy h2{font-size:16px}.lj-breathe-copy p{font-size:10px}.lj-breathe-visual{flex-basis:95px;width:95px;height:95px}.lj-breathe-circle{width:66px;height:66px}.lj-breathe-circle span{font-size:10px}.lj-breathe-circle small{font-size:7px}.lj-feedback-toast{right:14px;bottom:14px;padding:17px 38px 17px 14px}.lj-feedback-toast h2{font-size:14px}}
@media(prefers-reduced-motion:reduce){.lj-hero,.lj-art-flower,.lj-art-note,.lj-rotating-quote,.lj-reminder-copy,.lj-banner-icon,.lj-feedback-toast,.lj-celebration-bits span{animation:none!important}.lj-entry:hover{transform:none}}

/* JOURNAL STORY MODE — a distinct, colourful editorial experience with scroll choreography */
.lm-journal{
  --paper:#f8f6f1;--card:#fffdf8;--ink:#263b3a;--muted:#71817c;
  --sage:#d9e8d9;--sage-deep:#3e7063;--sage-dark:#28584f;
  --coral:#ed927b;--coral-ink:#9c4f43;--blue:#c9e4ed;--blue-ink:#386a7a;
  --butter:#f3d98d;--butter-ink:#84631e;--lilac:#ded0f3;--lilac-ink:#7254a0;
  --rose:#f4c9d1;--rose-ink:#9a5269;position:relative;overflow:clip;
  background:radial-gradient(ellipse at 7% 6%,#d9eee2 0,transparent 25%),radial-gradient(ellipse at 96% 22%,#e5d9f5 0,transparent 22%),radial-gradient(ellipse at 4% 58%,#fae1d2 0,transparent 18%),radial-gradient(ellipse at 97% 83%,#d8eaf1 0,transparent 23%),#f8f6f1;
}
.lj-scroll-progress{position:fixed;inset:0 0 auto;z-index:1500;height:4px;background:#243d3a12;pointer-events:none}
.lj-scroll-progress span{display:block;height:100%;background:linear-gradient(90deg,#3b7464,#80b8a0 22%,#e8b17b 48%,#a38bd5 72%,#e8899b);box-shadow:0 0 12px #8bbda7a0;transition:width .08s linear}
.lj-memory-rail{position:fixed;z-index:40;right:16px;top:20vh;width:22px;height:58vh;pointer-events:none}
.lj-memory-rail-track{position:absolute;left:10px;top:0;bottom:0;width:2px;border-radius:5px;background:linear-gradient(#7cbba0,#e9c27c,#d5a3d7,#7bb6ca);opacity:.55}
.lj-memory-mote{position:absolute;left:3px;display:grid;place-items:center;width:16px;height:16px;border:1px solid #ffffffc9;border-radius:50%;background:linear-gradient(135deg,#fff4b8,#ff9c86 55%,#b6a1e6);box-shadow:0 0 0 5px #ffffff78,0 0 20px #e5a7a4;transform:translateY(-50%);transition:top .18s ease-out}
.lj-memory-mote i{width:4px;height:4px;border-radius:50%;background:white;box-shadow:0 0 6px white}
.lj-memory-rail-label{position:absolute;top:calc(100% + 12px);left:10px;writing-mode:vertical-rl;transform:rotate(180deg);color:#8b8c7d;font-size:7px;font-weight:900;letter-spacing:2px}
.lj-topbar{position:relative;z-index:2;background:#fffdf8d9;border-bottom-color:#e5e1d6}
.lj-brand-icon{background:linear-gradient(140deg,#f4d5ca,#e1d6f5);color:#6b5a78;box-shadow:0 5px 15px #8b6f8d17}
.lj-brand-name>span{color:#3e7063}
.lj-hero{isolation:isolate;min-height:340px;border:1px solid #d6e5d9;border-radius:30px;background:linear-gradient(115deg,#dff0e3 0%,#f8f0d9 45%,#f4d9d4 72%,#e8dcf6 100%);box-shadow:0 20px 55px #3d625018}
.lj-hero:before,.lj-hero:after{content:"";position:absolute;z-index:-1;pointer-events:none;border-radius:50%;filter:blur(1px)}
.lj-hero:before{width:230px;height:230px;right:9%;top:-125px;background:radial-gradient(circle,#ffffffc9,transparent 70%);animation:lj-cloud-drift 9s ease-in-out infinite}
.lj-hero:after{width:180px;height:180px;left:40%;bottom:-135px;background:radial-gradient(circle,#e6c9f3a8,transparent 72%);animation:lj-cloud-drift 11s ease-in-out infinite reverse}
.lj-hero h1{font-size:clamp(36px,4.3vw,55px);letter-spacing:-2.5px;color:#293d37}
.lj-hero h1 em{color:#b76558}
.lj-hero-copy>p{color:#586e65;font-size:13px;max-width:540px}
.lj-kicker{color:#4b8071}
.lj-button-primary{border-color:#315f54;background:linear-gradient(120deg,#315f54,#477d6c);box-shadow:0 8px 20px #315f542b}
.lj-button-primary:hover:not(:disabled){background:linear-gradient(120deg,#244c43,#3d7060);box-shadow:0 12px 25px #315f5435}
.lj-hero-art{min-height:240px}
.lj-sun-glow{width:205px;height:205px;background:radial-gradient(circle,#ffe8a5d9 0,#f5c9b8a8 38%,#c9b4e66e 58%,transparent 74%);animation:lj-sun-bloom 7s ease-in-out infinite}
.lj-art-ring{border-color:#729e9380}
.ring-a{width:205px;height:205px;border-style:dashed;animation:lj-orbit-turn 30s linear infinite}
.ring-b{width:255px;height:130px;border-color:#c18cba9c;animation:lj-orbit-turn 22s linear infinite reverse}
.lj-art-flower{width:115px;height:115px;border:1px solid #fff9e8;border-radius:38px;background:linear-gradient(145deg,#fff9df,#f0bcb2 48%,#c5b5e7);box-shadow:0 20px 45px #966d8050;color:#fffaf1;font-size:70px;text-shadow:0 3px 10px #8f6a6d4d;animation:lj-flower-drift 6s ease-in-out infinite,lj-glow-pulse 4s ease-in-out infinite}
.lj-art-note{right:-3px;bottom:2px;max-width:240px;border-color:#ffffffc9;background:#fffdf0ed;box-shadow:0 14px 34px #4e53401c;backdrop-filter:blur(12px)}
.lj-art-note span{color:#a7655a}.lj-art-note strong{color:#40554a}
.lj-gentle-banner{border-color:#e5d9c8;background:linear-gradient(105deg,#f8e6b7 0%,#f6d7cf 47%,#e5d9f4 100%);box-shadow:0 13px 30px #986b5310}
.lj-gentle-banner:after{width:190px;height:190px;right:5%;top:-135px;background:#ffffff7d}
.lj-banner-icon{background:#fffaf0;color:#bb7764;box-shadow:0 7px 16px #9d73651a}
.lj-reminder-copy>span{color:#9c6c47}.lj-reminder-copy p{color:#584b49}
.lj-reminder-next{border-color:#ffffff;background:#ffffffbd;color:#8c5d65}
.lj-reminder-next:hover{background:#fff;box-shadow:0 5px 15px #956b681f}
.lj-breathe-card{border-color:#cddfe9;background:linear-gradient(115deg,#d9edf2 0%,#e4def7 48%,#f7d9cf 100%);box-shadow:0 14px 35px #547d8a12}
.lj-breathe-card:before{content:"";position:absolute;width:260px;height:260px;right:9%;top:-160px;border-radius:50%;border:1px solid #ffffffa6;box-shadow:0 0 0 22px #ffffff28,0 0 0 45px #ffffff1d;animation:lj-orbit-turn 35s linear infinite}
.lj-breathe-copy h2{color:#304f5b;font-size:21px}.lj-breathe-copy p{color:#5e777d}.lj-breathe-copy .lj-kicker{color:#537c91}
.lj-breathe-visual{z-index:1}.lj-breathe-orbit{border-color:#6f9da88a}.lj-breathe-visual .orbit-two{border-color:#a48ccf99}
.lj-breathe-circle{border-color:#ffffff;background:radial-gradient(circle at 30% 20%,#fff9df,#c4e5e5 55%,#cfc0f0);color:#416e75;box-shadow:0 10px 30px #537f8a2c}
.lj-stats{gap:15px}
.lj-stat{position:relative;overflow:hidden;min-height:116px;border-radius:20px;border-color:#ffffff;background:#fffdf3d9;box-shadow:0 12px 28px #625c4d0b}
.lj-stat:after{content:"";position:absolute;right:-30px;bottom:-42px;width:115px;height:115px;border-radius:50%;background:var(--stat-orb,#d9ebdb);opacity:.68;transition:transform .45s ease}
.lj-stat:nth-child(1){--stat-orb:#c8e8d4;background:linear-gradient(130deg,#fffdf4,#e1f1e2)}
.lj-stat:nth-child(2){--stat-orb:#f5c9ad;background:linear-gradient(130deg,#fff9ef,#f8dfd0)}
.lj-stat:nth-child(3){--stat-orb:#d7c5f0;background:linear-gradient(130deg,#fffdf5,#e9e0f7)}
.lj-stat:hover:after{transform:scale(1.22)}
.lj-stat-icon{position:relative;z-index:1;box-shadow:0 6px 16px #5a5d4d0b}
.lj-stat-icon.sage{background:#cfe9d6;color:#3d7860}.lj-stat-icon.peach{background:#f7d5c1;color:#a76147}.lj-stat-icon.lilac{background:#dfd2f3;color:#785b9e}
.lj-stat>div{position:relative;z-index:1}.lj-stat small{color:#71877b}.lj-stat strong{color:#2f4b41}.lj-stat p{color:#73847a}
.lj-layout{gap:20px}
.lj-card{border-color:#e7e1d5;background:#fffdf9ed;box-shadow:0 14px 35px #4e4b3b0a}
.lj-composer{background:linear-gradient(160deg,#fffdf8 0%,#f0f7ef 100%);border-color:#d7e7d9}
.lj-composer .lj-heading-flower{background:linear-gradient(135deg,#f5d9ca,#ded1f2);color:#8b6b82;animation:lj-gentle-float 5s ease-in-out infinite}
.lj-section-heading h2{color:#2d443b}.lj-section-heading p{color:#75857a}
.lj-prompts button{border-color:#dce8d9;background:#f7fbf3;color:#587264}
.lj-prompts button:nth-child(2n){border-color:#e9d9e7;background:#fcf4fb;color:#856786}
.lj-prompts button:nth-child(3n){border-color:#f0dfc2;background:#fff9e8;color:#8c7445}
.lj-prompts button:hover{background:#e4f2e4;border-color:#b9d8bd}
.lj-composer textarea{border-color:#dce8dc;background:#fffef9}
.lj-composer textarea:focus{border-color:#8db7a2;box-shadow:0 0 0 4px #d8ebdf8a}
.lj-privacy{border-top-color:#e6e8db}.lj-privacy>span{color:#9b7cb2}
.lj-archive{position:relative;overflow:hidden;background:linear-gradient(155deg,#fffdf9 0%,#f4effb 100%);border-color:#e1d9ef}
.lj-archive:before{content:"";position:absolute;top:-90px;right:-75px;width:180px;height:180px;border-radius:50%;background:#e1d4f35c;pointer-events:none}
.lj-archive>*{position:relative}
.lj-count{border-color:#d7c9eb;background:#eee7f8;color:#775d99}
.lj-search{border-color:#e3dcef;background:#fffdfb}.lj-search:focus-within{border-color:#b6a0d5;box-shadow:0 0 0 3px #e8dff6}
.lj-filters select{border-color:#e4dbee;background:#faf7ff}
.lj-entry{border-color:#e8e0f0;background:#fffefa}
.lj-entry:nth-child(3n+1){--entry-accent:#6e9f8b;--entry-tint:#e9f5ec}
.lj-entry:nth-child(3n+2){--entry-accent:#b87c65;--entry-tint:#fff0e8}
.lj-entry:nth-child(3n){--entry-accent:#9278b5;--entry-tint:#f1eafb}
.lj-entry:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--entry-accent);opacity:.8;transform:scaleY(.22);transform-origin:center;transition:transform .3s ease}
.lj-entry:hover:before,.lj-entry.selected:before{transform:scaleY(1)}
.lj-entry:hover,.lj-entry.selected{border-color:#c9b9e0;background:linear-gradient(100deg,var(--entry-tint,#f7f4fc),#fffefa 70%);box-shadow:0 8px 22px #6d5b8b12}
.lj-entry-link{color:var(--entry-accent,#668d78)}
.lj-entry-actions button{border-color:#e7e0ed;background:#fffdfb}
.lj-mood-pill.positive{background:#e2f3e4;color:#427859}.lj-mood-pill.negative{background:#fde7e1;color:#a95f52}.lj-mood-pill.neutral{background:#eee5fb;color:#7c5da2}
.lj-detail{background:linear-gradient(155deg,#fffdf9,#f2f8f0)}
.lj-mood-banner.positive{background:#edf7e9;border-color:#d4e8cd}.lj-mood-banner.negative{background:#fff0e9;border-color:#f0d6ca}.lj-mood-banner.neutral{background:#f1eafa;border-color:#e0d4ef}
.lj-intensity-track{background:#e9e7df}.lj-intensity-track span{background:linear-gradient(90deg,#82c4a1,#efc47d,#e8958e,#b69bdc)}
.lj-theme-list span{border-color:#e0d3f0;background:#f3ecfb;color:#7c659b}
.lj-gentle-response{border-color:#d8e8d7;background:linear-gradient(110deg,#eaf6e8,#f8f3e8)}
.lj-next-step{border-left-color:#e7b07f;background:#fff4e5}
.lj-bottom-reminder{position:relative;overflow:hidden;border-color:#ead8ca;background:linear-gradient(105deg,#f6d9d0 0%,#f6e7b7 36%,#dcefe2 70%,#e6d9f6 100%);box-shadow:0 14px 35px #705c4b10}
.lj-bottom-reminder:after{content:"";position:absolute;right:12%;top:-90px;width:180px;height:180px;border:1px solid #ffffff9c;border-radius:50%;box-shadow:0 0 0 18px #ffffff24,0 0 0 38px #ffffff19;animation:lj-orbit-turn 40s linear infinite}
.lj-reminder-icon{position:relative;z-index:1;background:#fffdf0;color:#ba7b58}
.lj-bottom-reminder>div,.lj-reminder-flower{position:relative;z-index:1}
.lj-bottom-reminder .lj-kicker{color:#9b6955}.lj-bottom-reminder h2{color:#3d4b40}.lj-bottom-reminder p{color:#6d7c6e}
.lj-reminder-flower{color:#7b9d7e;animation:lj-flower-drift 6s ease-in-out infinite}
.lj-footer{color:#89968a}.lj-footer span:first-child{color:#4b6b5b}
.lj-feedback-toast{border-color:#d5e7d6;background:linear-gradient(120deg,#eaf7e9,#fff6d9 65%,#f4e7fb)}
.lj-feedback-toast.negative{border-color:#efd5ca;background:linear-gradient(120deg,#fff1e9,#f6eaf8)}
.lj-feedback-toast.neutral{border-color:#e2d7ef;background:linear-gradient(120deg,#f1f7e8,#f4eafa)}
.lj-modal-backdrop{background:#243d3aa3}.lj-modal{border-color:#e7dcca;background:linear-gradient(145deg,#fffdf7,#f1f7ee)}
.lj-modal-symbol{background:#f8dfd7;color:#a85e53}
.lj-message.error{border-color:#efcec5;background:#fff0eb}.lj-message.success{border-color:#cde4ce;background:#edf8eb}
.lj-motion-ready .lj-reveal:not(.is-visible){opacity:0;transform:translateY(28px) scale(.985);filter:blur(3px)}
.lj-reveal{transition:opacity .75s ease,transform .85s cubic-bezier(.2,.75,.2,1),filter .75s ease;transition-delay:var(--reveal-delay,0ms)}
.lj-reveal.is-visible{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
.lj-hero.is-visible .lj-art-flower{animation:lj-flower-drift 6s ease-in-out infinite,lj-glow-pulse 4s ease-in-out infinite}
.lj-stat.is-visible{animation:lj-card-pop .65s cubic-bezier(.2,.8,.2,1) both}
.lj-entry{animation:lj-entry-arrive .55s both}.lj-entry:nth-child(2n){--entry-index:1}.lj-entry:nth-child(3n){--entry-index:2}
@keyframes lj-orbit-turn{to{transform:rotate(360deg)}}
@keyframes lj-cloud-drift{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(-16px,12px,0)}}
@keyframes lj-sun-bloom{0%,100%{transform:scale(.94);opacity:.75}50%{transform:scale(1.08);opacity:1}}
@keyframes lj-glow-pulse{0%,100%{box-shadow:0 20px 45px #966d8050,0 0 0 0 #eac5c666}50%{box-shadow:0 20px 45px #966d8050,0 0 0 13px #eac5c600}}
@keyframes lj-card-pop{0%{opacity:.6;transform:translateY(12px) scale(.98)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes lj-entry-arrive{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:900px){.lj-memory-rail{right:5px;opacity:.5}.lj-shell{padding-right:clamp(14px,4vw,52px)}}
@media(max-width:650px){
 .lj-memory-rail{display:none}.lj-hero{min-height:unset;background:linear-gradient(145deg,#dff0e3,#f8e5c8 48%,#f1d6e9 100%)}
 .lj-hero h1{font-size:clamp(31px,9vw,40px);letter-spacing:-1.6px}
 .lj-art-ring.ring-a{width:150px;height:150px}.lj-art-ring.ring-b{width:190px;height:100px}.lj-art-note{right:0;max-width:190px}
 .lj-breathe-card:before{right:-15%;top:-120px}.lj-stat{min-height:90px}.lj-entry:before{width:2px}.lj-bottom-reminder:after{right:-20%;top:-65px}
}
@media(prefers-reduced-motion:reduce){
 .lj-memory-mote,.lj-sun-glow,.lj-art-ring,.lj-art-flower,.lj-hero:before,.lj-hero:after,.lj-breathe-card:before,.lj-bottom-reminder:after,.lj-stat,.lj-entry{animation:none!important}
 .lj-reveal,.lj-motion-ready .lj-reveal:not(.is-visible){opacity:1!important;transform:none!important;filter:none!important;transition:none!important}
 .lj-memory-mote{transition:none!important}
}

`;