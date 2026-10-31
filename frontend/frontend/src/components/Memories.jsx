import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout, useSessionTimeout } from "../utils";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function getId(item) {
  return String(item?.id || item?._id || item?.memory_id || "");
}

function getContent(item) {
  return item?.content || item?.text || item?.memory || item?.value || "Saved personal context";
}

function getCategory(item) {
  return String(item?.category || item?.type || "personal context").replaceAll("_", " ");
}

async function readList(response, key) {
  const payload = await response.json().catch(() => ({}));
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function Memories() {
  useSessionTimeout();
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const token = sessionStorage.getItem("access_token");

  const headers = useCallback(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const loadMemories = useCallback(async () => {
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [savedResponse, suggestionResponse] = await Promise.all([
        fetch(`${API_URL}/memory`, { headers: headers() }),
        fetch(`${API_URL}/memory/suggestions`, { headers: headers() }),
      ]);
      if (savedResponse.status === 401 || suggestionResponse.status === 401) {
        logout();
        navigate("/", { replace: true });
        return;
      }
      if (!savedResponse.ok) throw new Error(`Could not load saved memories (${savedResponse.status}).`);
      if (!suggestionResponse.ok) throw new Error(`Could not load suggestions (${suggestionResponse.status}).`);
      const [savedItems, suggestionItems] = await Promise.all([
        readList(savedResponse, "memories"),
        readList(suggestionResponse, "suggestions"),
      ]);
      setSaved(savedItems);
      setSuggestions(suggestionItems);
    } catch (err) {
      setError(err.message || "Could not connect to the memories service.");
    } finally {
      setLoading(false);
    }
  }, [headers, navigate, token]);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  async function runAction(item, action) {
    const id = getId(item);
    if (!id) {
      setNotice("This item is missing its ID. Refresh the page and try again.");
      return;
    }
    setBusy(`${id}:${action}`);
    setNotice("");
    try {
      const url = action === "approve"
        ? `${API_URL}/memory/suggestions/${id}/approve`
        : action === "reject"
          ? `${API_URL}/memory/suggestions/${id}/reject`
          : `${API_URL}/memory/${id}`;
      const response = await fetch(url, {
        method: action === "delete" ? "DELETE" : "POST",
        headers: headers(),
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        navigate("/", { replace: true });
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Could not ${action} this memory (${response.status}).`);
      }
      if (action === "approve") {
        setSuggestions(items => items.filter(entry => getId(entry) !== id));
        setSaved(items => [...items, { ...item, id }]);
        setNotice("Approved — this memory is now saved.");
      } else if (action === "reject") {
        setSuggestions(items => items.filter(entry => getId(entry) !== id));
        setNotice("Suggestion dismissed. It was not saved.");
      } else {
        setSaved(items => items.filter(entry => getId(entry) !== id));
        setNotice("Memory deleted.");
      }
    } catch (err) {
      setNotice(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="lm-memories-page">
      <style>{styles}</style>
      <header className="mem-topbar">
        <button className="mem-back" onClick={() => navigate("/dashboard")}>← Dashboard</button>
        <span> LIFEMIRROR <i> / </i> YOUR MEMORY SPACE</span>
        <button className="mem-refresh" onClick={loadMemories} disabled={loading}>↻ Refresh</button>
      </header>

      <section className="mem-hero">
        <div className="mem-orb">♡</div>
        <small>YOUR CONTEXT, YOUR CONTROL</small>
        <h1>A little space for<br /><em>what matters.</em></h1>
        <p>LifeMirror can remember helpful preferences, goals, and context from your conversations. You decide what stays.</p>
        <div className="mem-stats">
          <span><b>{saved.length}</b><small> SAVED</small></span>
          <span><b>{suggestions.length}</b><small> TO REVIEW</small></span>
        </div>
      </section>

      {error && <div className="mem-alert"><span>{error}</span><button onClick={loadMemories}>Try again</button></div>}
      {notice && <div className="mem-notice"><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}

      <section className="mem-section">
        <div className="mem-heading"><div><small>APPROVAL REQUIRED</small><h2>Suggestions for you</h2><p>These are proposed by your companion. Nothing here is saved until you approve it.</p></div><span className="mem-count">{suggestions.length} waiting</span></div>
        {loading ? <div className="mem-empty">Gathering your memories…</div> : suggestions.length ? (
          <div className="mem-grid">
            {suggestions.map((item, index) => {
              const id = getId(item) || `suggestion-${index}`;
              return <article className="mem-card suggestion-card" key={id}>
                <div className="mem-card-top"><span className="mem-icon">✧</span><small>{getCategory(item)}</small></div>
                <p>{getContent(item)}</p>
                <div className="mem-actions">
                  <button className="mem-approve" disabled={!!busy} onClick={() => runAction(item, "approve")}>{busy === `${id}:approve` ? "Saving…" : "✓ Approve"}</button>
                  <button className="mem-dismiss" disabled={!!busy} onClick={() => runAction(item, "reject")}>{busy === `${id}:reject` ? "Dismissing…" : "Dismiss"}</button>
                </div>
              </article>;
            })}
          </div>
        ) : <div className="mem-empty"><span>✧</span><b>Nothing needs your attention.</b><p>When your companion notices a potentially useful detail, it may suggest it here. You remain in control.</p></div>}
      </section>

      <section className="mem-section">
        <div className="mem-heading"><div><small>YOUR APPROVED CONTEXT</small><h2>Saved memories</h2><p>These details may be used to make future conversations more relevant.</p></div><span className="mem-count">{saved.length} saved</span></div>
        {loading ? <div className="mem-empty">Loading saved context…</div> : saved.length ? (
          <div className="mem-grid">
            {saved.map((item, index) => {
              const id = getId(item) || `saved-${index}`;
              return <article className="mem-card" key={id}>
                <div className="mem-card-top"><span className="mem-icon saved-icon">♡</span><small>{getCategory(item)}</small></div>
                <p>{getContent(item)}</p>
                <div className="mem-card-footer"><span>Saved memory</span><button className="mem-delete" disabled={!!busy} onClick={() => runAction(item, "delete")}>{busy === `${id}:delete` ? "Deleting…" : "Delete memory"}</button></div>
              </article>;
            })}
          </div>
        ) : <div className="mem-empty"><span>♡</span><b>Your memory space is ready.</b><p>Approve a suggestion when it feels useful. You can delete saved memories whenever you want.</p></div>}
      </section>

      <footer className="mem-footer">PRIVATE BY DESIGN <i>·</i> YOU CAN REVIEW OR DELETE SAVED MEMORIES AT ANY TIME</footer>
    </main>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
.lm-memories-page{min-height:100vh;background:radial-gradient(ellipse at 80% 0%,#263a37 0%,transparent 36%),linear-gradient(145deg,#10161a,#151b20 60%,#11181c);color:#eaf1ed;font-family:'DM Sans',sans-serif;padding:0 5vw 55px}.mem-topbar{height:74px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff12;gap:15px}.mem-topbar>span{font-size:9px;letter-spacing:2px;color:#8c9b98}.mem-topbar i{color:#78e4bb}.mem-topbar button{border:1px solid #ffffff20;background:#ffffff08;color:#d6e2dc;border-radius:10px;padding:9px 13px;font-size:10px}.mem-topbar button:disabled{opacity:.45}.mem-hero{max-width:780px;margin:65px auto 75px;text-align:center}.mem-orb{width:68px;height:68px;border:1px solid #78e4bb55;border-radius:23px;display:grid;place-items:center;margin:0 auto 24px;background:radial-gradient(circle,#78e4bb25,#78e4bb05);color:#78e4bb;font-size:30px;box-shadow:0 0 55px #78e4bb16}.mem-hero>small,.mem-heading small{font-size:9px;letter-spacing:2px;color:#78e4bb}.mem-hero h1{font:800 clamp(39px,6vw,65px)/1.08 Manrope;letter-spacing:-2.5px;margin:17px 0}.mem-hero h1 em{font-style:normal;color:#78e4bb}.mem-hero>p{max-width:520px;margin:0 auto;color:#9aa9a7;font-size:13px;line-height:1.9}.mem-stats{display:flex;justify-content:center;gap:50px;margin-top:30px}.mem-stats span{display:flex;align-items:baseline;gap:7px}.mem-stats b{font:700 23px Manrope;color:#e9f4ef}.mem-stats small{font-size:8px;letter-spacing:1.3px;color:#83928f}.mem-section{max-width:1120px;margin:0 auto 65px}.mem-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px}.mem-heading h2{font:700 clamp(24px,3vw,34px) Manrope;margin:9px 0 7px;letter-spacing:-1px}.mem-heading p{margin:0;color:#93a19f;font-size:11px;line-height:1.7}.mem-count{border:1px solid #78e4bb30;background:#78e4bb0c;border-radius:30px;padding:8px 12px;color:#78e4bb;font-size:9px;white-space:nowrap}.mem-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.mem-card{border:1px solid #ffffff14;border-radius:18px;padding:21px;background:linear-gradient(145deg,#1c2529,#171e23);box-shadow:0 15px 40px #0002}.mem-card-top{display:flex;align-items:center;gap:11px}.mem-icon{width:37px;height:37px;display:grid;place-items:center;border-radius:12px;background:#b9aaff18;color:#b9aaff;font-size:19px}.saved-icon{background:#78e4bb17;color:#78e4bb}.mem-card-top small{font-size:8px;letter-spacing:1.4px;text-transform:uppercase;color:#8d9b98}.mem-card>p{font-size:12px;line-height:1.8;color:#e0e9e5;margin:17px 0 20px;overflow-wrap:anywhere}.mem-actions,.mem-card-footer{display:flex;align-items:center;gap:9px}.mem-actions button,.mem-card-footer button{border-radius:9px;padding:9px 12px;font-size:10px}.mem-approve{border:1px solid #78e4bb55;background:#78e4bb18;color:#8cf0c9}.mem-dismiss{border:1px solid #ffffff20;background:#ffffff08;color:#b4c0bd}.mem-card-footer{justify-content:space-between;border-top:1px solid #ffffff12;padding-top:13px}.mem-card-footer span{font-size:9px;color:#7f8e8b}.mem-delete{border:1px solid #ff9eac35;background:#ff9eac0c;color:#ffb1ba}.mem-actions button:disabled,.mem-card-footer button:disabled{opacity:.45;cursor:wait}.mem-empty{border:1px dashed #ffffff24;border-radius:18px;padding:34px;text-align:center;color:#91a09c;font-size:11px;line-height:1.8}.mem-empty>span{display:block;font-size:25px;color:#78e4bb;margin-bottom:9px}.mem-empty b{display:block;color:#e1ebe6;font:700 14px Manrope}.mem-empty p{max-width:470px;margin:8px auto 0}.mem-alert,.mem-notice{max-width:1120px;margin:-35px auto 45px;padding:13px 16px;border-radius:12px;font-size:11px;display:flex;justify-content:space-between;gap:15px}.mem-alert{background:#ff9eac12;border:1px solid #ff9eac40;color:#ffc0c7}.mem-notice{background:#78e4bb12;border:1px solid #78e4bb40;color:#a8f3d4}.mem-alert button,.mem-notice button{background:none;border:0;color:inherit}.mem-footer{text-align:center;color:#63716e;font-size:8px;letter-spacing:1.7px}.mem-footer i{color:#78e4bb;margin:0 8px}@media(max-width:700px){.lm-memories-page{padding:0 17px 35px}.mem-topbar{height:62px}.mem-topbar>span{display:none}.mem-hero{margin:48px auto 55px}.mem-heading{align-items:flex-start;flex-direction:column}.mem-grid{grid-template-columns:1fr}.mem-stats{gap:28px}.mem-card{padding:17px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
`;