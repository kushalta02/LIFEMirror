import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { logout, useSessionTimeout } from "../utils";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const parse = (value) => {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
};

const tools = [
  { icon: "✎", title: "Journal", desc: "Put today's thoughts into words.", route: "/journal", tone: "mint" },
  { icon: "✧", title: "AI companion", desc: "Talk through what's on your mind.", route: "/chat", tone: "violet" },
  { icon: "◎", title: "Personality", desc: "Explore your traits and strengths.", route: "/personality", tone: "blue" },
  { icon: "↗", title: "Recommendations", desc: "Find a small next step for yourself.", route: "/recommendations", tone: "pink" },
];

const prompts = [
  "What felt heavier than expected today?",
  "What is one thing you handled better than you realise?",
  "What would make the next hour feel a little easier?",
];

export default function Dashboard() {
  const navigate = useNavigate();
  useSessionTimeout();

  const [user, setUser] = useState(() => parse(localStorage.getItem("user")));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [range, setRange] = useState("7");
  const [showWelcome, setShowWelcome] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);
  const [journalText, setJournalText] = useState("");
  const [showJournalPrompt, setShowJournalPrompt] = useState(false);

  const name = user?.name?.trim()?.split(/\s+/)[0] || "there";

  useEffect(() => {
    const timer = window.setTimeout(() => setShowWelcome(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPromptIndex((index) => (index + 1) % prompts.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentUser = parse(localStorage.getItem("user"));
    const token = sessionStorage.getItem("access_token");

    if (!currentUser?.email || !token) {
      logout();
      navigate("/", { replace: true });
      return undefined;
    }

    setUser(currentUser);
    const controller = new AbortController();

    fetch(`${API_URL}/dashboard/${encodeURIComponent(currentUser.email)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          logout();
          navigate("/", { replace: true });
          throw new Error("Your session expired. Please sign in again.");
        }
        if (!response.ok) throw new Error("Could not load your dashboard.");
        return response.json();
      })
      .then((result) => {
        const personality = parse(localStorage.getItem("personality"));
        if (personality?.traits) result.traits = personality.traits;
        setData(result);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setApiError(error.message || "Backend unavailable.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [navigate]);

  const history = useMemo(() => {
    if (!Array.isArray(data?.history)) return [];
    return data.history.map((item, index) => {
      const raw = typeof item === "number" ? item : Number(item?.mood);
      return {
        day: typeof item === "object" && item?.day ? item.day : `Entry ${index + 1}`,
        mood: Number.isFinite(raw) ? Math.max(-1, Math.min(1, raw)) : 0,
      };
    });
  }, [data]);

  const chartData = range === "7" ? history.slice(-7) : range === "30" ? history.slice(-30) : history;
  const journalCount = Number.isFinite(Number(data?.journal_count)) ? Number(data.journal_count) : null;
  const traits = Array.isArray(data?.traits) ? data.traits.slice(0, 4) : [];
  const hasHistory = history.length > 0;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (loading) {
    return <div className="lm-loading"><style>{styles}</style><div className="loading-orb">✿</div><p>Arranging your space...</p></div>;
  }

  return (
    <div className={`lm-shell ${showWelcome ? "is-intro" : ""}`}>
      <style>{styles}</style>
      {showWelcome && (
        <div className="welcome-screen" aria-live="polite">
          <div className="welcome-halo" />
          <div className="welcome-mark">✿</div>
          <p className="eyebrow">YOUR SPACE · YOUR PACE</p>
          <h1>Welcome back, <span>{name}</span><i className="typing-cursor">|</i></h1>
          <p className="welcome-sub">A little space to check in with yourself.</p>
        </div>
      )}

      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("/dashboard")} aria-label="LifeMirror home">
          <span className="brand-mark">✿</span><span className="brand-name">Life<span>Mirror</span><small>PERSONAL WELLNESS</small></span>
        </button>
        <div className="nav-label">YOUR SPACE</div>
        <button className="nav-link selected" onClick={() => navigate("/dashboard")}><span>⌂</span>Overview</button>
        {tools.map((item) => (
          <button className="nav-link" key={item.title} onClick={() => navigate(item.route)}>
            <span>{item.icon}</span>{item.title}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="side-orbit">✧</div>
          <strong>Make room for yourself.</strong>
          <p>Small steps count, even when they're quiet.</p>
          <div className="profile-row"><div className="avatar">{name.charAt(0).toUpperCase()}</div><div className="profile-copy"><b>{user?.name || "Your profile"}</b><small>YOUR PERSONAL SPACE</small></div></div>
          <button className="logout-button" onClick={handleLogout}>↪ <span>Log out</span></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">THURSDAY, YOUR MOMENT TO PAUSE</p><h1>Your inner world, <span>in focus.</span></h1><p className="subtitle">No pressure to feel a certain way. Just notice where you are today.</p></div>
          <div className="top-right"><span className="secure-pill"><i /> PRIVATE SPACE</span><div className="avatar top-avatar">{name.charAt(0).toUpperCase()}</div></div>
        </header>

        {apiError && <div className="notice"><span>ⓘ</span><div><b>Some live data isn't available</b><p>{apiError} Your saved information hasn't been changed.</p></div></div>}

        <section className="hero-grid">
          <article className="hero-card">
            <div className="hero-glow" />
            <div className="hero-content">
              <span className="kicker"><i /> YOUR CHECK-IN</span>
              <h2>How are you <em>really</em> doing?</h2>
              <p>Give yourself a moment before you move on to the next thing.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => setShowJournalPrompt(true)}>Start a reflection <span>↗</span></button>
                <button className="ghost-button" onClick={() => navigate("/chat")}>Talk it through</button>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true"><div className="art-ring ring-one" /><div className="art-ring ring-two" /><div className="art-core">✿</div><span className="art-star star-one">✧</span><span className="art-star star-two">·</span></div>
          </article>
          <article className="today-card">
            <div className="card-topline"><span className="tiny-icon violet">✧</span><span className="micro-label">A NOTE FOR YOU</span><span className="live-dot" /></div>
            <p className="prompt-text" key={promptIndex}>{prompts[promptIndex]}</p>
            <div className="prompt-bottom"><span>REFLECTION PROMPT</span><button onClick={() => setPromptIndex((promptIndex + 1) % prompts.length)} aria-label="Next reflection prompt">↻</button></div>
          </article>
        </section>

        {showJournalPrompt && <div className="modal-backdrop" onClick={() => setShowJournalPrompt(false)}>
          <div className="reflection-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJournalPrompt(false)} aria-label="Close">×</button>
            <span className="kicker"><i /> A MOMENT FOR YOU</span><h2>Start with one honest sentence.</h2><p>{prompts[promptIndex]}</p>
            <textarea value={journalText} onChange={(event) => setJournalText(event.target.value)} placeholder="Write whatever comes to mind..." rows={5} />
            <div className="modal-actions"><button className="ghost-button" onClick={() => setShowJournalPrompt(false)}>Not now</button><button className="primary-button" onClick={() => { localStorage.setItem("lifemirror_draft", journalText); navigate("/journal"); }}>Continue to journal ↗</button></div>
            <small>Your text is saved as a local draft before you continue.</small>
          </div>
        </div>}

        <section className="section-heading"><div><p className="eyebrow">YOUR PERSONAL SNAPSHOT</p><h2>What we know so far</h2></div><span className="subtle-badge">BASED ON AVAILABLE DATA</span></section>
        <section className="snapshot-grid">
          <article className="snapshot-card mood-card"><div className="snapshot-heading"><span className="snapshot-icon mint">☻</span><span>Latest mood</span><span className="card-spark">✧</span></div><div className="snapshot-value">{data?.mood && data.mood !== "No data" ? data.mood : "Not checked in"}</div><p>{data?.mood && data.mood !== "No data" ? "Your latest recorded mood." : "Your next check-in will appear here."}</p><div className="mood-spectrum"><span /><span /><span /><span /><span /></div></article>
          <article className="snapshot-card"><div className="snapshot-heading"><span className="snapshot-icon violet">⌁</span><span>Current insight</span></div><div className="snapshot-value compact">{data?.prediction && data.prediction !== "Write journals" ? data.prediction : "Your story is unfolding"}</div><p>Insights become more meaningful as you add reflections.</p><button className="text-action" onClick={() => navigate("/journal")}>Add a reflection <span>→</span></button></article>
          <article className="snapshot-card"><div className="snapshot-heading"><span className="snapshot-icon blue">◎</span><span>Personality</span></div><div className="snapshot-value compact">{data?.personality && data.personality !== "Unknown" ? data.personality : "Still discovering"}</div><div className="trait-list">{traits.length ? traits.map((trait) => <span key={trait}>{trait}</span>) : <span className="muted-chip">Explore your traits</span>}</div><button className="text-action" onClick={() => navigate("/personality")}>View personality <span>→</span></button></article>
          <article className="snapshot-card journal-card"><div className="snapshot-heading"><span className="snapshot-icon pink">▤</span><span>Journal journey</span></div><div className="snapshot-value">{journalCount === null ? "Keep writing" : journalCount}</div><p>{journalCount === null ? "Your reflection count isn't provided by the dashboard API yet." : journalCount === 1 ? "entry captured so far" : "entries captured so far"}</p><button className="text-action" onClick={() => navigate("/journal")}>Open journal <span>→</span></button></article>
        </section>

        <section className="content-grid">
          <article className="panel chart-panel">
            <div className="panel-heading"><div><p className="eyebrow">PATTERNS OVER TIME</p><h2>Your mood landscape</h2><p className="panel-subtitle">A visual view of recorded check-ins, not a diagnosis.</p></div><select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Chart range"><option value="7">Last 7 entries</option><option value="30">Last 30 entries</option><option value="all">All entries</option></select></div>
            {hasHistory ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}><defs><linearGradient id="lmMoodFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8CEBD5" stopOpacity={0.32} /><stop offset="100%" stopColor="#8CEBD5" stopOpacity={0.015} /></linearGradient></defs><CartesianGrid stroke="#28283A" strokeDasharray="4 5" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#999CB4", fontSize: 11 }} /><YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} tickFormatter={(value) => value === 1 ? "Positive" : value === 0 ? "Neutral" : "Low"} tickLine={false} axisLine={false} tick={{ fill: "#999CB4", fontSize: 10 }} /><Tooltip contentStyle={{ background: "#121426", border: "1px solid #34344C", borderRadius: 12, color: "#F4F4FC" }} formatter={(value) => [Number(value).toFixed(2), "Mood signal"]} /><Area type="monotone" dataKey="mood" stroke="#8CEBD5" strokeWidth={2.5} fill="url(#lmMoodFill)" activeDot={{ r: 5, fill: "#B8AEFF", stroke: "#111324", strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div> : <div className="empty-chart"><div className="empty-chart-icon">⌁</div><b>Your mood landscape starts here</b><p>Once your backend returns mood history, your real check-ins will appear in this chart. No sample data is shown.</p><button className="text-action" onClick={() => navigate("/journal")}>Create your first entry <span>→</span></button></div>}
            <div className="chart-foot"><span><i className="legend-line" /> Recorded mood entries</span><span>{history.length} {history.length === 1 ? "entry" : "entries"} available</span></div>
          </article>

          <article className="panel tools-panel"><div className="panel-heading"><div><p className="eyebrow">MADE FOR YOUR JOURNEY</p><h2>Your tools</h2><p className="panel-subtitle">Choose what feels useful right now.</p></div><span className="sparkle">✧</span></div>
            <div className="tool-list">{tools.map((tool) => <button className="tool-row" key={tool.title} onClick={() => navigate(tool.route)}><span className={`tool-icon ${tool.tone}`}>{tool.icon}</span><span className="tool-copy"><b>{tool.title}</b><small>{tool.desc}</small></span><span className="tool-arrow">↗</span></button>)}</div>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="next-step-panel"><div className="next-art">✦</div><div><p className="eyebrow">ONE SMALL STEP</p><h2>You don't have to figure everything out today.</h2><p>Choose one thing that gives you a little more space to breathe.</p></div><button className="primary-button" onClick={() => navigate("/recommendations")}>Find a next step <span>↗</span></button></article>
          <article className="privacy-panel"><span className="privacy-icon">◇</span><div><b>Your space stays yours.</b><p>External health and calendar integrations are not connected from this screen. Only real data returned by your backend is displayed.</p></div></article>
        </section>
        <footer className="footer"><span>✿ LifeMirror</span><span>Be kind to yourself today.</span><button onClick={handleLogout}>End session ↗</button></footer>
      </main>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{color-scheme:dark}*{box-sizing:border-box}html,body,#root{margin:0;min-height:100%;width:100%}body{background:#090b16;color:#f4f3fc;font-family:'DM Sans',sans-serif}.lm-shell{min-height:100vh;display:flex;background:radial-gradient(ellipse at 78% 0%,#24204555,transparent 38%),#090b16;color:#f4f3fc;animation:pageIn .65s ease both}.lm-shell button,.lm-shell select,.lm-shell textarea{font:inherit}.lm-shell button{cursor:pointer;transition:transform .22s,border-color .22s,background .22s,box-shadow .22s}.lm-shell button:hover{transform:translateY(-2px)}.sidebar{width:238px;flex:0 0 238px;min-height:100vh;position:sticky;top:0;height:100vh;padding:24px 15px 16px;border-right:1px solid #24243a;background:linear-gradient(180deg,#111326,#0c0e1d);display:flex;flex-direction:column;z-index:2}.brand{display:flex;align-items:center;gap:10px;border:0;background:transparent;color:#f4f3fc;text-align:left;padding:3px 6px 30px}.brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:15px;background:linear-gradient(145deg,#a5f3d522,#b5aaff22);border:1px solid #a5f3d544;color:#a5f3d5;font-size:27px;box-shadow:0 0 25px #a5f3d511}.brand-name{font:800 20px Manrope,sans-serif;letter-spacing:-.8px}.brand-name>span{color:#a5f3d5}.brand-name small{display:block;font:700 8px 'DM Sans',sans-serif;letter-spacing:1.7px;color:#777e9e;margin-top:4px}.nav-label,.eyebrow{font-size:9px;font-weight:800;letter-spacing:1.7px;color:#858baa;margin:0 0 10px}.nav-label{padding:0 12px 12px}.nav-link{display:flex;align-items:center;gap:12px;width:100%;padding:12px;border-radius:12px;background:transparent;border:1px solid transparent;color:#a4a8c2;text-align:left;font-size:12px;margin-bottom:5px}.nav-link>span{width:20px;text-align:center;color:#a5f3d5;font-size:19px}.nav-link:hover,.nav-link.selected{background:linear-gradient(100deg,#a5f3d51a,#b5aaff13);border-color:#a5f3d52b;color:#fff;box-shadow:inset 2px 0 #a5f3d5}.sidebar-bottom{margin-top:auto;padding:18px 12px 0;border-top:1px solid #26273b}.side-orbit{font-size:24px;color:#b5aaff;margin-bottom:10px}.sidebar-bottom>strong{font:700 12px Manrope,sans-serif}.sidebar-bottom>p{font-size:10px;line-height:1.6;color:#9297b2}.profile-row{display:flex;align-items:center;gap:9px;border-top:1px solid #26273b;padding-top:14px;margin-top:16px}.avatar{width:36px;height:36px;flex:0 0 36px;border-radius:50%;display:grid;place-items:center;color:#0c1020;background:linear-gradient(135deg,#a5f3d5,#b5aaff);font-weight:800}.profile-copy{min-width:0;display:flex;flex-direction:column;gap:4px}.profile-copy b{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-copy small{font-size:8px;letter-spacing:.8px;color:#858baa}.logout-button{margin-top:13px;width:100%;border:1px solid #303149;background:#17192c;color:#c2c5da;border-radius:10px;padding:10px;text-align:left;font-size:11px}.logout-button span{margin-left:8px}.main{min-width:0;flex:1;max-width:1700px;margin:0 auto;padding:31px clamp(18px,3vw,42px) 20px}.topbar{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:25px}.topbar h1{font:800 clamp(25px,2.5vw,35px)/1.2 Manrope,sans-serif;letter-spacing:-1.4px;margin:0}.topbar h1 span{background:linear-gradient(90deg,#a5f3d5,#b5aaff);background-clip:text;-webkit-background-clip:text;color:transparent}.subtitle{font-size:12px;color:#a2a6c0;margin:9px 0 0}.top-right{display:flex;align-items:center;gap:12px}.secure-pill{display:flex;align-items:center;gap:7px;border:1px solid #33354b;background:#15172a;border-radius:30px;padding:9px 12px;color:#b6bad1;font-size:9px;letter-spacing:.8px;white-space:nowrap}.secure-pill i,.kicker i,.live-dot{width:6px;height:6px;border-radius:50%;background:#a5f3d5;box-shadow:0 0 12px #a5f3d5;display:inline-block}.notice{display:flex;gap:11px;padding:12px 15px;margin-bottom:17px;border:1px solid #6e5b8055;background:#b5aaff0b;border-radius:13px;color:#c9c8e1;font-size:11px}.notice>span{font-size:18px}.notice p{margin:4px 0 0;color:#9da2bf}.hero-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(245px,.8fr);gap:14px}.hero-card{min-height:245px;position:relative;overflow:hidden;border:1px solid #a5f3d52a;border-radius:22px;background:radial-gradient(ellipse at 85% 20%,#b5aaff20,transparent 40%),linear-gradient(115deg,#171b30,#111427 65%,#15162b);padding:28px;display:flex;align-items:center;box-shadow:0 18px 55px #0002}.hero-glow{position:absolute;width:280px;height:280px;right:-50px;top:-100px;border-radius:50%;background:#a5f3d50b;filter:blur(12px)}.hero-content{position:relative;z-index:1;max-width:470px}.kicker{display:flex;align-items:center;gap:8px;color:#a5f3d5;font-size:9px;font-weight:800;letter-spacing:1.5px}.hero-card h2{font:800 clamp(24px,2.5vw,34px)/1.2 Manrope,sans-serif;letter-spacing:-1px;margin:17px 0 10px;max-width:410px}.hero-card h2 em{font-style:normal;color:#b5aaff}.hero-card p{font-size:12px;line-height:1.7;color:#a9aec8;max-width:380px;margin:0}.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:21px}.primary-button{border:0;border-radius:10px;padding:11px 15px;background:linear-gradient(100deg,#a5f3d5,#b5e7e0);color:#101527;font-size:11px;font-weight:800;box-shadow:0 5px 20px #a5f3d51c}.primary-button span{margin-left:10px}.ghost-button{border:1px solid #44445f;border-radius:10px;background:#171a30;color:#d6d6e8;padding:10px 14px;font-size:11px}.hero-art{position:absolute;width:220px;height:220px;right:8px;top:12px;display:grid;place-items:center;opacity:.95}.art-ring{position:absolute;border:1px solid #a5f3d540;border-radius:50%;animation:orbit 20s linear infinite}.ring-one{width:160px;height:160px}.ring-two{width:210px;height:210px;border-color:#b5aaff40;animation-direction:reverse}.art-core{width:94px;height:94px;border-radius:32px;display:grid;place-items:center;background:linear-gradient(145deg,#a5f3d52b,#b5aaff2b);border:1px solid #a5f3d577;color:#a5f3d5;font-size:56px;box-shadow:0 0 55px #a5f3d51e;animation:float 4s ease-in-out infinite}.art-star{position:absolute;color:#b5aaff;font-size:26px}.star-one{top:25px;right:43px}.star-two{bottom:29px;left:20px;font-size:40px;color:#a5f3d5}.today-card{border:1px solid #2d2e48;border-radius:22px;padding:22px;background:linear-gradient(150deg,#17182d,#111324);display:flex;flex-direction:column;justify-content:space-between;min-height:245px;overflow:hidden;position:relative}.today-card:after{content:"";position:absolute;width:130px;height:130px;border-radius:50%;right:-65px;bottom:-65px;background:#b5aaff10;filter:blur(4px)}.card-topline{display:flex;align-items:center;gap:9px}.tiny-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;font-size:18px}.tiny-icon.violet{background:#b5aaff1a;color:#b5aaff}.micro-label{font-size:9px;letter-spacing:1.3px;font-weight:800;color:#9095b3}.live-dot{margin-left:auto}.prompt-text{font:700 20px/1.45 Manrope,sans-serif;letter-spacing:-.4px;margin:20px 0;animation:softIn .45s ease both}.prompt-bottom{display:flex;align-items:center;justify-content:space-between;color:#797f9f;font-size:8px;letter-spacing:1.2px}.prompt-bottom button{border:1px solid #34354e;border-radius:50%;width:31px;height:31px;background:#1d1f36;color:#b5aaff;font-size:18px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:15px;margin:29px 0 13px}.section-heading .eyebrow{margin-bottom:7px}.section-heading h2,.panel h2{font:800 19px Manrope,sans-serif;letter-spacing:-.5px;margin:0}.subtle-badge{border:1px solid #2f3048;border-radius:30px;padding:7px 10px;color:#858baa;font-size:8px;letter-spacing:.8px}.snapshot-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.snapshot-card{min-width:0;position:relative;overflow:hidden;border:1px solid #292a42;border-radius:17px;background:linear-gradient(145deg,#15172a,#101222);padding:17px;transition:transform .25s,border-color .25s,box-shadow .25s}.snapshot-card:hover,.panel:hover{border-color:#a5f3d53b;box-shadow:0 12px 32px #0002}.snapshot-card:hover{transform:translateY(-3px)}.snapshot-heading{display:flex;align-items:center;gap:9px;color:#b5bad3;font-size:10px}.snapshot-icon{display:grid;place-items:center;width:31px;height:31px;border-radius:11px;font-size:17px}.snapshot-icon.mint{color:#a5f3d5;background:#a5f3d51a}.snapshot-icon.violet{color:#b5aaff;background:#b5aaff1a}.snapshot-icon.blue{color:#8cbfff;background:#8cbfff1a}.snapshot-icon.pink{color:#ffa8d4;background:#ffa8d41a}.card-spark{margin-left:auto;color:#a5f3d5}.snapshot-value{font:800 23px/1.3 Manrope,sans-serif;letter-spacing:-.7px;margin-top:18px;overflow-wrap:anywhere}.snapshot-value.compact{font-size:17px;min-height:44px}.snapshot-card>p{font-size:10px;line-height:1.6;color:#9298b5;margin:7px 0 0;min-height:31px}.mood-spectrum{display:flex;gap:4px;margin-top:15px}.mood-spectrum span{height:4px;border-radius:10px;flex:1;background:#34364d}.mood-spectrum span:nth-child(1){background:#b5aaff}.mood-spectrum span:nth-child(2){background:#9bb8e8}.mood-spectrum span:nth-child(3){background:#a5f3d5}.trait-list{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;min-height:23px}.trait-list span,.muted-chip{font-size:8px;color:#c3c4dd;background:#22243a;border:1px solid #34354d;padding:5px 7px;border-radius:20px}.text-action{padding:0;border:0;background:transparent;color:#a5f3d5;font-size:10px;font-weight:700;margin-top:13px}.text-action span{margin-left:6px}.content-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.85fr);gap:13px;margin-top:14px}.panel{min-width:0;border:1px solid #292a42;border-radius:18px;background:linear-gradient(145deg,#141629,#101222);padding:20px;transition:border-color .25s,box-shadow .25s}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.panel-heading .eyebrow{margin-bottom:7px}.panel h2{font-size:17px}.panel-subtitle{font-size:10px;line-height:1.5;color:#9096b4;margin:6px 0 0}.panel-heading select{max-width:130px;background:#1a1c31;border:1px solid #363750;border-radius:9px;color:#c6c8dd;padding:8px;font-size:9px;outline:none}.chart-wrap{height:250px;margin:15px 0 5px}.chart-foot{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #292a42;padding-top:12px;color:#858baa;font-size:9px}.chart-foot span:first-child{display:flex;align-items:center;gap:7px}.legend-line{width:17px;height:3px;border-radius:4px;background:#a5f3d5;display:inline-block}.empty-chart{height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px}.empty-chart-icon{display:grid;place-items:center;width:47px;height:47px;border-radius:15px;background:#a5f3d51a;color:#a5f3d5;font-size:27px;margin-bottom:13px}.empty-chart b{font:700 13px Manrope,sans-serif}.empty-chart p{max-width:330px;color:#8f95b2;font-size:10px;line-height:1.7}.tools-panel .sparkle{color:#b5aaff;font-size:22px}.tool-list{display:flex;flex-direction:column;gap:8px;margin-top:19px}.tool-row{display:flex;align-items:center;gap:11px;text-align:left;width:100%;padding:11px;border:1px solid #292a42;border-radius:12px;background:#17192d;color:#f4f3fc}.tool-row:hover{border-color:#a5f3d55e;background:#1c2035}.tool-icon{display:grid;place-items:center;flex:0 0 36px;width:36px;height:36px;border-radius:12px;font-size:20px}.tool-icon.mint{background:#a5f3d51b;color:#a5f3d5}.tool-icon.violet{background:#b5aaff1b;color:#b5aaff}.tool-icon.blue{background:#8cbfff1b;color:#8cbfff}.tool-icon.pink{background:#ffa8d41b;color:#ffa8d4}.tool-copy{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.tool-copy b{font-size:11px}.tool-copy small{font-size:9px;color:#8f95b2;line-height:1.4}.tool-arrow{color:#a5f3d5;font-size:17px}.bottom-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(270px,.8fr);gap:13px;margin-top:14px}.next-step-panel{display:flex;align-items:center;gap:16px;padding:19px;border:1px solid #a5f3d52a;border-radius:17px;background:radial-gradient(ellipse at 10% 100%,#a5f3d510,transparent 55%),linear-gradient(110deg,#171a2d,#14152a)}.next-art{display:grid;place-items:center;flex:0 0 47px;height:47px;border-radius:15px;background:#b5aaff1b;color:#b5aaff;font-size:27px}.next-step-panel>div:nth-child(2){flex:1;min-width:0}.next-step-panel .eyebrow{margin-bottom:6px}.next-step-panel h2{font:800 15px/1.4 Manrope,sans-serif;margin:0}.next-step-panel p:not(.eyebrow){font-size:10px;color:#969bb7;line-height:1.5;margin:5px 0 0}.next-step-panel .primary-button{white-space:nowrap}.privacy-panel{display:flex;gap:12px;align-items:flex-start;padding:20px;border:1px solid #292a42;border-radius:17px;background:#121426}.privacy-icon{display:grid;place-items:center;flex:0 0 35px;height:35px;border-radius:12px;background:#a5f3d51a;color:#a5f3d5;font-size:22px}.privacy-panel b{font-size:11px}.privacy-panel p{font-size:10px;line-height:1.7;color:#9298b5;margin:6px 0 0}.footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 2px 0;color:#777d9c;font-size:9px}.footer span:first-child{color:#a5f3d5;font-weight:800}.footer button{border:0;background:transparent;color:#999fbb;font-size:9px}.lm-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#090b16;color:#9ca2bd;font-size:12px}.loading-orb{display:grid;place-items:center;width:58px;height:58px;border-radius:20px;background:#a5f3d51a;color:#a5f3d5;font-size:32px;animation:pulse 1.5s ease-in-out infinite}.welcome-screen{position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#090b16eF;backdrop-filter:blur(18px);animation:welcomeOut .7s ease 1.55s forwards}.welcome-halo{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,#b5aaff22,transparent 68%);filter:blur(8px);animation:breathe 2s ease-in-out infinite}.welcome-mark{position:relative;display:grid;place-items:center;width:76px;height:76px;border:1px solid #a5f3d566;border-radius:25px;background:linear-gradient(145deg,#a5f3d51f,#b5aaff20);color:#a5f3d5;font-size:43px;box-shadow:0 0 65px #a5f3d51c;animation:popIn .7s cubic-bezier(.2,.8,.2,1) both}.welcome-screen .eyebrow{position:relative;margin:24px 0 10px;color:#a5f3d5}.welcome-screen h1{position:relative;font:800 clamp(26px,5vw,43px) Manrope,sans-serif;letter-spacing:-1.3px;margin:0;animation:softIn .6s .15s both}.welcome-screen h1 span{color:#b5aaff}.typing-cursor{font-style:normal;color:#a5f3d5;animation:blink .75s steps(2) infinite}.welcome-sub{position:relative;color:#a0a5c0;font-size:12px;animation:softIn .7s .3s both}.modal-backdrop{position:fixed;inset:0;z-index:30;display:grid;place-items:center;padding:18px;background:#050610b8;backdrop-filter:blur(12px);animation:softIn .2s ease both}.reflection-modal{width:min(520px,100%);position:relative;border:1px solid #484665;border-radius:22px;background:linear-gradient(145deg,#191b31,#101222);padding:27px;box-shadow:0 25px 100px #0008}.modal-close{position:absolute;right:17px;top:14px;border:0;background:transparent;color:#aeb2ca;font-size:25px}.reflection-modal h2{font:800 23px Manrope,sans-serif;margin:18px 0 8px}.reflection-modal p{font-size:12px;color:#a7acc6;line-height:1.6}.reflection-modal textarea{width:100%;resize:vertical;border:1px solid #373950;border-radius:12px;background:#0e1020;color:#f4f3fc;padding:13px;outline:none;font-size:12px;line-height:1.6}.reflection-modal textarea:focus{border-color:#a5f3d5;box-shadow:0 0 0 3px #a5f3d511}.modal-actions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;margin-top:14px}.reflection-modal>small{display:block;color:#777e9e;font-size:9px;margin-top:12px}.is-intro .main,.is-intro .sidebar{filter:blur(5px);transform:scale(.99);transition:filter .7s,transform .7s}.lm-shell:not(.is-intro) .main,.lm-shell:not(.is-intro) .sidebar{animation:reveal .7s ease both}@keyframes pageIn{from{opacity:0}to{opacity:1}}@keyframes reveal{from{opacity:.3;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes popIn{from{opacity:0;transform:translateY(18px) scale(.75)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes softIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}@keyframes welcomeOut{0%{opacity:1;visibility:visible}99%{opacity:0;visibility:visible}100%{opacity:0;visibility:hidden;pointer-events:none}}@keyframes blink{50%{opacity:0}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes orbit{to{transform:rotate(360deg)}}@keyframes pulse{50%{transform:scale(1.06);opacity:.7}}@keyframes breathe{50%{transform:scale(1.12);opacity:.65}}@media(max-width:1250px){.sidebar{width:205px;flex-basis:205px}.hero-art{right:-30px;opacity:.65}.snapshot-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.content-grid{grid-template-columns:minmax(0,1.2fr) minmax(270px,.8fr)}}@media(max-width:900px){.sidebar{width:70px;flex-basis:70px;padding:18px 8px}.brand{justify-content:center;padding:0 0 25px}.brand-name,.nav-label,.nav-link:not(.selected){display:none}.nav-link{justify-content:center;padding:12px 0;font-size:0}.nav-link>span{font-size:22px}.sidebar-bottom{padding:15px 0 0}.sidebar-bottom>.side-orbit,.sidebar-bottom>strong,.sidebar-bottom>p,.profile-copy,.logout-button span{display:none}.profile-row{justify-content:center}.logout-button{text-align:center}.hero-grid,.content-grid,.bottom-grid{grid-template-columns:1fr}.hero-art{right:0}.today-card{min-height:190px}.next-step-panel{flex-wrap:wrap}.next-step-panel .primary-button{margin-left:63px}}@media(max-width:580px){.main{padding:20px 12px}.topbar{align-items:flex-start}.topbar h1{font-size:25px}.top-right{gap:6px}.secure-pill{font-size:0;padding:9px}.secure-pill i{width:7px;height:7px}.top-avatar{display:none}.hero-card{padding:22px;min-height:260px}.hero-art{right:-80px;top:20px;opacity:.32}.hero-content{max-width:100%}.hero-card h2{font-size:27px}.today-card{padding:18px}.snapshot-grid{gap:8px}.snapshot-card{padding:13px}.snapshot-value{font-size:19px}.snapshot-value.compact{font-size:15px}.section-heading{align-items:flex-start;flex-direction:column}.subtle-badge{font-size:7px}.panel{padding:14px}.panel-heading{flex-direction:column}.panel-heading select{max-width:none}.chart-wrap,.empty-chart{height:230px}.next-step-panel{align-items:flex-start;padding:15px}.next-step-panel .primary-button{margin-left:0}.footer{flex-wrap:wrap}.welcome-screen h1{text-align:center;padding:0 14px}.welcome-sub{text-align:center}.reflection-modal{padding:22px}.modal-actions{justify-content:stretch}.modal-actions button{flex:1}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
`;