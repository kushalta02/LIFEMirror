
import React, { useEffect, useRef, useState } from "react";
// import "./Chatbox.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const starters = [
  { icon: "☁", text: "I need to let something out", message: "I have something on my mind that I'd like to share." },
  { icon: "♡", text: "I've been feeling low", message: "I've been feeling a little low lately. Can we talk?" },
  { icon: "✦", text: "Help me understand myself", message: "Can you help me understand what I've been feeling lately?" },
  { icon: "☾", text: "I just need a calm moment", message: "I feel overwhelmed. Can you help me slow down and feel calmer?" },
];

const styles = `
.companion-page {
  min-height: 100%;
  color: #f4efff;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  position: relative;
  isolation: isolate;
}
.companion-page * { box-sizing: border-box; }
.companion-shell {
  max-width: 1120px;
  min-height: 720px;
  margin: 0 auto;
  border: 1px solid rgba(201,179,255,.12);
  border-radius: 26px;
  overflow: hidden;
  position: relative;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(108,73,164,.22), transparent 45%),
    linear-gradient(145deg,#171426 0%,#11101d 55%,#191326 100%);
  box-shadow: 0 24px 80px rgba(0,0,0,.22);
}
.companion-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 26px;
  border-bottom: 1px solid rgba(255,255,255,.075);
  gap: 12px;
}
.companion-brand { display:flex; align-items:center; gap:12px; min-width:0; }
.companion-brand-mark {
  width:43px;height:43px;border-radius:15px;display:grid;place-items:center;
  background:linear-gradient(145deg,#bba0ff,#edb7df);
  color:#25183c;font-size:23px;box-shadow:0 0 28px #a98bff26;
}
.companion-brand-name { font-size:17px;font-weight:750;letter-spacing:-.5px; }
.companion-brand-sub { color:#a9a1bf;font-size:11px;margin-top:3px;letter-spacing:.5px; }
.companion-status {
  display:flex;align-items:center;gap:7px;border:1px solid #bba7e426;
  border-radius:30px;padding:9px 13px;color:#d2c8e8;font-size:11px;
  white-space:nowrap;background:#ffffff06;
}
.companion-status-dot { width:7px;height:7px;border-radius:50%;background:#8ee4b5;box-shadow:0 0 10px #8ee4b580; }
.companion-main { display:grid;grid-template-columns: minmax(0,1fr) 300px;min-height:650px; }
.companion-chat { min-width:0;display:flex;flex-direction:column;border-right:1px solid #ffffff0c; }
.companion-conversation { flex:1;padding:28px 30px 16px;overflow-y:auto;max-height:570px; }
.companion-welcome { text-align:center;padding:16px 10px 24px; }
.companion-orb {
  width:108px;height:108px;border-radius:50%;margin:0 auto 22px;position:relative;
  display:grid;place-items:center;
  background:radial-gradient(circle at 34% 27%,#fff1ff 0%,#e2b9ff 12%,#ad8bf5 31%,#6552aa 54%,#2c244c 75%);
  box-shadow:0 0 24px #b28bff25,0 0 70px #9770ff1e,inset -9px -12px 25px #17102b7a;
  animation: companion-float 5s ease-in-out infinite;
}
.companion-orb:before,.companion-orb:after {
  content:"";position:absolute;inset:-10px;border-radius:50%;
  border:1px solid #c9a8ff23;animation:companion-ring 6s linear infinite;
}
.companion-orb:after { inset:-20px;border-color:#c9a8ff13;animation-duration:9s;animation-direction:reverse; }
.companion-orb-core { font-size:28px;color:#fff4ff;text-shadow:0 0 18px #fff; }
@keyframes companion-float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)} }
@keyframes companion-ring { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
.companion-eyebrow { font-size:10px;text-transform:uppercase;letter-spacing:2.5px;color:#b9a6e4;margin-bottom:10px; }
.companion-welcome h1 { font-size:clamp(25px,3vw,35px);letter-spacing:-1.2px;line-height:1.2;margin:0 auto 12px;font-weight:650; }
.companion-welcome p { color:#a9a2bd;font-size:13px;line-height:1.8;max-width:380px;margin:0 auto; }
.companion-messages { display:flex;flex-direction:column;gap:18px;padding-bottom:14px; }
.companion-message { display:flex;gap:10px;align-items:flex-end;max-width:88%;animation:companion-appear .3s ease both; }
.companion-message.user { margin-left:auto;flex-direction:row-reverse; }
@keyframes companion-appear { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
.companion-avatar { flex:0 0 29px;width:29px;height:29px;border-radius:11px;display:grid;place-items:center;background:#b69afc20;color:#d7c4ff;font-size:15px; }
.companion-bubble { border:1px solid #ffffff0c;background:#ffffff07;color:#e8e1f3;padding:12px 15px;border-radius:17px 17px 17px 5px;font-size:13px;line-height:1.75;white-space:pre-wrap;overflow-wrap:anywhere; }
.companion-message.user .companion-bubble { background:linear-gradient(135deg,#7860a8,#66528e);border-color:#c6a7ff25;border-radius:17px 17px 5px 17px;color:#fff; }
.companion-typing { display:flex;align-items:center;gap:4px;padding:15px; }
.companion-typing span { width:5px;height:5px;border-radius:50%;background:#c9b2f8;animation:companion-dot 1s infinite ease-in-out; }
.companion-typing span:nth-child(2){animation-delay:.15s}.companion-typing span:nth-child(3){animation-delay:.3s}
@keyframes companion-dot { 0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-5px);opacity:1} }
.companion-composer-wrap { padding:16px 24px 22px;border-top:1px solid #ffffff0b;background:#0c0b150a; }
.companion-composer {
  display:flex;align-items:flex-end;gap:10px;padding:9px 10px 9px 17px;
  border:1px solid #bba0e52c;background:#ffffff08;border-radius:20px;
  transition:border-color .2s,box-shadow .2s;
}
.companion-composer:focus-within { border-color:#bba0e580;box-shadow:0 0 0 3px #bba0e50c; }
.companion-composer textarea { flex:1;resize:none;min-width:0;max-height:120px;border:0;outline:none;background:transparent;color:#f5efff;font:inherit;font-size:13px;line-height:1.6;padding:8px 0; }
.companion-composer textarea::placeholder { color:#8d849f; }
.companion-send { flex:0 0 39px;width:39px;height:39px;border:0;border-radius:13px;background:linear-gradient(135deg,#c6a8ff,#e4b6e7);color:#251a3b;font-size:20px;cursor:pointer;transition:transform .2s,filter .2s; }
.companion-send:hover { transform:translateY(-2px);filter:brightness(1.08); }
.companion-send:disabled { opacity:.4;cursor:not-allowed;transform:none; }
.companion-footnote { color:#746c88;text-align:center;font-size:10px;margin-top:11px;line-height:1.6; }
.companion-error { font-size:12px;color:#ffb6c1;padding:0 4px 10px; }
.companion-side { padding:28px 20px;display:flex;flex-direction:column;gap:23px;background:linear-gradient(180deg,#ffffff03,transparent); }
.companion-side-heading { font-size:10px;text-transform:uppercase;letter-spacing:1.8px;color:#a49ab9;font-weight:700;margin-bottom:12px; }
.companion-side-title { font-size:20px;line-height:1.4;letter-spacing:-.5px;margin:0 0 8px; }
.companion-side-copy { color:#968da9;font-size:12px;line-height:1.8;margin:0; }
.companion-starter-list { display:flex;flex-direction:column;gap:9px; }
.companion-starter {
  width:100%;display:flex;align-items:center;gap:11px;text-align:left;
  border:1px solid #ffffff0e;background:#ffffff05;border-radius:15px;padding:12px;
  color:#ded6ee;font-size:12px;line-height:1.5;cursor:pointer;
  transition:background .2s,border-color .2s,transform .2s;
}
.companion-starter:hover { background:#b79afc12;border-color:#bba0e540;transform:translateX(2px); }
.companion-starter-icon { flex:0 0 31px;width:31px;height:31px;display:grid;place-items:center;border-radius:11px;background:#b99bfa16;color:#d2baff;font-size:17px; }
.companion-note { padding:15px;border-radius:17px;border:1px solid #e0b6e518;background:linear-gradient(135deg,#b78cf70b,#e5b5e508); }
.companion-note-mark { color:#d8b6fa;font-size:19px;margin-bottom:8px; }
.companion-note p { color:#b7accb;font-size:12px;line-height:1.8;margin:0; }
.companion-reset { align-self:flex-start;background:transparent;border:0;color:#9b8db7;font-size:11px;padding:4px 0;cursor:pointer; }
.companion-reset:hover { color:#e1d0ff; }
@media(max-width:800px) {
  .companion-shell{min-height:0;border-radius:20px}
  .companion-main{grid-template-columns:1fr}
  .companion-chat{border-right:0}
  .companion-conversation{max-height:none;min-height:370px;padding:24px 18px 14px}
  .companion-side{border-top:1px solid #ffffff0c;padding:22px 18px}
  .companion-starter-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .companion-topbar{padding:17px}
  .companion-composer-wrap{padding:14px 15px 18px}
}
@media(max-width:430px) {
  .companion-status{font-size:10px;padding:8px}
  .companion-brand-name{font-size:15px}
  .companion-welcome h1{font-size:27px}
  .companion-orb{width:88px;height:88px}
  .companion-starter-list{grid-template-columns:1fr}
  .companion-message{max-width:95%}
}
`;

export default function Chatbox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    user = {};
  }

  const firstName = (user.name || user.full_name || "").trim().split(" ")[0];
  const email = user.email || "guest";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessage(text = input) {
    const message = text.trim();
    if (!message || loading) return;

    setError("");
    setInput("");
    setMessages((previous) => [...previous, { role: "user", text: message }]);
    setLoading(true);

    try {
      let mood = localStorage.getItem("mood") || "neutral";
      try {
        const parsedMood = JSON.parse(mood);
        if (typeof parsedMood === "string") mood = parsedMood;
      } catch {
        // Keep the saved mood as a string.
      }

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mood, email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `The assistant couldn't respond (${response.status}). Please try again.`
        );
      }

      if (!data.reply) {
        throw new Error("I couldn't get a reply just now. Please try again.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.reply },
      ]);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Couldn't reach LifeMirror. Check that your backend is running."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <div className="companion-page">
      <style>{styles}</style>

      <div className="companion-shell">
        <header className="companion-topbar">
          <div className="companion-brand">
            <div className="companion-brand-mark">✧</div>
            <div>
              <div className="companion-brand-name">LifeMirror</div>
              <div className="companion-brand-sub">YOUR PERSONAL SPACE</div>
            </div>
          </div>
          <div className="companion-status">
            <span className="companion-status-dot" />
            Here with you
          </div>
        </header>

        <div className="companion-main">
          <section className="companion-chat">
            <div className="companion-conversation">
              {messages.length === 0 ? (
                <div className="companion-welcome">
                  <div className="companion-orb">
                    <span className="companion-orb-core">✧</span>
                  </div>
                  <div className="companion-eyebrow">A little space for you</div>
                  <h1>
                    {firstName ? `Hey ${firstName},` : "Hey, you."}
                    <br />
                    how are you, really?
                  </h1>
                  <p>
                    No need to have the right words. Tell me about your day,
                    what’s on your mind, or anything you’ve been keeping inside.
                  </p>
                </div>
              ) : (
                <div className="companion-messages">
                  {messages.map((message, index) => (
                    <div
                      className={`companion-message ${
                        message.role === "user" ? "user" : ""
                      }`}
                      key={`${index}-${message.role}`}
                    >
                      <div className="companion-avatar">
                        {message.role === "user" ? "♡" : "✧"}
                      </div>
                      <div className="companion-bubble">{message.text}</div>
                    </div>
                  ))}
                  {loading && (
                    <div className="companion-message">
                      <div className="companion-avatar">✧</div>
                      <div className="companion-bubble companion-typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="companion-composer-wrap">
              {error && <div className="companion-error">{error}</div>}
              <form className="companion-composer" onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  placeholder="Tell me what's on your mind..."
                  rows={1}
                  aria-label="Write your message"
                  disabled={loading}
                />
                <button
                  className="companion-send"
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  title="Send message"
                >
                  ↑
                </button>
              </form>
              <div className="companion-footnote">
                Take your time. You don't have to figure everything out at once.
                <br />
                LifeMirror is an AI companion, not a replacement for professional support.
              </div>
            </div>
          </section>

          <aside className="companion-side">
            <div>
              <div className="companion-side-heading">Start wherever you are</div>
              <h2 className="companion-side-title">
                You don't have to carry it all alone.
              </h2>
              <p className="companion-side-copy">
                Sometimes, putting a feeling into words is the first little step.
              </p>
            </div>

            <div>
              <div className="companion-side-heading">Maybe start with...</div>
              <div className="companion-starter-list">
                {starters.map((starter) => (
                  <button
                    type="button"
                    className="companion-starter"
                    key={starter.text}
                    onClick={() => sendMessage(starter.message)}
                    disabled={loading}
                  >
                    <span className="companion-starter-icon">{starter.icon}</span>
                    <span>{starter.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="companion-note">
              <div className="companion-note-mark">☾</div>
              <p>
                You are allowed to have difficult days. You are allowed to feel
                things you don't fully understand yet. We can take it one thought
                at a time.
              </p>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                className="companion-reset"
                onClick={() => {
                  setMessages([]);
                  setError("");
                }}
              >
                ↺ Start a fresh conversation
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
