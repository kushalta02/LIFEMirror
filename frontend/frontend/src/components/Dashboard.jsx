import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSessionTimeout } from "src/utils.js";
import { useSessionTimeout, logout } from "../utils";

const demoHistory = [
  { day: "Mon", mood: -0.45 }, { day: "Tue", mood: -0.12 },
  { day: "Wed", mood: 0.18 }, { day: "Thu", mood: -0.05 },
  { day: "Fri", mood: 0.28 }, { day: "Sat", mood: 0.16 }, { day: "Sun", mood: 0.55 },
];
const features = [
  { icon: "✎", label: "Journal", detail: "Reflect, write, and track your journey.", route: "/journal", tone: "pink" },
  { icon: "✧", label: "AI Assistant", detail: "Talk things through and get support.", route: "/chat", tone: "mint" },
  { icon: "◎", label: "Personality", detail: "Explore your traits and strengths.", route: "/personality", tone: "purple" },
  { icon: "◉", label: "Recommendations", detail: "Find small steps that fit your needs.", route: "/recommendations", tone: "blue" },
  { icon: "⌁", label: "Camera Mood", detail: "Explore mood check-ins with a photo.", route: "/camera", tone: "orange" },
];
const recommendations = [
  { icon: "❋", tag: "MINDFULNESS", title: "5-minute breathing", desc: "Pause, breathe slowly, and give your mind a little space.", action: "Try this", tone: "purple", route: "/chat" },
  { icon: "♫", tag: "MUSIC", title: "Mood-boost playlist", desc: "Make a little room for music that helps you reset.", action: "Explore", tone: "mint", route: "/recommendations" },
  { icon: "▤", tag: "JOURNAL", title: "Gratitude journal", desc: "Write down three small things you appreciate today.", action: "Write now", tone: "blue", route: "/journal" },
  { icon: "♡", tag: "SELF-CARE", title: "A gentle reset", desc: "Take a short break and do something kind for yourself.", action: "See idea", tone: "pink", route: "/recommendations" },
];
const parse = (value) => { try { return value ? JSON.parse(value) : null; } catch { return null; } };

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState("7 days");
  const [recStart, setRecStart] = useState(0);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [connectedSources, setConnectedSources] = useState([]);
  const [showConnections, setShowConnections] = useState(false);

  const affirmations = [
    "You are allowed to grow at your own pace.",
    "One small step is still progress.",
    "Your feelings deserve patience, not judgment.",
    "You can pause, reset, and begin again.",
    "You do not have to solve everything today.",
    "Progress can be quiet and still be real.",
  ];

  const growthSteps = [
    { id: "reflect", title: "Take a 2-minute emotional check-in", detail: "Name what you feel without judging it.", time: "2 min" },
    { id: "journal", title: "Write a short journal entry", detail: "What affected your mood today?", time: "5 min" },
    { id: "reset", title: "Take a screen-free reset", detail: "Stretch, breathe, or step outside for a moment.", time: "5 min" },
  ];

  const dataSources = [
    { id: "health", icon: "♡", title: "Health & activity data", detail: "Sleep, steps, activity and heart-rate trends", status: "Integration planned" },
    { id: "wearable", icon: "⌚", title: "Smartwatch / wearable", detail: "Connect through a supported provider API", status: "Integration planned" },
    { id: "calendar", icon: "▦", title: "Routine & calendar context", detail: "Optional routine context, only with permission", status: "Integration planned" },
  ];

  useEffect(() => {
    const currentUser = parse(localStorage.getItem("user"));
    if (!currentUser) { navigate("/"); return; }
    setUser(currentUser);
    const personality = parse(localStorage.getItem("personality"));
    const controller = new AbortController();
    fetch(`http://127.0.0.1:8000/dashboard/${encodeURIComponent(currentUser.email)}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Dashboard request failed"); return response.json(); })
      .then((result) => { if (personality) result.traits = personality.traits || result.traits; setData(result); })
      .catch((err) => { if (err.name !== "AbortError") setError(true); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [navigate]);

  const history = useMemo(() => Array.isArray(data?.history) && data.history.length
    ? data.history.map((value, i) => ({ day: `S${i + 1}`, mood: typeof value === "number" ? value : Number(value?.mood ?? 0) }))
    : demoHistory, [data]);
  const name = user?.name?.trim()?.split(/\s+/)[0] || "there";
  const traits = Array.isArray(data?.traits) ? data.traits : ["Self-aware", "Curious", "Growing"];
  const score = Number.isFinite(Number(data?.wellness_score)) ? Math.max(0, Math.min(100, Number(data.wellness_score))) : 78;
  const chartHistory = useMemo(() => {
    if (period === "7 days") return history.slice(-7);
    if (period === "30 days") return history.slice(-30);
    return history;
  }, [history, period]);
  const recs = [...recommendations.slice(recStart), ...recommendations.slice(0, recStart)];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAffirmationIndex((current) => (current + 1) % affirmations.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleStep = (id) => {
    setCompletedSteps((current) => current.includes(id)
      ? current.filter((step) => step !== id)
      : [...current, id]);
  };

  if (loading) return <div className="lm-loading"><style>{css}</style><span className="lm-loader-mark">✦</span><p>Preparing your wellness space…</p></div>;

  return <div className="lm-app">
    <style>{css}</style>
    <aside className="lm-sidebar">
      <button className="lm-brand" onClick={() => navigate("/dashboard")}><span className="lm-brand-mark">✿</span><span className="lm-brand-copy"><strong>Life<span>Mirror</span></strong><small>PERSONAL WELLNESS</small></span></button>
      <div className="lm-nav-label">YOUR SPACE</div>
      <nav className="lm-nav">
        <button className="lm-nav-item active" onClick={() => navigate("/dashboard")}><span>⌂</span>Dashboard</button>
        {features.map((item) => <button className="lm-nav-item" key={item.label} onClick={() => navigate(item.route)}><span>{item.icon}</span>{item.label}</button>)}
      </nav>
      <div className="lm-sidebar-note"><span className="lm-note-spark">✧</span><strong>Small steps.<br />Real progress.</strong><p>Your well-being is a journey, not a race.</p><div className="lm-note-line" /></div>
      <button className="lm-profile" onClick={() => navigate("/dashboard")}><span className="lm-avatar">{name.charAt(0).toUpperCase()}</span><span><small>WELCOME BACK</small><strong>{user?.name || "Your profile"}</strong></span><span className="lm-profile-arrow">›</span></button>
      
      
      <button
        type="button"
        className="lm-logout"
        title="Logout"
        onClick={() => {
          localStorage.removeItem("user");
          localStorage.removeItem("personality");
          navigate("/", { replace: true });
        }}
      >
        <span className="lm-logout-icon">↪</span>
        <span className="lm-logout-label">Logout</span>
      </button>
    </aside>

    <main className="lm-main">
      <header className="lm-topbar"><div><p className="lm-eyebrow">YOUR PERSONAL WELLNESS SPACE</p><h1>Good to see you, <span>{name}.</span> <span className="lm-wave">✦</span></h1><p className="lm-subtitle">Take a breath. Here's your emotional wellness at a glance.</p></div><div className="lm-top-actions"><span className="lm-status"><i /> AI WELLNESS ACTIVE</span><button className="lm-icon-button" aria-label="Notifications">♧</button><span className="lm-avatar top-avatar">{name.charAt(0).toUpperCase()}</span></div></header>
      {error && <div className="lm-demo-notice"><span>ⓘ</span><div><strong>Preview mode</strong><p>Dashboard data couldn't be loaded from the local backend. Some cards show sample preview content until the connection is available.</p></div></div>}

      <section className="lm-stat-grid" aria-label="Wellness overview">
        <article className="lm-card lm-stat-card"><div className="lm-card-heading"><span className="lm-icon-bubble mint">☻</span><span>Current mood</span><span className="lm-card-menu">···</span></div><div className="lm-stat-value">{data?.mood || "Not checked in"}</div><div className="lm-mini-chart"><svg viewBox="0 0 150 42" aria-label="Decorative mood trend"><path d="M2 30 C18 30 19 14 32 20 S51 37 64 21 S84 9 96 17 S115 33 127 15 S142 5 148 9" /></svg></div><p className="lm-card-foot"><span className="lm-positive">↗</span> Check in regularly to reveal your patterns</p></article>
        <article className="lm-card lm-stat-card"><div className="lm-card-heading"><span className="lm-icon-bubble purple">✧</span><span>AI mood insight</span><span className="lm-card-menu">···</span></div><div className="lm-stat-value purple-text">{data?.prediction || "More moments to learn"}</div><p className="lm-stat-description">A reflection based on the information currently available in your profile.</p><div className="lm-card-foot"><span className="lm-dot purple-dot" /> Keep checking in to build a clearer picture</div></article>
        <article className="lm-card lm-stat-card personality-card"><div className="lm-card-heading"><span className="lm-icon-bubble blue">♧</span><span>Personality snapshot</span><span className="lm-card-menu">···</span></div><div className="lm-personality-name">{data?.personality || "Your profile is growing"}</div><p className="lm-stat-description">Your traits are a starting point for reflection, not a fixed label.</p><div className="lm-traits">{traits.slice(0, 3).map((trait, i) => <span key={`${trait}-${i}`}>{trait}</span>)}</div></article>
        <article className="lm-card lm-stat-card score-card"><div className="lm-card-heading"><span className="lm-icon-bubble green">✿</span><span>Wellness overview</span></div><div className="lm-score-ring" style={{ "--score": `${score * 3.6}deg` }}><div><strong>{score}%</strong><small>preview score</small></div></div><p className="lm-score-caption">Your journey, one step at a time</p><p className="lm-score-disclaimer">Preview only · not a calculated health score.</p></article>
      </section>

      <section className="lm-insights-layout">
        <article className="lm-card lm-chart-card"><div className="lm-section-head"><div className="lm-heading-with-icon"><span className="lm-section-icon purple">⌁</span><div><h2>Emotional trend</h2><p>Notice how your check-ins change over time</p></div></div><select className="lm-select" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Choose trend period"><option>7 days</option><option>30 days</option><option>All sessions</option></select></div>
          <div className="lm-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartHistory} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#76E6D0" stopOpacity={0.28} /><stop offset="100%" stopColor="#76E6D0" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid stroke="#292832" strokeDasharray="3 5" /><XAxis dataKey="day" stroke="#8F899B" tickLine={false} axisLine={false} tick={{ fill: "#B7B2C1", fontSize: 11 }} /><YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} stroke="#8F899B" tickLine={false} axisLine={false} tick={{ fill: "#B7B2C1", fontSize: 11 }} tickFormatter={(v) => v === 1 ? "Positive" : v === 0 ? "Neutral" : "Low"} /><Tooltip contentStyle={{ background: "#101015", border: "1px solid #292832", borderRadius: 12, color: "#F1EFF5" }} labelStyle={{ color: "#B7B2C1" }} /><Area type="monotone" dataKey="mood" stroke="#76E6D0" strokeWidth={3} fill="url(#moodGradient)" activeDot={{ r: 5, fill: "#76E6D0", stroke: "#090A0F", strokeWidth: 2 }} /><Line type="monotone" dataKey="mood" stroke="#B6A4FF" strokeWidth={1} dot={{ r: 3, fill: "#B6A4FF", strokeWidth: 0 }} /></AreaChart></ResponsiveContainer></div><div className="lm-chart-legend"><span><i className="legend-mint" />Mood check-ins</span><span>For reflection, not diagnosis</span></div>
        </article>
        <article className="lm-card lm-quick-card"><div className="lm-section-head"><div className="lm-heading-with-icon"><span className="lm-section-icon blue">✦</span><div><h2>Quick insights</h2><p>Small things worth noticing</p></div></div><span className="lm-preview-pill">PREVIEW</span></div><div className="lm-insight-list"><div className="lm-insight-item"><span className="lm-insight-emoji sun">☼</span><div><strong>Make space to reflect</strong><p>A short journal entry can help you notice patterns.</p></div><span className="lm-chevron">›</span></div><div className="lm-insight-item"><span className="lm-insight-emoji moon">☾</span><div><strong>Check in with yourself</strong><p>Notice how rest and routines affect your day.</p></div><span className="lm-chevron">›</span></div><div className="lm-insight-item"><span className="lm-insight-emoji heart">♡</span><div><strong>Celebrate consistency</strong><p>Showing up for yourself counts, even in small ways.</p></div><span className="lm-chevron">›</span></div></div><p className="lm-note-disclaimer">General prompts, not yet inferred from your personal history.</p></article>
      </section>

      <section className="lm-card lm-recommendations"><div className="lm-section-head"><div className="lm-heading-with-icon"><span className="lm-section-icon lavender">✧</span><div><h2>Recommended for you</h2><p>Gentle ideas to support your day</p></div></div><div className="lm-carousel-controls"><button onClick={() => setRecStart((recStart + recommendations.length - 1) % recommendations.length)} aria-label="Previous recommendations">‹</button><button onClick={() => setRecStart((recStart + 1) % recommendations.length)} aria-label="Next recommendations">›</button></div></div><div className="lm-recommendation-grid">{recs.map((item) => <article className="lm-recommendation-card" key={item.title}><div className={`lm-rec-icon ${item.tone}`}>{item.icon}</div><span className={`lm-rec-tag ${item.tone}`}>{item.tag}</span><h3>{item.title}</h3><p>{item.desc}</p><button className={`lm-rec-action ${item.tone}`} onClick={() => navigate(item.route)}>{item.action}<span>↗</span></button></article>)}</div><div className="lm-carousel-dots"><i className={recStart === 0 ? "selected" : ""} /><i className={recStart === 1 ? "selected" : ""} /><i className={recStart > 1 ? "selected" : ""} /></div></section>

      <section className="lm-card lm-features"><div className="lm-section-head"><div className="lm-heading-with-icon"><span className="lm-section-icon mint">✿</span><div><h2>Explore your tools</h2><p>Everything in your wellness space, all in one place</p></div></div><span className="lm-feature-count">05 SPACES</span></div><div className="lm-feature-grid">{features.map((item) => <button className="lm-feature-card" key={item.label} onClick={() => navigate(item.route)}><span className={`lm-feature-icon ${item.tone}`}>{item.icon}</span><span className="lm-feature-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><span className="lm-chevron">›</span></button>)}</div></section>


      <section className="lm-affirmation-panel" aria-live="polite">
        <div className="lm-affirmation-orb">✦</div>
        <div className="lm-affirmation-copy">
          <span className="lm-panel-kicker">A MOMENT FOR YOU</span>
          <p key={affirmationIndex} className="lm-affirmation-text">“{affirmations[affirmationIndex]}”</p>
          <span className="lm-affirmation-caption">A gentle reminder · changes every few seconds</span>
        </div>
        <div className="lm-affirmation-count">0{affirmationIndex + 1}<span> / 0{affirmations.length}</span></div>
      </section>

      <section className="lm-deep-grid">
        <article className="lm-card lm-analysis-card">
          <div className="lm-section-head">
            <div className="lm-heading-with-icon"><span className="lm-section-icon mint">⌁</span><div><h2>Your detailed analysis</h2><p>Signals to explore as your personal data grows</p></div></div>
            <span className="lm-preview-pill">INSIGHT PREVIEW</span>
          </div>
          <div className="lm-analysis-list">
            <div className="lm-analysis-row"><div className="lm-analysis-label"><span>Emotional balance</span><strong>{data?.emotional_balance != null ? `${data.emotional_balance}%` : "—"}</strong></div><div className="lm-progress-track"><span style={{ width: `${Math.max(0, Math.min(100, Number(data?.emotional_balance) || 0))}%` }} /></div><small>{data?.emotional_balance != null ? "Based on available check-in data" : "Needs consistent mood check-ins to calculate"}</small></div>
            <div className="lm-analysis-row"><div className="lm-analysis-label"><span>Reflection consistency</span><strong>{data?.consistency_score != null ? `${data.consistency_score}%` : "—"}</strong></div><div className="lm-progress-track cyan"><span style={{ width: `${Math.max(0, Math.min(100, Number(data?.consistency_score) || 0))}%` }} /></div><small>{data?.consistency_score != null ? "Based on available activity data" : "Calculated when journal/check-in history is available"}</small></div>
            <div className="lm-analysis-row"><div className="lm-analysis-label"><span>Personal growth</span><strong>{data?.growth_score != null ? `${data.growth_score}%` : "—"}</strong></div><div className="lm-progress-track blue-track"><span style={{ width: `${Math.max(0, Math.min(100, Number(data?.growth_score) || 0))}%` }} /></div><small>{data?.growth_score != null ? "Based on available progress data" : "Connect goals and completed steps to track progress"}</small></div>
          </div>
          <div className="lm-analysis-foot"><span>ⓘ</span> Scores are shown only when provided by your backend. Missing values are not guessed.</div>
        </article>

        <article className="lm-card lm-pattern-card">
          <div className="lm-section-head"><div className="lm-heading-with-icon"><span className="lm-section-icon blue">✧</span><div><h2>Patterns to notice</h2><p>Reflection prompts, not conclusions</p></div></div></div>
          <div className="lm-pattern-item"><span className="lm-pattern-symbol">◷</span><div><strong>Time & mood</strong><p>With more check-ins, compare how your mood shifts across days.</p></div></div>
          <div className="lm-pattern-item"><span className="lm-pattern-symbol">▤</span><div><strong>Recurring themes</strong><p>Journal themes can help you spot what deserves attention.</p></div></div>
          <div className="lm-pattern-item"><span className="lm-pattern-symbol">↗</span><div><strong>What helps you reset</strong><p>Track activities that feel supportive and revisit what works.</p></div></div>
          <p className="lm-note-disclaimer">Personalized conclusions require enough real history; these are prompts for now.</p>
        </article>
      </section>

      <section className="lm-card lm-growth-plan">
        <div className="lm-section-head"><div className="lm-heading-with-icon"><span className="lm-section-icon mint">✓</span><div><h2>Your next small steps</h2><p>A gentle action plan you can complete at your own pace</p></div></div><span className="lm-feature-count">{completedSteps.length}/{growthSteps.length} DONE</span></div>
        <div className="lm-growth-progress"><span style={{ width: `${(completedSteps.length / growthSteps.length) * 100}%` }} /></div>
        <div className="lm-growth-steps">{growthSteps.map((step, index) => <label className={`lm-growth-step ${completedSteps.includes(step.id) ? "is-complete" : ""}`} key={step.id}><input type="checkbox" checked={completedSteps.includes(step.id)} onChange={() => toggleStep(step.id)} /><span className="lm-step-number">0{index + 1}</span><span className="lm-step-copy"><strong>{step.title}</strong><small>{step.detail}</small></span><span className="lm-step-time">{step.time}</span></label>)}</div>
      </section>

      <section className="lm-card lm-connections">
        <div className="lm-section-head"><div className="lm-heading-with-icon"><span className="lm-section-icon blue">⌘</span><div><h2>Connect your world</h2><p>Plan for external data, with clear permissions and privacy controls</p></div></div><button className="lm-connect-toggle" onClick={() => setShowConnections((value) => !value)}>{showConnections ? "Hide sources" : "Explore connections"} <span>{showConnections ? "−" : "+"}</span></button></div>
        <div className="lm-connection-summary"><span className="lm-connection-pulse" /><div><strong>{connectedSources.length ? `${connectedSources.length} source${connectedSources.length > 1 ? "s" : ""} selected for setup` : "No external sources connected"}</strong><p>These are planning controls only. Selecting a source does not connect an account or transfer data.</p></div><span className="lm-planned-badge">API SETUP NEEDED</span></div>
        {showConnections && <div className="lm-source-grid">{dataSources.map((source) => <article className="lm-source-card" key={source.id}><span className="lm-source-icon">{source.icon}</span><div className="lm-source-copy"><strong>{source.title}</strong><p>{source.detail}</p><small>{source.status}</small></div><button className={`lm-source-select ${connectedSources.includes(source.id) ? "selected" : ""}`} onClick={() => setConnectedSources((current) => current.includes(source.id) ? current.filter((id) => id !== source.id) : [...current, source.id])}>{connectedSources.includes(source.id) ? "Selected ✓" : "Plan setup"}</button></article>)}</div>}
      </section>

      <section className="lm-support-grid">
        <article className="lm-card lm-support-card"><div className="lm-support-icon">♡</div><div><span className="lm-panel-kicker">SUPPORT & SAFETY</span><h2>You don't have to handle everything alone.</h2><p>LifeMirror can support reflection, but it is not a crisis service or a substitute for professional care.</p><div className="lm-support-links"><a href="tel:112">Emergency help · 112</a><a href="tel:14416">Tele-MANAS mental health support · 14416</a></div></div></article>
        <article className="lm-card lm-privacy-card"><span className="lm-section-icon mint">◇</span><h2>Your data. Your choice.</h2><p>External connections should be opt-in, explain what is shared, and let you disconnect whenever you choose.</p><button onClick={() => setShowConnections(true)}>Review data connections <span>→</span></button></article>
      </section>

      <section className="lm-bottom-banner"><div className="lm-banner-art">☼</div><div><h2>Your well-being matters.</h2><p>You don't need to have it all figured out. Start with one small step.</p></div><button onClick={() => navigate("/chat")}>Take a moment <span>→</span></button></section>
      <footer className="lm-footer"><span>LifeMirror <i>•</i> A little more self-awareness, every day.</span><span>Be kind to yourself today.</span></footer>
    </main>
  </div>;
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');  :root {
  color-scheme: dark; }
html, body, #root {
  min-height: 100%;  margin: 0;  width: 100%; }
body {
  background: #090A0F;  color: #F1EFF5; }
* {
  box-sizing:border-box }
.lm-app {
  min-height:100vh;  display:flex;  background: #090A0F;  color:#F1EFF5;  font-family:'DM Sans',sans-serif;  overflow:visible }
.lm-app button,.lm-app select {
  font:inherit }
.lm-sidebar {
  width:248px;  flex:0 0 248px;  min-height:100vh;  position:sticky;  top:0;  height:100vh;  display:flex;  flex-direction:column;  padding:25px 16px 16px;  background:linear-gradient(180deg,#15151B,#15151B);    border-right:1px solid #201D29;  z-index:3 }
.lm-brand {
  display:flex;  align-items:center;  gap:11px;  background:transparent;  border:0;  text-align:left;  color:inherit;  padding:0 7px 28px;  cursor:pointer }
.lm-brand-mark {
  width:43px;  height:43px;  display:grid;  place-items:center;  font-size:36px;  color:#B7B2C1;  text-shadow:0 0 22px #B7B2C180 }
.lm-brand-copy {
  display:flex;  flex-direction:column;  gap:4px }
.lm-brand-copy strong {
  font:800 21px 'Manrope',sans-serif;  letter-spacing:-.7px }
.lm-brand-copy strong span {
  color:#B7B2C1 }
.lm-brand-copy small {
  font-size:8px;  letter-spacing:1.7px;  color:#B7B2C1 }
.lm-nav-label,.lm-eyebrow {
  font-size:10px;  letter-spacing:1.6px;  font-weight:700;  color:#B7B2C1 }
.lm-nav-label {
  padding:9px 12px 12px }
.lm-nav {
  display:flex;  flex-direction:column;  gap:6px }
.lm-nav-item {
  display:flex;  align-items:center;  gap:13px;  padding:12px 13px;  color:#B7B2C1;  border:1px solid transparent;  background:transparent;  border-radius:12px;  text-align:left;  cursor:pointer;  font-size:13px;  transition:.2s }
.lm-nav-item>span {
  width:20px;  text-align:center;  font-size:19px;  color:#B7B2C1 }
.lm-nav-item:hover,.lm-nav-item.active {
  background:linear-gradient(100deg,#201D29aa,#201D29cc);  border-color:#292832;  color:#F1EFF5 }
.lm-nav-item.active>span {
  color:#B7B2C1 }
.lm-sidebar-note {
  margin-top:auto;  border:1px solid #201D29;  border-radius:18px;  padding:22px 17px 20px;  background:radial-gradient(ellipse at 20% 120%,#292832aa,transparent 65%),linear-gradient(145deg,#15151B,#15151B);  text-align:center }
.lm-note-spark {
  font-size:27px;  color:#B7B2C1;  display:block;  margin-bottom:12px }
.lm-sidebar-note strong {
  font:700 14px/1.6 'Manrope',sans-serif }
.lm-sidebar-note p {
  font-size:11px;  line-height:1.6;  color:#B7B2C1;  margin:9px 0 14px }
.lm-note-line {
  width:70px;  height:18px;  margin:auto;  border-top:2px solid #B7B2C1;  border-radius:50%;  transform:rotate(-9deg) }
.lm-profile {
  display:flex;  align-items:center;  gap:10px;  margin-top:15px;  padding:14px 5px 3px;  background:transparent;  border:0;  border-top:1px solid #201D29;  color:inherit;  text-align:left;  cursor:pointer }
.lm-avatar {
  width:38px;  height:38px;  flex:0 0 38px;  border-radius:50%;  display:grid;  place-items:center;  background:linear-gradient(135deg,#B7B2C1,#B7B2C1);  color:#15151B;  font-weight:800;  font-size:16px }
.lm-profile>span:nth-child(2) {
  display:flex;  flex-direction:column;  gap:4px;  min-width:0 }
.lm-profile small {
  font-size:8px;  color:#B7B2C1;  letter-spacing:1px }
.lm-profile strong {
  font-size:12px;  max-width:125px;  white-space:nowrap;  text-overflow:ellipsis;  overflow:hidden }
.lm-profile-arrow {
  margin-left:auto;  color:#B7B2C1;  font-size:24px }
.lm-main {
  min-width:0;  min-height:100vh;  flex:1;  padding:34px clamp(20px,3vw,44px) 20px;  max-width:1800px;  margin:0 auto }
.lm-topbar {
  display:flex;  justify-content:space-between;  align-items:center;  gap:20px;  margin-bottom:26px }
.lm-eyebrow {
  margin:0 0 9px }
.lm-topbar h1 {
  font:700 clamp(25px,2.5vw,36px)/1.2 'Manrope',sans-serif;  letter-spacing:-1.2px;  margin:0 }
.lm-topbar h1>span:first-child {
  background:linear-gradient(90deg,#B7B2C1,#B7B2C1);  -webkit-background-clip:text;  background-clip:text;  color:transparent }
.lm-wave {
  font-size:.78em;  color:#B7B2C1 }
.lm-subtitle {
  color:#B7B2C1;  font-size:13px;  margin:10px 0 0 }
.lm-top-actions {
  display:flex;  align-items:center;  gap:12px }
.lm-status {
  white-space:nowrap;  display:flex;  align-items:center;  gap:8px;  padding:10px 13px;  border:1px solid #292832;  border-radius:30px;  background:#15151B80;  color:#B7B2C1;  font-size:10px;  font-weight:700 }
.lm-status i {
  width:7px;  height:7px;  border-radius:50%;  background:#B7B2C1;  box-shadow:0 0 12px #B7B2C1 }
.lm-icon-button {
  width:37px;  height:37px;  border:1px solid #201D29;  border-radius:50%;  background:#15151B;  color:#F1EFF5;  font-size:18px }
.lm-demo-notice {
  display:flex;  gap:12px;  padding:13px 16px;  margin:-7px 0 20px;  border:1px solid #201D29;  background:#10101580;  border-radius:13px;  color:#B7B2C1;  font-size:12px }
.lm-demo-notice>span {
  font-size:20px }
.lm-demo-notice p {
  margin:4px 0 0;  color:#B7B2C1;  line-height:1.5 }
.lm-stat-grid {
  display:grid;  grid-template-columns:repeat(4,minmax(0,1fr));  gap:14px }
.lm-card {
  background:linear-gradient(145deg,#15151Bed,#15151Bed);  border:1px solid #201D29;  border-radius:17px;  box-shadow:0 12px 35px #090A0F12;  min-width:0 }
.lm-stat-card {
  min-height:183px;  padding:18px 18px 15px;  position:relative;  overflow:hidden }
.lm-card-heading {
  display:flex;  align-items:center;  gap:9px;  color:#F1EFF5;  font-size:12px;  font-weight:600 }
.lm-card-menu {
  margin-left:auto;  color:#B7B2C1;  letter-spacing:2px }
.lm-icon-bubble {
  width:32px;  height:32px;  border-radius:50%;  display:grid;  place-items:center;  font-size:18px;  flex:0 0 32px }
.mint {
  background:#201D29;  color:#B7B2C1 }
.purple {
  background:#201D29;  color:#B7B2C1 }
.blue {
  background:#292832;  color:#B7B2C1 }
.green {
  background:#201D29;  color:#B7B2C1 }
.pink {
  background:#1B1A22;  color:#B7B2C1 }
.orange {
  background:#1B1A22;  color:#B7B2C1 }
.lm-stat-value {
  font:800 25px 'Manrope',sans-serif;  letter-spacing:-.6px;  margin-top:19px;  max-width:95%;  overflow-wrap:anywhere;  color:#B7B2C1 }
.purple-text {
  color:#B7B2C1 }
.lm-stat-description {
  font-size:11px;  line-height:1.6;  color:#B7B2C1;  margin:8px 0 0;  max-width:97% }
.lm-card-foot {
  font-size:10px;  color:#B7B2C1;  margin:15px 0 0;  line-height:1.5 }
.lm-positive {
  color:#B7B2C1;  font-size:15px;  margin-right:5px }
.lm-mini-chart {
  position:absolute;  right:15px;  bottom:43px;  width:88px;  opacity:.85 }
.lm-mini-chart svg {
  width:100%;  overflow:visible }
.lm-mini-chart path {
  fill:none;  stroke:#B7B2C1;  stroke-width:2.4;  stroke-linecap:round }
.lm-dot {
  display:inline-block;  width:6px;  height:6px;  border-radius:50%;  margin-right:6px }
.purple-dot {
  background:#B7B2C1 }
.lm-personality-name {
  font:700 18px 'Manrope',sans-serif;  margin-top:14px;  white-space:nowrap;  overflow:hidden;  text-overflow:ellipsis }
.personality-card .lm-stat-description {
  margin-top:5px }
.lm-traits {
  display:flex;  flex-wrap:wrap;  gap:5px;  margin-top:10px }
.lm-traits span {
  font-size:9px;  color:#B7B2C1;  background:#1B1A22;  border:1px solid #292832;  border-radius:20px;  padding:5px 8px;  white-space:nowrap }
.score-card {
  text-align:center }
.score-card .lm-card-heading {
  text-align:left }
.lm-score-ring {
  width:78px;  height:78px;  margin:12px auto 8px;  border-radius:50%;  display:grid;  place-items:center;  background:conic-gradient(#B7B2C1 var(--score),#201D29 0);  position:relative }
.lm-score-ring:before {
  content:"";  position:absolute;  inset:6px;  border-radius:50%;  background:#15151B }
.lm-score-ring>div {
  position:relative;  display:flex;  flex-direction:column;  align-items:center;  gap:1px }
.lm-score-ring strong {
  font:800 19px 'Manrope',sans-serif }
.lm-score-ring small {
  font-size:7px;  color:#B7B2C1 }
.lm-score-caption {
  font-size:10px;  font-weight:700;  color:#B7B2C1;  margin:4px 0 }
.lm-score-disclaimer {
  font-size:8px;  color:#B7B2C1;  margin:4px 0 0 }
.lm-insights-layout {
  display:grid;  grid-template-columns:minmax(0,1.65fr) minmax(290px,.9fr);  gap:14px;  margin-top:15px }
.lm-chart-card,.lm-quick-card,.lm-recommendations,.lm-features {
  padding:19px }
.lm-section-head {
  display:flex;  justify-content:space-between;  align-items:center;  gap:15px }
.lm-heading-with-icon {
  display:flex;  align-items:center;  gap:11px;  min-width:0 }
.lm-section-icon {
  width:34px;  height:34px;  flex:0 0 34px;  border-radius:11px;  display:grid;  place-items:center;  font-size:21px }
.lm-section-icon.purple {
  background:#201D29;  color:#B7B2C1 }
.lm-section-icon.blue {
  background:#201D29;  color:#B7B2C1 }
.lm-section-icon.lavender {
  background:#201D29;  color:#B7B2C1 }
.lm-section-icon.mint {
  background:#201D29;  color:#B7B2C1 }
.lm-section-head h2 {
  font:700 15px 'Manrope',sans-serif;  margin:0;  color:#F1EFF5 }
.lm-section-head p {
  font-size:10px;  color:#B7B2C1;  margin:4px 0 0 }
.lm-select {
  border:1px solid #292832;  border-radius:10px;  padding:8px 10px;  background:#15151B;  color:#F1EFF5;  font-size:10px;  outline:none }
.lm-chart {
  height:240px;  margin:13px 0 0 }
.lm-chart-legend {
  display:flex;  justify-content:space-between;  gap:10px;  font-size:9px;  color:#B7B2C1 }
.lm-chart-legend span:first-child {
  display:flex;  align-items:center;  gap:6px }
.legend-mint {
  display:inline-block;  width:7px;  height:7px;  border-radius:50%;  background:#B7B2C1 }
.lm-preview-pill {
  font-size:8px;  letter-spacing:.8px;  color:#B7B2C1;  border:1px solid #302A3A;  background:#1B1A22;  padding:6px 8px;  border-radius:20px;  white-space:nowrap }
.lm-insight-list {
  display:flex;  flex-direction:column;  gap:9px;  margin-top:16px }
.lm-insight-item {
  display:flex;  align-items:center;  gap:10px;  padding:11px 10px;  background:#15151B;  border:1px solid #201D29;  border-radius:12px;  min-width:0 }
.lm-insight-emoji {
  width:33px;  height:33px;  flex:0 0 33px;  display:grid;  place-items:center;  border-radius:50%;  font-size:20px }
.lm-insight-emoji.sun {
  background:#1B1A22;  color:#B7B2C1 }
.lm-insight-emoji.moon {
  background:#1B1A22;  color:#B7B2C1 }
.lm-insight-emoji.heart {
  background:#1B1A22;  color:#B7B2C1 }
.lm-insight-item>div {
  min-width:0;  flex:1 }
.lm-insight-item strong {
  font-size:10px;  color:#F1EFF5 }
.lm-insight-item p {
  font-size:9px;  line-height:1.5;  color:#B7B2C1;  margin:4px 0 0 }
.lm-chevron {
  font-size:23px;  color:#B7B2C1 }
.lm-note-disclaimer {
  font-size:9px;  line-height:1.5;  color:#B7B2C1;  margin:12px 0 0 }
.lm-recommendations {
  margin-top:15px }
.lm-carousel-controls {
  display:flex;  gap:7px }
.lm-carousel-controls button {
  width:31px;  height:31px;  border:1px solid #292832;  border-radius:50%;  background:#15151B;  color:#F1EFF5;  font-size:22px;  line-height:1;  cursor:pointer }
.lm-carousel-controls button:hover {
  background:#292832 }
.lm-recommendation-grid {
  display:grid;  grid-template-columns:repeat(4,minmax(0,1fr));  gap:11px;  margin-top:16px }
.lm-recommendation-card {
  min-width:0;  padding:14px;  border:1px solid #201D29;  border-radius:14px;  background:linear-gradient(160deg,#15151B,#15151B);  display:flex;  flex-direction:column;  align-items:flex-start;  min-height:206px }
.lm-rec-icon {
  width:39px;  height:39px;  border-radius:50%;  display:grid;  place-items:center;  font-size:23px;  margin-bottom:11px }
.lm-rec-icon.purple {
  background:#201D29;  color:#B7B2C1 }
.lm-rec-icon.mint {
  background:#201D29;  color:#B7B2C1 }
.lm-rec-icon.blue {
  background:#292832;  color:#B7B2C1 }
.lm-rec-icon.pink {
  background:#201D29;  color:#B7B2C1 }
.lm-rec-tag {
  font-size:8px;  letter-spacing:.6px;  padding:5px 7px;  border-radius:20px;  margin-bottom:8px }
.lm-rec-tag.purple {
  color:#B7B2C1;  background:#201D29 }
.lm-rec-tag.mint {
  color:#B7B2C1;  background:#201D29 }
.lm-rec-tag.blue {
  color:#B7B2C1;  background:#201D29 }
.lm-rec-tag.pink {
  color:#B7B2C1;  background:#1B1A22 }
.lm-recommendation-card h3 {
  font:700 13px/1.4 'Manrope',sans-serif;  margin:0;  color:#F1EFF5 }
.lm-recommendation-card p {
  font-size:10px;  line-height:1.55;  color:#B7B2C1;  margin:7px 0 14px }
.lm-rec-action {
  display:flex;  align-items:center;  justify-content:space-between;  gap:10px;  width:100%;  margin-top:auto;  padding:9px 10px;  border:0;  border-radius:8px;  font-size:10px;  font-weight:700;  cursor:pointer;  color:#15151B }
.lm-rec-action:hover {
  filter:brightness(1.12) }
.lm-rec-action.purple {
  background:#B7B2C1 }
.lm-rec-action.mint {
  background:#B7B2C1 }
.lm-rec-action.blue {
  background:#B7B2C1 }
.lm-rec-action.pink {
  background:#B7B2C1 }
.lm-carousel-dots {
  display:flex;  justify-content:center;  gap:7px;  margin-top:13px }
.lm-carousel-dots i {
  width:5px;  height:5px;  border-radius:50%;  background:#292832 }
.lm-carousel-dots i.selected {
  width:17px;  border-radius:5px;  background:#B7B2C1 }
.lm-features {
  margin-top:15px }
.lm-feature-count {
  font-size:9px;  letter-spacing:.8px;  color:#B7B2C1;  border:1px solid #201D29;  background:#15151B;  padding:7px 9px;  border-radius:20px;  white-space:nowrap }
.lm-feature-grid {
  display:grid;  grid-template-columns:repeat(5,minmax(0,1fr));  gap:10px;  margin-top:16px }
.lm-feature-card {
  display:flex;  align-items:flex-start;  gap:10px;  text-align:left;  padding:13px 11px;  min-width:0;  border:1px solid #201D29;  border-radius:12px;  background:#15151B;  color:inherit;  cursor:pointer;  transition:transform .2s,border-color .2s,background .2s }
.lm-feature-card:hover {
  transform:translateY(-2px);  border-color:#B7B2C1;  background:#201D29 }
.lm-feature-icon {
  width:35px;  height:35px;  flex:0 0 35px;  border-radius:11px;  display:grid;  place-items:center;  font-size:21px }
.lm-feature-icon.pink {
  background:#1B1A22;  color:#B7B2C1 }
.lm-feature-icon.mint {
  background:#201D29;  color:#B7B2C1 }
.lm-feature-icon.purple {
  background:#201D29;  color:#B7B2C1 }
.lm-feature-icon.blue {
  background:#292832;  color:#B7B2C1 }
.lm-feature-icon.orange {
  background:#1B1A22;  color:#B7B2C1 }
.lm-feature-copy {
  display:flex;  flex-direction:column;  gap:6px;  min-width:0;  flex:1 }
.lm-feature-copy strong {
  font-size:10px;  color:#F1EFF5;  line-height:1.4 }
.lm-feature-copy small {
  font-size:9px;  line-height:1.5;  color:#B7B2C1 }
.lm-feature-card .lm-chevron {
  font-size:18px;  line-height:1 }
.lm-bottom-banner {
  display:flex;  align-items:center;  gap:16px;  margin-top:15px;  padding:18px 22px;  border-radius:16px;  border:1px solid #302A3A;  background:radial-gradient(ellipse at 74% 110%,#292832 0%,transparent 42%),radial-gradient(ellipse at 62% -20%,#292832 0%,transparent 43%),linear-gradient(100deg,#15151B,#201D29 68%,#15151B) }
.lm-banner-art {
  width:45px;  height:45px;  display:grid;  place-items:center;  border-radius:13px;  background:#201D29;  color:#B7B2C1;  font-size:29px;  flex:0 0 45px }
.lm-bottom-banner>div:nth-child(2) {
  min-width:0;  flex:1 }
.lm-bottom-banner h2 {
  font:700 15px 'Manrope',sans-serif;  margin:0 }
.lm-bottom-banner p {
  font-size:10px;  color:#B7B2C1;  margin:6px 0 0 }
.lm-bottom-banner button {
  border:1px solid #B7B2C1;  background:linear-gradient(90deg,#B7B2C1,#B7B2C1);  color:#15151B;  border-radius:30px;  padding:11px 17px;  font-size:10px;  font-weight:700;  white-space:nowrap;  cursor:pointer }
.lm-bottom-banner button span {
  font-size:15px;  margin-left:7px }
.lm-footer {
  display:flex;  justify-content:space-between;  gap:15px;  color:#B7B2C1;  font-size:9px;  padding:18px 2px 0 }
.lm-footer i {
  font-style:normal;  color:#B7B2C1;  margin:0 5px }
.lm-loading {
  min-height:100vh;  display:flex;  flex-direction:column;  align-items:center;  justify-content:center;  gap:12px;  background:#15151B;  color:#B7B2C1;  font:13px 'DM Sans',sans-serif }
.lm-loader-mark {
  width:54px;  height:54px;  display:grid;  place-items:center;  border-radius:18px;  background:#201D29;  color:#B7B2C1;  font-size:30px;  box-shadow:0 0 40px #B7B2C130;  animation:lmPulse 1.4s ease-in-out infinite }
@keyframes lmPulse {
  50% {
    transform:scale(1.07);  opacity:.7 }
}
@media(min-width:1500px) {
  .lm-main {
    padding-left:48px;  padding-right:48px }
  .lm-stat-card {
    min-height:195px }
  .lm-chart {
    height:270px }
}
@media(max-width:1200px) {
  .lm-sidebar {
    width:218px;  flex-basis:218px;  padding-left:12px;  padding-right:12px }
  .lm-main {
    padding:26px 22px }
  .lm-stat-grid {
    grid-template-columns:repeat(2,minmax(0,1fr)) }
  .lm-feature-grid {
    grid-template-columns:repeat(3,minmax(0,1fr)) }
  .lm-recommendation-grid {
    grid-template-columns:repeat(2,minmax(0,1fr)) }
  .lm-stat-card {
    min-height:170px }
}
@media(max-width:850px) {
  .lm-sidebar {
    width:72px;  flex-basis:72px;  padding:18px 9px 12px;  align-items:center }
  .lm-brand {
    padding:0 0 25px }
  .lm-brand-mark {
    font-size:32px }
  .lm-brand-copy,.lm-nav-label,.lm-nav-item:not(.active) {
    display:none }
  .lm-nav {
    width:100%;  align-items:center }
  .lm-nav-item {
    width:48px;  height:47px;  justify-content:center;  padding:0;  font-size:0 }
  .lm-nav-item>span {
    font-size:22px }
  .lm-sidebar-note {
    display:none }
  .lm-profile {
    width:100%;  justify-content:center;  padding-top:13px }
  .lm-profile>span:nth-child(2),.lm-profile-arrow {
    display:none }
  .lm-avatar {
    width:34px;  height:34px;  flex-basis:34px }
  .lm-insights-layout {
    grid-template-columns:1fr }
  .lm-topbar {
    align-items:flex-start }
  .lm-status {
    font-size:0;  padding:10px }
  .lm-status i {
    margin:0 }
  .lm-feature-grid {
    grid-template-columns:repeat(2,minmax(0,1fr)) }
}
@media(max-width:560px) {
  .lm-sidebar {
    width:58px;  flex-basis:58px;  padding-left:5px;  padding-right:5px }
  .lm-brand-mark {
    font-size:28px }
  .lm-nav-item {
    width:43px;  height:43px }
  .lm-main {
    padding:22px 12px 15px }
  .lm-topbar {
    gap:10px }
  .lm-topbar h1 {
    font-size:23px }
  .lm-eyebrow {
    font-size:8px }
  .lm-subtitle {
    font-size:11px;  line-height:1.5 }
  .lm-top-actions {
    gap:6px }
  .lm-icon-button,.top-avatar {
    display:none }
  .lm-stat-grid {
    grid-template-columns:1fr 1fr;  gap:9px }
  .lm-stat-card {
    padding:13px 11px;  min-height:180px }
  .lm-card-heading {
    font-size:10px;  gap:6px }
  .lm-icon-bubble {
    width:27px;  height:27px;  flex-basis:27px;  font-size:15px }
  .lm-stat-value {
    font-size:20px;  margin-top:16px }
  .lm-stat-description {
    font-size:10px }
  .lm-mini-chart {
    width:65px;  bottom:42px;  opacity:.5 }
  .lm-card-foot {
    font-size:9px }
  .lm-personality-name {
    font-size:15px }
  .lm-traits span {
    font-size:8px;  padding:4px 6px }
  .lm-score-ring {
    width:67px;  height:67px }
  .lm-score-ring strong {
    font-size:17px }
  .lm-score-disclaimer {
    font-size:7px }
  .lm-chart-card,.lm-quick-card,.lm-recommendations,.lm-features {
    padding:13px }
  .lm-section-head h2 {
    font-size:13px }
  .lm-section-head p {
    font-size:9px }
  .lm-section-icon {
    width:29px;  height:29px;  flex-basis:29px }
  .lm-chart {
    height:210px }
  .lm-chart-legend {
    font-size:8px }
  .lm-insight-item {
    padding:9px 7px;  gap:7px }
  .lm-insight-item strong {
    font-size:9px }
  .lm-insight-item p {
    font-size:8px }
  .lm-insight-emoji {
    width:28px;  height:28px;  flex-basis:28px }
  .lm-recommendation-grid {
    grid-template-columns:1fr 1fr;  gap:8px }
  .lm-recommendation-card {
    padding:11px;  min-height:210px }
  .lm-recommendation-card h3 {
    font-size:12px }
  .lm-recommendation-card p {
    font-size:9px }
  .lm-feature-grid {
    grid-template-columns:1fr }
  .lm-feature-card {
    padding:11px }
  .lm-bottom-banner {
    padding:14px 12px;  gap:10px;  flex-wrap:wrap }
  .lm-banner-art {
    width:36px;  height:36px;  flex-basis:36px;  font-size:22px }
  .lm-bottom-banner h2 {
    font-size:13px }
  .lm-bottom-banner p {
    font-size:9px;  line-height:1.5 }
  .lm-bottom-banner button {
    margin-left:46px;  padding:9px 13px }
  .lm-footer {
    font-size:8px;  flex-direction:column;  gap:6px }
  .lm-demo-notice {
    font-size:10px }
}
.lm-affirmation-panel {
  display:flex;  align-items:center;  gap:18px;  margin:0 0 15px;  padding:22px 25px;  border:1px solid #201D29;  border-radius:18px;  background:radial-gradient(ellipse at 5% 50%,#29283270,transparent 40%),linear-gradient(110deg,#15151B,#15151B 70%,#15151B);  overflow:hidden;  position:relative; }
.lm-affirmation-orb {
  display:grid;  place-items:center;  flex:0 0 48px;  width:48px;  height:48px;  border:1px solid #B7B2C1;  border-radius:16px;  background:#201D29;  color:#B7B2C1;  font-size:27px;  box-shadow:0 0 30px #B7B2C126;  animation:lmFloat 4s ease-in-out infinite; }
.lm-affirmation-copy {
  min-width:0;  flex:1; }
.lm-panel-kicker {
  color:#B7B2C1;  font-size:9px;  font-weight:800;  letter-spacing:1.7px; }
.lm-affirmation-text {
  margin:7px 0 6px;  color:#F1EFF5;  font:700 clamp(16px,1.6vw,22px)/1.4 'Manrope',sans-serif;  animation:lmFadeIn .65s ease both; }
.lm-affirmation-caption {
  color:#B7B2C1;  font-size:10px; }
.lm-affirmation-count {
  color:#B7B2C1;  font:800 15px 'Manrope',sans-serif;  white-space:nowrap; }
.lm-affirmation-count span {
  color:#B7B2C1;  font-size:10px; }
.lm-deep-grid {
  display:grid;  grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);  gap:15px;  margin-top:15px; }
.lm-analysis-card,.lm-pattern-card,.lm-growth-plan,.lm-connections {
  padding:20px; }
.lm-analysis-list {
  display:flex;  flex-direction:column;  gap:19px;  margin-top:22px; }
.lm-analysis-row {
  display:flex;  flex-direction:column;  gap:8px; }
.lm-analysis-label {
  display:flex;  align-items:center;  justify-content:space-between;  gap:12px;  color:#F1EFF5;  font-size:12px; }
.lm-analysis-label strong {
  color:#B7B2C1;  font:800 13px 'Manrope',sans-serif; }
.lm-progress-track,.lm-growth-progress {
  width:100%;  height:8px;  overflow:hidden;  border-radius:20px;  background:#201D29; }
.lm-progress-track span,.lm-growth-progress span {
  display:block;  height:100%;  border-radius:20px;  background:linear-gradient(90deg,#B7B2C1,#B7B2C1);  transition:width .5s ease; }
.lm-progress-track.cyan span {
  background:linear-gradient(90deg,#B7B2C1,#B7B2C1); }
.lm-progress-track.blue-track span {
  background:linear-gradient(90deg,#B7B2C1,#B7B2C1); }
.lm-analysis-row small {
  color:#B7B2C1;  font-size:9px;  line-height:1.5; }
.lm-analysis-foot {
  display:flex;  gap:8px;  margin-top:20px;  padding-top:13px;  border-top:1px solid #201D29;  color:#B7B2C1;  font-size:9px;  line-height:1.5; }
.lm-analysis-foot span {
  color:#B7B2C1; }
.lm-pattern-item {
  display:flex;  align-items:flex-start;  gap:12px;  margin-top:16px;  padding:12px;  border:1px solid #201D29;  border-radius:12px;  background:#15151B; }
.lm-pattern-symbol {
  display:grid;  place-items:center;  width:33px;  height:33px;  flex:0 0 33px;  border-radius:10px;  background:#201D29;  color:#B7B2C1;  font-size:19px; }
.lm-pattern-item strong {
  color:#F1EFF5;  font-size:11px; }
.lm-pattern-item p {
  color:#B7B2C1;  font-size:10px;  line-height:1.5;  margin:5px 0 0; }
.lm-growth-plan,.lm-connections {
  margin-top:15px; }
.lm-growth-progress {
  height:5px;  margin-top:17px; }
.lm-growth-steps {
  display:grid;  grid-template-columns:repeat(3,minmax(0,1fr));  gap:10px;  margin-top:14px; }
.lm-growth-step {
  display:flex;  align-items:flex-start;  gap:10px;  padding:14px 12px;  min-width:0;  border:1px solid #201D29;  border-radius:13px;  background:#15151B;  cursor:pointer;  transition:border-color .2s,background .2s; }
.lm-growth-step:hover,.lm-growth-step.is-complete {
  border-color:#292832;  background:#15151B; }
.lm-growth-step input {
  accent-color:#B7B2C1;  margin:3px 0 0;  flex:0 0 auto; }
.lm-step-number {
  color:#B7B2C1;  font:800 10px 'Manrope',sans-serif;  padding-top:2px; }
.lm-step-copy {
  display:flex;  flex-direction:column;  gap:6px;  flex:1;  min-width:0; }
.lm-step-copy strong {
  color:#F1EFF5;  font-size:10px;  line-height:1.5; }
.lm-step-copy small {
  color:#B7B2C1;  font-size:9px;  line-height:1.5; }
.lm-step-time {
  color:#B7B2C1;  font-size:9px;  white-space:nowrap; }
.lm-connect-toggle,.lm-privacy-card button {
  border:1px solid #292832;  border-radius:9px;  background:#201D29;  color:#B7B2C1;  padding:9px 12px;  font-size:10px;  font-weight:700;  cursor:pointer;  white-space:nowrap; }
.lm-connect-toggle span {
  font-size:15px;  margin-left:5px; }
.lm-connection-summary {
  display:flex;  align-items:center;  gap:12px;  margin-top:17px;  padding:13px 14px;  border:1px solid #201D29;  border-radius:12px;  background:#15151B; }
.lm-connection-pulse {
  width:9px;  height:9px;  flex:0 0 9px;  border-radius:50%;  background:#B7B2C1; }
.lm-connection-summary>div {
  flex:1;  min-width:0; }
.lm-connection-summary strong {
  color:#F1EFF5;  font-size:11px; }
.lm-connection-summary p {
  margin:5px 0 0;  color:#B7B2C1;  font-size:9px;  line-height:1.5; }
.lm-planned-badge {
  padding:6px 8px;  border:1px solid #292832;  border-radius:20px;  background:#101015;  color:#B7B2C1;  font-size:8px;  letter-spacing:.5px;  white-space:nowrap; }
.lm-source-grid {
  display:grid;  grid-template-columns:repeat(3,minmax(0,1fr));  gap:10px;  margin-top:12px; }
.lm-source-card {
  display:flex;  flex-direction:column;  align-items:flex-start;  padding:14px;  border:1px solid #201D29;  border-radius:13px;  background:#15151B;  min-width:0; }
.lm-source-icon {
  display:grid;  place-items:center;  width:36px;  height:36px;  border-radius:11px;  background:#201D29;  color:#B7B2C1;  font-size:21px; }
.lm-source-copy {
  flex:1;  margin-top:12px; }
.lm-source-copy strong {
  color:#F1EFF5;  font-size:11px; }
.lm-source-copy p {
  color:#B7B2C1;  font-size:9px;  line-height:1.5;  margin:6px 0; }
.lm-source-copy small {
  color:#B7B2C1;  font-size:8px; }
.lm-source-select {
  margin-top:13px;  width:100%;  padding:8px;  border:1px solid #292832;  border-radius:8px;  background:#201D29;  color:#B7B2C1;  font-size:9px;  cursor:pointer; }
.lm-source-select.selected {
  border-color:#B7B2C1;  background:#201D29;  color:#B7B2C1; }
.lm-support-grid {
  display:grid;  grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);  gap:15px;  margin-top:15px; }
.lm-support-card,.lm-privacy-card {
  display:flex;  align-items:flex-start;  gap:15px;  padding:20px; }
.lm-support-icon {
  display:grid;  place-items:center;  flex:0 0 43px;  width:43px;  height:43px;  border-radius:14px;  background:#201D29;  color:#B7B2C1;  font-size:25px; }
.lm-support-card h2,.lm-privacy-card h2 {
  color:#F1EFF5;  font:700 15px 'Manrope',sans-serif;  margin:7px 0; }
.lm-support-card p,.lm-privacy-card p {
  color:#B7B2C1;  font-size:10px;  line-height:1.65;  margin:0; }
.lm-support-links {
  display:flex;  flex-wrap:wrap;  gap:8px;  margin-top:13px; }
.lm-support-links a {
  padding:8px 10px;  border:1px solid #292832;  border-radius:8px;  background:#15151B;  color:#B7B2C1;  font-size:9px;  text-decoration:none; }
.lm-support-links a:hover {
  border-color:#B7B2C1; }
.lm-privacy-card {
  display:block; }
.lm-privacy-card .lm-section-icon {
  margin-bottom:12px; }
.lm-privacy-card button {
  margin-top:14px; }
.lm-privacy-card button span {
  margin-left:8px; }
@keyframes lmFadeIn {
  from {
    opacity:0;  transform:translateY(6px); }
  to {
    opacity:1;  transform:translateY(0); }
}
@keyframes lmFloat {
  0%,100% {
    transform:translateY(0); }
  50% {
    transform:translateY(-4px); }
}
@media(max-width:1200px) {
  .lm-deep-grid {
    grid-template-columns:1fr; }
  .lm-growth-steps {
    grid-template-columns:1fr; }
  .lm-source-grid {
    grid-template-columns:1fr; }
}
@media(max-width:850px) {
  .lm-support-grid {
    grid-template-columns:1fr; }
  .lm-affirmation-count {
    display:none; }
}
@media(max-width:560px) {
  .lm-affirmation-panel {
    padding:16px;  gap:12px; }
  .lm-affirmation-orb {
    width:38px;  height:38px;  flex-basis:38px;  font-size:21px; }
  .lm-affirmation-text {
    font-size:15px; }
  .lm-analysis-card,.lm-pattern-card,.lm-growth-plan,.lm-connections {
    padding:14px; }
  .lm-connection-summary {
    align-items:flex-start;  flex-wrap:wrap; }
  .lm-planned-badge {
    margin-left:21px; }
  .lm-connect-toggle {
    font-size:9px;  padding:8px; }
  .lm-support-card,.lm-privacy-card {
    padding:15px; }
  .lm-support-card {
    gap:11px; }
  .lm-support-links {
    flex-direction:column;  align-items:flex-start; }
}

/* Restrained LifeMirror accents — black/charcoal remains dominant. */
.lm-brand-mark, .lm-brand-copy strong span, .lm-nav-item.active > span,
.lm-wave, .lm-positive, .lm-mini-chart path, .legend-mint,
.lm-connection-pulse { color: #76E6D0; }
.lm-brand-mark { text-shadow: 0 0 18px #76E6D020; }
.lm-mini-chart path { stroke: #76E6D0; }
.lm-brand-copy small, .lm-eyebrow, .lm-nav-label, .lm-panel-kicker { color: #B6A4FF; }
.lm-nav-item.active { color: #F1EFF5; border-color: #292832; background: #15151B; }
.lm-icon-bubble.mint, .lm-section-icon.mint, .lm-feature-icon.mint,
.lm-rec-icon.mint, .lm-rec-tag.mint { color: #76E6D0; }
.lm-icon-bubble.purple, .lm-section-icon.purple, .lm-feature-icon.purple,
.lm-rec-icon.purple, .lm-rec-tag.purple { color: #B6A4FF; }
.lm-score-ring { --score-color: #76E6D0; }
.lm-progress-track span, .lm-growth-progress span { background: #76E6D0; }
.lm-progress-track.cyan span { background: #76E6D0; }
.lm-progress-track.blue-track span { background: #B6A4FF; }
.lm-support-links a, .lm-privacy-card button { color: #76E6D0; }
.lm-feature-card:hover, .lm-source-select.selected { border-color: #292832; }
.lm-app button:focus-visible, .lm-app select:focus-visible, .lm-app input:focus-visible { outline-color: #B6A4FF; }

.lm-sidebar {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #292832 #15151B;
}
.lm-sidebar-note {
  margin-top: 24px;
  flex-shrink: 0;
}
.lm-profile {
  flex-shrink: 0;
  width: 100%;
}
.lm-logout {
  display: flex !important;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  flex-shrink: 0;
  margin-top: 10px;
  padding: 11px 14px;
  border: 1px solid #292832;
  border-radius: 11px;
  background: #201D29;
  color: #F1EFF5;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.lm-logout:hover {
  background: #292832;
  border-color: #B6A4FF;
}
.lm-logout-icon {
  display: inline-grid;
  place-items: center;
  width: 22px;
  flex: 0 0 22px;
  color: #76E6D0;
  font-size: 20px;
}
.lm-logout-label {
  display: inline !important;
  color: #F1EFF5;
  font-size: 12px;
}
/* Tablet: keep navigation names visible */
@media (max-width: 850px) {
  .lm-sidebar {
    width: 210px;
    flex-basis: 210px;
    align-items: stretch;
    padding: 18px 12px;
  }
.lm-brand {
    padding: 0 5px 22px;
  }
.lm-brand-copy {
    display: flex;
  }
.lm-nav-label {
    display: block;
  }
.lm-nav {
    align-items: stretch;
  }
.lm-nav-item,
  .lm-nav-item:not(.active) {
    display: flex;
    width: 100%;
    height: auto;
    min-height: 44px;
    justify-content: flex-start;
    padding: 10px 12px;
    font-size: 12px;
  }
.lm-nav-item > span {
    font-size: 19px;
  }
.lm-sidebar-note {
    display: block;
    padding: 15px 10px;
  }
.lm-profile {
    justify-content: flex-start;
  }
.lm-profile > span:nth-child(2) {
    display: flex;
  }
.lm-profile-arrow {
    display: block;
  }
.lm-logout {
    justify-content: flex-start;
  }
.lm-logout-label {
    font-size: 12px;
  }
}
/* Small screens: compact, scrollable sidebar */
@media (max-width: 560px) {
  .lm-sidebar {
    width: 58px;
    flex-basis: 58px;
    align-items: center;
    padding: 18px 5px 12px;
  }
.lm-brand {
    justify-content: center;
    padding: 0 0 20px;
  }
.lm-brand-copy,
  .lm-nav-label,
  .lm-sidebar-note,
  .lm-profile > span:nth-child(2),
  .lm-profile-arrow {
    display: none !important;
  }
.lm-nav {
    align-items: center;
  }
.lm-nav-item,
  .lm-nav-item:not(.active) {
    width: 43px;
    min-height: 43px;
    height: 43px;
    justify-content: center;
    padding: 0;
    font-size: 0;
  }
.lm-nav-item > span {
    font-size: 21px;
  }
.lm-profile {
    justify-content: center;
    padding: 12px 0 3px;
  }
.lm-logout {
    width: 43px;
    min-height: 43px;
    justify-content: center;
    padding: 0;
  }
.lm-logout-label {
    display: none !important;
  }
.lm-logout-icon {
    width: auto;
    flex: 0 0 auto;
  }
}
`;