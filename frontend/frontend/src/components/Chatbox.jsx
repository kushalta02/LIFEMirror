import React, { useEffect, useRef, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const starters = [
  { icon: "♡", title: "I need to let it out", caption: "Something has been weighing on me", text: "I have something on my mind that I'd like to share." },
  { icon: "☁", title: "I feel overwhelmed", caption: "Help me slow things down", text: "I've been feeling overwhelmed lately. Can you help me slow down?" },
  { icon: "◌", title: "I want to understand myself", caption: "Make sense of what I'm feeling", text: "Can you help me understand what I've been feeling lately?" },
  { icon: "☼", title: "I need a little perspective", caption: "Help me look at things gently", text: "I need a little perspective on something that's been bothering me." },
];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

.lm-chat, .lm-chat * { box-sizing: border-box; }
.lm-chat {
  --bg: #0b1010;
  --panel: #111919;
  --panel-raised: #172120;
  --panel-soft: #1b2725;
  --line: rgba(207, 224, 213, .105);
  --line-strong: rgba(155, 202, 179, .25);
  --text: #eef3ef;
  --muted: #a0b0a8;
  --subtle: #72847b;
  --mint: #a8d1b9;
  --mint-bright: #c2e4cf;
  --mint-deep: #5f9c7c;
  --amber: #d8bd88;
  min-height: 100vh;
  width: 100%;
  padding: 22px;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color: var(--text);
  background:
    radial-gradient(ellipse at 8% 4%, rgba(45, 93, 76, .17), transparent 34%),
    radial-gradient(ellipse at 91% 90%, rgba(126, 109, 66, .08), transparent 29%),
    var(--bg);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.lm-chat button, .lm-chat textarea { font: inherit; }
.lm-chat button { -webkit-tap-highlight-color: transparent; }
.lm-atmosphere { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.lm-atmosphere::before, .lm-atmosphere::after {
  content: ""; position: absolute; border-radius: 50%; filter: blur(1px);
  border: 1px solid rgba(170, 211, 187, .045);
}
.lm-atmosphere::before { width: 420px; height: 420px; right: -220px; top: 11%; }
.lm-atmosphere::after { width: 260px; height: 260px; left: -170px; bottom: 8%; }
.lm-haze { position: absolute; width: 300px; height: 300px; border-radius: 50%; filter: blur(100px); opacity: .09; animation: lm-haze-drift 22s ease-in-out infinite alternate; }
.lm-haze-a { left: -230px; top: 10%; background: #4f9874; }
.lm-haze-b { right: -230px; bottom: -6%; background: #a98d51; animation-delay: -8s; }
.lm-frame {
  width: 100%; max-width: 1380px; min-height: min(880px, calc(100vh - 44px));
  margin: 0 auto; position: relative; overflow: hidden;
  border: 1px solid var(--line); border-radius: 24px;
  background: rgba(14, 21, 20, .94);
  box-shadow: 0 28px 90px rgba(0,0,0,.32), inset 0 1px rgba(255,255,255,.025);
  animation: lm-frame-enter .65s cubic-bezier(.2,.7,.2,1) both;
}
.lm-frame::before {
  content: ""; position: absolute; z-index: 3; left: 8%; right: 8%; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(170,216,190,.3), rgba(216,189,136,.16), transparent);
  pointer-events: none;
}
.lm-header {
  min-height: 80px; padding: 17px 28px; display: flex; align-items: center;
  justify-content: space-between; gap: 18px; border-bottom: 1px solid var(--line);
  background: rgba(255,255,255,.012); position: relative; z-index: 2;
}
.lm-brand { display: flex; align-items: center; gap: 13px; min-width: 0; }
.lm-brand-mark {
  width: 43px; height: 43px; flex: 0 0 43px; display: grid; place-items: center;
  border: 1px solid rgba(191,224,201,.25); border-radius: 14px;
  color: #d7f0df; font-size: 22px;
  background: linear-gradient(145deg, #294b3b, #172b23);
  box-shadow: inset 0 1px rgba(255,255,255,.08), 0 7px 22px rgba(56,111,81,.12);
}
.lm-brand-name { font: 800 19px/1.2 'Manrope', sans-serif; letter-spacing: -.65px; color: #f2f6f2; }
.lm-brand-sub { margin-top: 5px; color: #7f978a; font-size: 9px; font-weight: 700; letter-spacing: 1.65px; }
.lm-header-right { display: flex; align-items: center; gap: 12px; }
.lm-private-pill {
  display: flex; align-items: center; gap: 8px; padding: 9px 12px;
  border: 1px solid rgba(159,204,177,.15); border-radius: 30px;
  color: #c2d7c9; background: rgba(104,158,123,.055); font-size: 11px; white-space: nowrap;
}
.lm-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #9bc9a9; box-shadow: 0 0 0 4px rgba(155,201,169,.08); animation: lm-live 3s ease-in-out infinite; }
.lm-header-caption { color: #71837a; font-size: 11px; }
.lm-layout { display: grid; grid-template-columns: minmax(0, 1fr) 318px; min-height: 720px; }
.lm-chat-panel { min-width: 0; min-height: 720px; display: flex; flex-direction: column; border-right: 1px solid var(--line); }
.lm-scroll-area { flex: 1; min-height: 0; padding: 31px clamp(22px, 4vw, 50px) 22px; overflow-y: auto; scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: #344b40 transparent; }
.lm-scroll-area::-webkit-scrollbar { width: 5px; }
.lm-scroll-area::-webkit-scrollbar-thumb { background: #344b40; border-radius: 20px; }
.lm-welcome { max-width: 620px; margin: 0 auto; padding: 8px 8px 29px; text-align: center; animation: lm-content-enter .7s ease both; }
.lm-companion-art { width: 174px; height: 164px; margin: 0 auto 12px; display: grid; place-items: center; position: relative; }
.lm-art-glow { position: absolute; width: 125px; height: 125px; border-radius: 50%; background: radial-gradient(circle, rgba(109,177,135,.20), rgba(73,130,96,.07) 48%, transparent 72%); filter: blur(5px); animation: lm-glow-breathe 5.5s ease-in-out infinite; }
.lm-art-ring { position: absolute; width: 130px; height: 130px; border: 1px solid rgba(168,209,185,.22); border-radius: 50%; animation: lm-ring-turn 38s linear infinite; }
.lm-art-ring::after { content: ""; position: absolute; top: 16px; right: 22px; width: 6px; height: 6px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 13px rgba(216,189,136,.55); }
.lm-art-ring-two { width: 155px; height: 155px; border-color: rgba(168,209,185,.09); border-style: dashed; animation-direction: reverse; animation-duration: 54s; }
.lm-art-orb {
  position: relative; z-index: 1; width: 91px; height: 91px; display: grid; place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 23%, #d3edda 0%, #8fc5a2 12%, transparent 32%),
    radial-gradient(circle at 36% 35%, #4f8c68 0%, #2d6246 43%, #173c2a 72%, #10241b 100%);
  box-shadow: inset -10px -12px 20px rgba(0,0,0,.32), inset 4px 4px 14px rgba(238,255,238,.16),
    0 0 24px rgba(100,171,124,.19), 0 0 62px rgba(80,150,104,.10);
  animation: lm-orb-breathe 5.5s ease-in-out infinite;
}
.lm-art-orb::after { content: ""; position: absolute; inset: 8px; border: 1px solid rgba(240,255,242,.23); border-radius: 50%; }
.lm-art-symbol { color: #e4f4e5; font-size: 28px; text-shadow: 0 0 16px rgba(240,255,240,.4); animation: lm-symbol-pulse 5.5s ease-in-out infinite; }
.lm-eyebrow { color: #91c6a5; font-size: 10px; font-weight: 700; letter-spacing: 2.3px; text-transform: uppercase; }
.lm-welcome h1 { margin: 13px auto 13px; color: #f0f5f1; font: 800 clamp(29px, 3.5vw, 43px)/1.2 'Manrope', sans-serif; letter-spacing: -1.7px; }
.lm-welcome h1 span { color: #b9dec4; }
.lm-welcome-copy { max-width: 465px; margin: 0 auto; color: #a7b7ae; font-size: 13px; line-height: 1.95; }
.lm-safety-note { display: inline-flex; align-items: center; gap: 9px; margin-top: 19px; padding: 10px 13px; border: 1px solid rgba(162,204,177,.14); border-radius: 12px; color: #b4c8ba; background: rgba(87,137,103,.055); font-size: 11px; }
.lm-safety-icon { width: 19px; height: 19px; display: grid; place-items: center; border-radius: 50%; color: #bce0c6; background: rgba(105,169,124,.15); }
.lm-conversation { display: flex; flex-direction: column; gap: 21px; padding: 5px 0 22px; }
.lm-message { max-width: 91%; display: flex; align-items: flex-end; gap: 10px; animation: lm-message-in .32s cubic-bezier(.2,.7,.2,1) both; }
.lm-message-user { margin-left: auto; flex-direction: row-reverse; }
.lm-avatar { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; border: 1px solid rgba(175,212,188,.15); border-radius: 12px; color: #bde0c8; background: #1b3025; font-size: 15px; }
.lm-message-user .lm-avatar { color: #14251b; border-color: transparent; background: linear-gradient(145deg, #d5e9d7, #9ec9ac); }
.lm-bubble { min-width: 0; max-width: 100%; padding: 13px 16px; border: 1px solid var(--line); border-radius: 17px 17px 17px 5px; color: #e6eee8; background: linear-gradient(145deg, #1b2622, #17211e); box-shadow: 0 7px 20px rgba(0,0,0,.13); font-size: 13px; line-height: 1.9; white-space: pre-wrap; overflow-wrap: anywhere; }
.lm-message-user .lm-bubble { color: #14271c; border-color: rgba(210,238,215,.55); border-radius: 17px 17px 5px 17px; background: linear-gradient(140deg, #d4e9d7, #b1d5bb); box-shadow: 0 8px 21px rgba(0,0,0,.12); }
.lm-typing { display: flex; align-items: center; gap: 5px; padding: 15px 16px; }
.lm-typing-dot { width: 6px; height: 6px; border-radius: 50%; background: #9dcfaf; animation: lm-typing-bounce 1.15s ease-in-out infinite; }
.lm-typing-dot:nth-child(2) { animation-delay: .15s; }
.lm-typing-dot:nth-child(3) { animation-delay: .3s; }
.lm-typing-label { margin-left: 6px; color: #9eb0a4; font-size: 11px; white-space: nowrap; }
.lm-composer-area { padding: 17px clamp(16px, 3vw, 35px) 19px; border-top: 1px solid var(--line); background: rgba(5,10,9,.28); }
.lm-error { margin-bottom: 11px; padding: 11px 13px; border: 1px solid rgba(225,135,126,.25); border-radius: 12px; color: #f0b7b1; background: rgba(139,53,46,.13); font-size: 12px; line-height: 1.7; }
.lm-composer { display: flex; align-items: flex-end; gap: 11px; padding: 9px 9px 9px 17px; border: 1px solid rgba(166,207,181,.2); border-radius: 17px; background: #17221e; box-shadow: 0 9px 26px rgba(0,0,0,.12); transition: border-color .2s, box-shadow .2s, background .2s; }
.lm-composer:focus-within { border-color: rgba(155,211,174,.6); background: #1a2922; box-shadow: 0 0 0 3px rgba(121,188,143,.07), 0 12px 28px rgba(0,0,0,.18); }
.lm-composer textarea { flex: 1; min-width: 0; min-height: 43px; max-height: 150px; padding: 11px 0; resize: vertical; outline: none; border: 0; color: #eff5f0; background: transparent; font-size: 13px; line-height: 1.65; }
.lm-composer textarea::placeholder { color: #82968a; }
.lm-send { width: 43px; height: 43px; flex: 0 0 43px; display: grid; place-items: center; border: 1px solid rgba(222,243,224,.35); border-radius: 13px; color: #13251a; background: linear-gradient(145deg, #d0e8d4, #9fc9ad); font-size: 23px; cursor: pointer; transition: transform .2s, box-shadow .2s, opacity .2s; }
.lm-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 7px 18px rgba(118,193,143,.2); }
.lm-send:active:not(:disabled) { transform: scale(.96); }
.lm-send:disabled { opacity: .38; cursor: not-allowed; }
.lm-compose-hint { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 10px 3px 0; color: #72847a; font-size: 10px; line-height: 1.6; }
.lm-compose-hint span:first-child { display: flex; align-items: center; gap: 6px; }
.lm-compose-hint b { color: #8da698; font-weight: 500; }
.lm-sidebar { min-width: 0; display: flex; flex-direction: column; gap: 25px; padding: 29px 22px 23px; background: linear-gradient(180deg, rgba(129,178,145,.025), transparent 65%); }
.lm-side-label { margin-bottom: 11px; color: #88b99a; font-size: 9px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; }
.lm-side-title { margin: 0 0 9px; color: #eef4ef; font: 800 22px/1.4 'Manrope', sans-serif; letter-spacing: -.75px; }
.lm-side-copy { margin: 0; color: #9aaca1; font-size: 12px; line-height: 1.85; }
.lm-starter-list { display: flex; flex-direction: column; gap: 8px; }
.lm-starter {
  width: 100%; display: flex; align-items: center; gap: 11px; padding: 11px;
  border: 1px solid rgba(208,229,214,.08); border-radius: 13px; text-align: left;
  color: #e5eee7; background: rgba(255,255,255,.018); cursor: pointer;
  transition: transform .2s, border-color .2s, background .2s, box-shadow .2s;
}
.lm-starter:hover:not(:disabled) { transform: translateY(-2px); border-color: rgba(155,211,174,.3); background: rgba(97,155,117,.075); box-shadow: 0 8px 20px rgba(0,0,0,.13); }
.lm-starter:active:not(:disabled) { transform: scale(.99); }
.lm-starter:disabled { opacity: .48; cursor: not-allowed; }
.lm-starter-icon { width: 37px; height: 37px; flex: 0 0 37px; display: grid; place-items: center; border: 1px solid rgba(160,210,176,.1); border-radius: 11px; color: #b8dec4; background: #1d3226; font-size: 17px; transition: transform .2s, background .2s; }
.lm-starter:hover .lm-starter-icon { transform: scale(1.04); background: #254332; }
.lm-starter-text { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.lm-starter-title { color: #e8f0e9; font-size: 11px; font-weight: 700; line-height: 1.45; }
.lm-starter-caption { color: #8da196; font-size: 10px; line-height: 1.5; }
.lm-side-divider { height: 1px; background: var(--line); }
.lm-checkin { padding: 16px; border: 1px solid rgba(216,189,136,.14); border-radius: 15px; background: linear-gradient(145deg, rgba(216,189,136,.055), rgba(255,255,255,.012)); }
.lm-checkin-top { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; color: #d8bd88; font-size: 10px; font-weight: 700; letter-spacing: 1.1px; text-transform: uppercase; }
.lm-checkin-title { margin: 0 0 7px; color: #e9eee6; font: 700 14px/1.5 'Manrope', sans-serif; }
.lm-checkin-copy { margin: 0; color: #a3b0a4; font-size: 11px; line-height: 1.8; }
.lm-mood-options { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.lm-mood-chip { padding: 7px 9px; border: 1px solid rgba(213,229,214,.1); border-radius: 30px; color: #bdcbbf; background: rgba(255,255,255,.025); font-size: 10px; cursor: pointer; transition: border-color .2s, background .2s, color .2s, transform .2s; }
.lm-mood-chip:hover { transform: translateY(-1px); border-color: rgba(216,189,136,.3); color: #f0dfbd; background: rgba(216,189,136,.07); }
.lm-reminder { margin-top: auto; display: flex; align-items: flex-start; gap: 11px; padding: 15px 14px; border: 1px solid rgba(167,207,179,.12); border-radius: 15px; background: rgba(105,157,119,.045); }
.lm-reminder-icon { width: 31px; height: 31px; flex: 0 0 31px; display: grid; place-items: center; border-radius: 10px; color: #c0dfc8; background: rgba(111,170,128,.12); font-size: 16px; }
.lm-reminder p { margin: 0; color: #a9b9ad; font-size: 11px; line-height: 1.85; }
.lm-reminder strong { color: #e0ece2; font-weight: 700; }
.lm-reset { align-self: flex-start; padding: 4px 0; border: 0; color: #8ca799; background: transparent; font-size: 11px; cursor: pointer; transition: color .2s, transform .2s; }
.lm-reset:hover { color: #d4ead9; transform: translateX(3px); }
.lm-reset:disabled { opacity: .4; cursor: not-allowed; }
.lm-reset span { margin-right: 7px; }
@keyframes lm-frame-enter { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lm-content-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lm-message-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lm-orb-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.045); } }
@keyframes lm-glow-breathe { 0%,100% { transform: scale(.94); opacity: .7; } 50% { transform: scale(1.09); opacity: 1; } }
@keyframes lm-ring-turn { to { transform: rotate(360deg); } }
@keyframes lm-symbol-pulse { 0%,100% { transform: scale(1); } 8%,20% { transform: scale(1.1); } 14%,26% { transform: scale(1); } }
@keyframes lm-typing-bounce { 0%,60%,100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-4px); opacity: 1; } }
@keyframes lm-live { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
@keyframes lm-haze-drift { to { transform: translate(18px, -12px); } }
@media (min-width: 1500px) { .lm-layout { grid-template-columns: minmax(0,1fr) 340px; } .lm-sidebar { padding-left: 25px; padding-right: 25px; } }
@media (max-width: 1020px) { .lm-chat { padding: 14px; } .lm-frame { min-height: calc(100vh - 28px); } .lm-layout { grid-template-columns: minmax(0,1fr) 286px; } .lm-header { padding: 16px 22px; } .lm-sidebar { padding: 25px 17px; } .lm-side-title { font-size: 20px; } }
@media (max-width: 760px) {
  .lm-chat { padding: 9px; }
  .lm-frame { min-height: calc(100vh - 18px); border-radius: 19px; }
  .lm-header { min-height: 70px; padding: 13px 15px; }
  .lm-brand-mark { width: 39px; height: 39px; flex-basis: 39px; }
  .lm-brand-name { font-size: 17px; }
  .lm-brand-sub { font-size: 8px; letter-spacing: 1px; }
  .lm-header-caption { display: none; }
  .lm-layout { grid-template-columns: minmax(0,1fr); }
  .lm-chat-panel { min-height: 570px; border-right: 0; }
  .lm-scroll-area { min-height: 360px; padding: 23px 17px 17px; }
  .lm-companion-art { transform: scale(.9); margin-top: -6px; margin-bottom: 4px; }
  .lm-welcome h1 { font-size: clamp(29px, 7vw, 37px); letter-spacing: -1.2px; }
  .lm-welcome-copy { font-size: 12px; }
  .lm-composer-area { padding: 13px 13px 17px; }
  .lm-compose-hint { flex-wrap: wrap; }
  .lm-sidebar { border-top: 1px solid var(--line); padding: 23px 17px; gap: 20px; }
  .lm-starter-list { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); }
  .lm-starter { align-items: flex-start; min-height: 82px; padding: 10px; }
  .lm-starter-icon { width: 32px; height: 32px; flex-basis: 32px; }
  .lm-reminder { margin-top: 0; }
}
@media (max-width: 430px) {
  .lm-chat { padding: 5px; }
  .lm-frame { border-radius: 16px; }
  .lm-header { padding: 11px; }
  .lm-brand { gap: 9px; }
  .lm-brand-mark { width: 35px; height: 35px; flex-basis: 35px; border-radius: 11px; }
  .lm-brand-name { font-size: 15px; }
  .lm-brand-sub { font-size: 7px; letter-spacing: .8px; }
  .lm-private-pill { padding: 8px 9px; font-size: 9px; }
  .lm-scroll-area { padding: 20px 12px 15px; }
  .lm-message { max-width: 98%; gap: 7px; }
  .lm-avatar { width: 29px; height: 29px; flex-basis: 29px; border-radius: 10px; }
  .lm-bubble { padding: 11px 12px; font-size: 12px; }
  .lm-starter-list { grid-template-columns: minmax(0,1fr); }
  .lm-starter { min-height: 0; align-items: center; }
  .lm-side-title { font-size: 19px; }
  .lm-composer { gap: 7px; padding-left: 12px; }
  .lm-composer textarea { font-size: 12px; }
  .lm-send { width: 39px; height: 39px; flex-basis: 39px; }
  .lm-compose-hint { font-size: 9px; }
}

/* Dashboard-matched visual refresh: charcoal + mint + lavender + rose + blue + gold */
.lm-chat{--bg:#0d1014;--panel:#151a20;--panel-raised:#1b222a;--line:rgba(226,236,243,.09);--text:#f0f4f4;--muted:#9aa7ad;--mint:#78e4bb;--lav:#b9aaff;--rose:#ff9eac;--blue:#8bc7ff;--gold:#edcf92;background:radial-gradient(ellipse at 8% 0%,#78e4bb12,transparent 34%),radial-gradient(ellipse at 95% 95%,#b9aaff12,transparent 30%),#0d1014;padding:20px}
.lm-frame{max-width:1480px;min-height:calc(100vh - 40px);border-color:#ffffff13;border-radius:24px;background:#11161bf5;box-shadow:0 30px 100px #0005}
.lm-frame:before{background:linear-gradient(90deg,transparent,#78e4bb,#b9aaff,#ff9eac,transparent);opacity:.8}
.lm-header{height:78px;padding:0 28px;background:#ffffff03}
.lm-brand-mark{border-color:#78e4bb4a;background:linear-gradient(145deg,#78e4bb29,#b9aaff20);color:var(--mint);box-shadow:0 0 25px #78e4bb12}
.lm-brand-name{color:#f5f7f7}.lm-brand-name span{color:var(--mint)}
.lm-private-pill{border-color:#78e4bb2a;background:#78e4bb0a;color:#b7e9d5}.lm-live-dot{background:var(--mint);box-shadow:0 0 0 4px #78e4bb12,0 0 12px #78e4bb}
.lm-layout{grid-template-columns:minmax(0,1fr) 330px;min-height:calc(100vh - 118px)}
.lm-chat-panel{background:#11161b;border-color:var(--line)}
.lm-scroll-area{padding:27px clamp(18px,3vw,38px) 20px}
.lm-welcome{position:relative;max-width:820px;min-height:450px;margin:0 auto 22px;padding:36px clamp(24px,3.5vw,42px);overflow:hidden;text-align:left;border:1px solid #ffffff14;border-radius:23px;background:radial-gradient(ellipse at 84% 20%,#b9aaff22,transparent 30%),radial-gradient(ellipse at 6% 100%,#78e4bb19,transparent 35%),linear-gradient(125deg,#1a2528,#1b1e29 58%,#22202c);box-shadow:inset 0 1px #ffffff08;animation:lm-content-enter .7s ease both}
.lm-welcome:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.17;background-image:radial-gradient(#e7fff5a0 .6px,transparent .7px);background-size:18px 18px;mask-image:linear-gradient(100deg,transparent,#000)}
.lm-welcome:after{content:"";position:absolute;width:260px;height:260px;right:-85px;bottom:-145px;border:1px solid #b9aaff24;border-radius:50%;box-shadow:0 0 0 25px #b9aaff06,0 0 0 52px #78e4bb05;pointer-events:none}
.lm-welcome-inner{position:relative;z-index:2;max-width:490px}
.lm-eyebrow{display:flex;align-items:center;gap:9px;color:#a9dcca;font-size:9px;letter-spacing:1.8px}
.lm-eyebrow-dot{width:7px;height:7px;border-radius:50%;background:var(--mint);box-shadow:0 0 12px #78e4bb9c}
.lm-welcome h1{margin:20px 0 14px;font-size:clamp(31px,3.4vw,46px);line-height:1.14;letter-spacing:-1.9px}
.lm-welcome h1 span{color:transparent;background:linear-gradient(100deg,#78e4bb,#d7e8d8 48%,#b9aaff);-webkit-background-clip:text;background-clip:text}
.lm-welcome-copy{max-width:430px;margin:0;color:#a9b5bb;font-size:12px;line-height:1.95}
.lm-welcome-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-top:22px}
.lm-action-primary,.lm-action-secondary{display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:12px 15px;border-radius:11px;font-size:10px;font-weight:700;transition:transform .2s,box-shadow .2s,border-color .2s}
.lm-action-primary{border:1px solid #78e4bb;background:#78e4bb;color:#10211a}.lm-action-primary:hover{transform:translateY(-2px);box-shadow:0 9px 25px #78e4bb2b}
.lm-action-secondary{border:1px solid #ffffff20;background:#ffffff08;color:#d0d9db}.lm-action-secondary:hover{border-color:#b9aaff70;background:#b9aaff0c;transform:translateY(-2px)}
.lm-companion-art{position:absolute;width:245px;height:245px;right:3%;top:49px;margin:0;z-index:1;pointer-events:none}
.lm-art-glow{width:155px;height:155px;background:radial-gradient(circle,#78e4bb2b,#b9aaff15 52%,transparent 72%);filter:blur(8px);animation:lm-glow 5s ease-in-out infinite}
.lm-art-ring{width:155px;height:205px;border-color:#78e4bb55;transform:rotate(36deg);animation:lm-orbit 31s linear infinite}
.lm-art-ring:after{content:"";position:absolute;top:18px;right:21px;width:7px;height:7px;border-radius:50%;background:var(--mint);box-shadow:0 0 15px var(--mint)}
.lm-art-ring-two{width:215px;height:155px;border-color:#b9aaff65;transform:rotate(-34deg);animation-direction:reverse;animation-duration:39s}
.lm-art-ring-three{width:230px;height:230px;border-style:dashed;border-color:#ffffff1d;animation-duration:55s}
.lm-art-orb{width:100px;height:100px;border:1px solid #d8f8e66b;background:radial-gradient(circle at 32% 22%,#effff0 0%,#9bf0ce 7%,transparent 25%),radial-gradient(circle at 35% 35%,#65d6ae 0%,#327d70 35%,#45406d 72%,#1b2535 100%);box-shadow:inset -13px -14px 22px #080b18a6,inset 4px 4px 17px #fff5,0 0 38px #78e4bb2b,0 0 80px #b9aaff19;animation:lm-breathe 5s ease-in-out infinite}
.lm-art-orb:after{content:"";position:absolute;inset:8px;border:1px solid #ffffff4a;border-radius:50%}.lm-art-symbol{color:#effff4;font-size:29px;text-shadow:0 0 17px #fff9;animation:lm-twinkle 4s ease-in-out infinite}
.lm-art-spark{position:absolute;font-size:20px;color:var(--lav);animation:lm-float 4s ease-in-out infinite}.lm-art-spark.s1{top:25px;right:33px}.lm-art-spark.s2{bottom:35px;left:24px;color:var(--gold);animation-delay:-2s}.lm-art-label{position:absolute;bottom:2px;color:#8e9eaa;font-size:8px;letter-spacing:1.5px}
.lm-safety-note{position:relative;z-index:2;border-color:#78e4bb25;background:#78e4bb09;color:#c2d7cd}.lm-safety-icon{color:var(--mint);background:#78e4bb19}
.lm-sidebar{gap:22px;padding:25px 20px 22px;background:linear-gradient(180deg,#ffffff02,#b9aaff05)}
.lm-side-label{color:#8e9da5}.lm-side-title{color:#eef2f3;font-size:21px}.lm-side-copy{color:#9aa8ae}
.lm-starter{position:relative;border-color:#ffffff12;background:linear-gradient(115deg,#ffffff05,#ffffff01);overflow:hidden}.lm-starter:after{content:"";position:absolute;inset:0;opacity:0;pointer-events:none;background:linear-gradient(100deg,#78e4bb0a,#b9aaff0b);transition:opacity .2s}.lm-starter:hover:not(:disabled){border-color:#b9aaff45;box-shadow:0 9px 20px #0002}.lm-starter:hover:after{opacity:1}
.lm-starter-icon{position:relative;z-index:1;border-color:#ffffff15;border-radius:12px;background:#78e4bb15;color:var(--mint)}.lm-starter-icon.mint{color:var(--mint);background:#78e4bb17}.lm-starter-icon.lav{color:var(--lav);background:#b9aaff19}.lm-starter-icon.rose{color:var(--rose);background:#ff9eac18}.lm-starter-icon.blue{color:var(--blue);background:#8bc7ff18}
.lm-starter-title{color:#e7eeee}.lm-starter-caption{color:#899aa1}
.lm-checkin{border-color:#edcf9229;background:radial-gradient(ellipse at 100% 0%,#edcf9212,transparent 55%),linear-gradient(145deg,#1c2227,#191d24)}.lm-checkin-top{color:var(--gold)}.lm-mood-chip:hover{border-color:#edcf9260;color:#f5dfb4;background:#edcf9210}
.lm-reminder{border-color:#ff9eac24;background:linear-gradient(125deg,#ff9eac0b,#b9aaff09)}.lm-reminder-icon{border-color:#ff9eac28;color:var(--rose);background:#ff9eac15}.lm-reminder strong{color:#e9e9f1}
.lm-composer{border-color:#ffffff20;background:linear-gradient(110deg,#1a2429,#1c202b)}.lm-composer:focus-within{border-color:#78e4bb78;box-shadow:0 0 0 3px #78e4bb0d,0 12px 32px #0003}.lm-send{border-color:#baf2d966;background:linear-gradient(145deg,#9bf0ce,#78e4bb);color:#102019}.lm-typing-dot:nth-child(2){background:var(--lav)}.lm-typing-dot:nth-child(3){background:var(--rose)}
@keyframes lm-breathe{0%,100%{transform:scale(.96)}50%{transform:scale(1.045)}}@keyframes lm-glow{0%,100%{transform:scale(.92);opacity:.65}50%{transform:scale(1.1);opacity:1}}@keyframes lm-orbit{to{transform:rotate(396deg)}}@keyframes lm-twinkle{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.14);opacity:1}}@keyframes lm-float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(10deg)}}
@media(max-width:1100px){.lm-layout{grid-template-columns:minmax(0,1fr) 290px}.lm-companion-art{right:-2%;transform:scale(.86)}.lm-welcome-inner{max-width:430px}.lm-welcome h1{font-size:38px}}
@media(max-width:800px){.lm-chat{padding:10px}.lm-frame{min-height:calc(100vh - 20px);border-radius:19px}.lm-header{height:70px;padding:0 17px}.lm-layout{grid-template-columns:minmax(0,1fr)}.lm-chat-panel{min-height:570px;border-right:0}.lm-scroll-area{padding:19px 16px}.lm-welcome{min-height:420px;padding:28px 24px}.lm-companion-art{width:180px;height:180px;right:-12px;top:15px;opacity:.65;transform:scale(.75)}.lm-welcome-inner{max-width:420px}.lm-welcome h1{font-size:37px}.lm-sidebar{border-top:1px solid var(--line);padding:22px 17px;display:grid;grid-template-columns:1fr 1fr;align-items:start;gap:18px}.lm-sidebar>div:first-child{grid-column:span 2}.lm-starter-list{display:grid;grid-template-columns:1fr 1fr}.lm-side-divider{display:none}.lm-reset{grid-column:span 2}}
@media(max-width:500px){.lm-chat{padding:5px}.lm-frame{border-radius:16px}.lm-header{height:64px;padding:0 11px}.lm-brand{gap:8px}.lm-brand-mark{width:35px;height:35px;flex-basis:35px}.lm-brand-name{font-size:16px}.lm-brand-sub{font-size:7px;letter-spacing:1px}.lm-header-caption{display:none}.lm-private-pill{padding:8px 9px;font-size:9px}.lm-scroll-area{padding:12px 10px}.lm-welcome{min-height:430px;padding:24px 18px}.lm-companion-art{right:-48px;top:0;opacity:.38;transform:scale(.7)}.lm-welcome-inner{max-width:100%}.lm-welcome h1{position:relative;z-index:2;font-size:34px;letter-spacing:-1.5px}.lm-welcome-copy{position:relative;z-index:2;font-size:11px}.lm-action-primary,.lm-action-secondary{padding:11px 12px}.lm-safety-note{font-size:9px}.lm-message{max-width:98%;gap:7px}.lm-avatar{width:29px;height:29px;flex-basis:29px}.lm-bubble{padding:11px 12px;font-size:11px}.lm-composer-area{padding:12px 10px 14px}.lm-compose-hint{flex-wrap:wrap;font-size:8px}.lm-sidebar{grid-template-columns:1fr;padding:18px 11px;gap:18px}.lm-sidebar>div:first-child,.lm-reset{grid-column:auto}.lm-starter-list{grid-template-columns:1fr}}

@media (prefers-reduced-motion: reduce) {
  .lm-chat *, .lm-chat *::before, .lm-chat *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; }
}

/* LifeMirror v3: warm, lively dashboard styling; no orbital motif. */
.lm-chat{--mint:#80e6c0;--lav:#c2b2ff;--rose:#ffa8b8;--blue:#92d2ff;--gold:#f0d38f;background:radial-gradient(ellipse at 7% 2%,#80e6c018,transparent 30%),radial-gradient(ellipse at 96% 20%,#c2b2ff14,transparent 28%),radial-gradient(ellipse at 70% 100%,#ffa8b80a,transparent 32%),#0d1116}
.lm-frame{background:linear-gradient(135deg,#141a20f7,#151820f7 55%,#171821f7);border-color:#dce8f00f}
.lm-header{background:linear-gradient(90deg,#80e6c006,#c2b2ff07,#ffa8b806)}
.lm-dashboard-return{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid #ffffff16;border-radius:11px;color:#d3dddf;background:#ffffff06;font-size:10px;font-weight:700;white-space:nowrap;transition:transform .2s,border-color .2s,background .2s}
.lm-dashboard-return:hover{transform:translateX(-2px);border-color:#80e6c04a;background:#80e6c00d}.lm-dashboard-return span{font-size:16px;color:var(--mint)}
.lm-welcome{min-height:455px;background:radial-gradient(ellipse at 85% 18%,#c2b2ff25,transparent 31%),radial-gradient(ellipse at 8% 100%,#80e6c01d,transparent 38%),radial-gradient(ellipse at 63% 90%,#ffa8b80d,transparent 32%),linear-gradient(125deg,#1b292c,#20212d 62%,#292333);border-color:#ffffff19;box-shadow:inset 0 1px #ffffff0b,0 18px 45px #0002}
.lm-welcome:before{opacity:.12;background-image:radial-gradient(#fff .65px,transparent .8px);background-size:23px 23px}
.lm-welcome h1 span{background:linear-gradient(100deg,#80e6c0 5%,#c9d9ff 47%,#ffa8b8 83%,#f0d38f);-webkit-background-clip:text;background-clip:text}
.lm-action-primary{border-color:#80e6c0;background:linear-gradient(110deg,#a0f0d0,#80e6c0);box-shadow:0 6px 20px #80e6c018}
.lm-action-secondary{border-color:#c2b2ff35;background:linear-gradient(110deg,#c2b2ff10,#ffa8b80b)}
.lm-companion-art{position:absolute;width:270px;height:285px;right:2%;top:38px;margin:0;z-index:1;pointer-events:none}
.lm-room-glow{position:absolute;inset:12px 0 18px;border-radius:50%;background:radial-gradient(ellipse,#80e6c01c 0%,#c2b2ff12 42%,#ffa8b809 62%,transparent 72%);filter:blur(9px);animation:lm-room-breathe 6s ease-in-out infinite}
.lm-window-frame{position:absolute;top:22px;right:24px;width:151px;height:177px;overflow:hidden;border:5px solid #d9d9ef;border-radius:78px 78px 13px 13px;background:linear-gradient(180deg,#686d9c 0%,#e8a9a9 49%,#f2c992 72%,#8ac6ad 100%);box-shadow:0 0 0 1px #ffffff25,0 15px 40px #05081055,inset 0 0 20px #fff2;animation:lm-window-float 7s ease-in-out infinite}
.lm-window-frame:before{content:"";position:absolute;z-index:3;left:50%;top:0;bottom:0;width:4px;transform:translateX(-50%);background:#e5e1ef;box-shadow:0 0 6px #fff5}
.lm-window-frame:after{content:"";position:absolute;z-index:3;left:0;right:0;top:56%;height:4px;background:#e5e1ef;box-shadow:0 0 6px #fff5}
.lm-window-pane{position:absolute;z-index:2;top:0;bottom:0;width:50%;background:linear-gradient(145deg,#fff2,transparent 65%)}
.lm-sunrise{position:absolute;top:44px;left:49px;width:42px;height:42px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff5d7,#f4d58b 65%,#e9a7a5);box-shadow:0 0 25px #ffdda36b;animation:lm-sun-glow 5s ease-in-out infinite}
.lm-window-hill{position:absolute;bottom:0;left:-20px;width:190px;height:67px;border-radius:50% 50% 0 0/45% 45% 0 0}
.lm-window-hill.hill-back{bottom:17px;background:linear-gradient(120deg,#8aa8b2,#6a8f9d);transform:rotate(-8deg)}
.lm-window-hill.hill-front{background:linear-gradient(120deg,#487f7b,#3b6a65);transform:rotate(7deg)}
.lm-window-star{position:absolute;z-index:2;color:#fff1d0;text-shadow:0 0 10px #fff;animation:lm-star-twinkle 3s ease-in-out infinite}.lm-window-star.star-one{top:23px;right:29px;font-size:12px}.lm-window-star.star-two{top:57px;left:20px;font-size:16px;animation-delay:-1.5s}
.lm-plant-pot{position:absolute;left:16px;bottom:32px;width:83px;height:115px;animation:lm-plant-sway 5s ease-in-out infinite;transform-origin:bottom center}
.lm-plant-stem{position:absolute;bottom:32px;left:39px;width:3px;height:72px;border-radius:5px;background:linear-gradient(#a6dfb0,#528b76);transform:rotate(5deg)}
.lm-leaf{position:absolute;z-index:2;width:32px;height:18px;border-radius:100% 0 100% 0;background:linear-gradient(145deg,#b4edbf,#4ba883);box-shadow:inset 1px 1px #fff5;transform-origin:bottom right}
.lm-leaf.leaf-one{left:11px;top:30px;transform:rotate(24deg)}.lm-leaf.leaf-two{left:39px;top:19px;transform:rotate(-50deg) scaleX(-1);background:linear-gradient(145deg,#d1e7b1,#5c9e83)}.lm-leaf.leaf-three{left:4px;top:54px;transform:rotate(8deg) scale(.85);background:linear-gradient(145deg,#a4dcb4,#4c977f)}.lm-leaf.leaf-four{left:38px;top:48px;transform:rotate(-48deg) scaleX(-1) scale(.88)}
.lm-pot{position:absolute;bottom:0;left:21px;width:43px;height:38px;border-radius:5px 5px 13px 13px;background:linear-gradient(90deg,#d7a0a0,#e8b6aa 45%,#bc8b91);box-shadow:inset 0 4px #f4c7ba,0 7px 12px #0003}.lm-pot:before{content:"";position:absolute;left:-3px;right:-3px;top:-4px;height:8px;border-radius:5px;background:#f0c5b9}
.lm-art-note{position:absolute;right:0;bottom:10px;display:flex;align-items:center;gap:7px;padding:9px 11px;border:1px solid #ffffff1c;border-radius:12px;color:#d9d5ed;background:#242637d9;box-shadow:0 8px 24px #0002;font-size:8px;letter-spacing:.35px;animation:lm-note-float 5s ease-in-out infinite}.lm-art-note span:first-child{color:var(--gold);font-size:13px}
.lm-starter{background:linear-gradient(110deg,#ffffff06,#ffffff02);border-color:#ffffff12}.lm-starter:nth-child(1) .lm-starter-icon{color:var(--mint);background:linear-gradient(145deg,#80e6c021,#80e6c00b);border-color:#80e6c020}.lm-starter:nth-child(2) .lm-starter-icon{color:var(--lav);background:linear-gradient(145deg,#c2b2ff24,#c2b2ff0b);border-color:#c2b2ff20}.lm-starter:nth-child(3) .lm-starter-icon{color:var(--rose);background:linear-gradient(145deg,#ffa8b822,#ffa8b80a);border-color:#ffa8b820}.lm-starter:nth-child(4) .lm-starter-icon{color:var(--blue);background:linear-gradient(145deg,#92d2ff22,#92d2ff0a);border-color:#92d2ff20}
.lm-starter:hover:not(:disabled){border-color:#c2b2ff44;background:linear-gradient(110deg,#80e6c00b,#c2b2ff0c)}
.lm-checkin{border-color:#f0d38f2b;background:radial-gradient(ellipse at 100% 0%,#f0d38f12,transparent 58%),linear-gradient(145deg,#24242b,#1b2027)}
.lm-reminder{border-color:#ffa8b822;background:linear-gradient(125deg,#ffa8b80c,#c2b2ff0b)}
.lm-bubble{background:linear-gradient(145deg,#202a30,#1b222b);border-color:#ffffff14}.lm-message-user .lm-bubble{background:linear-gradient(135deg,#393650,#29394a);border-color:#c2b2ff36}
.lm-composer{background:linear-gradient(110deg,#1b262b,#20202b);border-color:#ffffff1e}.lm-composer:focus-within{border-color:#80e6c077;box-shadow:0 0 0 3px #80e6c012,0 12px 32px #0003}.lm-send{background:linear-gradient(145deg,#a0f0d0,#80e6c0)}
.lm-side-title{letter-spacing:-.8px}.lm-side-heading i{background:linear-gradient(135deg,#c2b2ff,#ffa8b8);box-shadow:0 0 12px #c2b2ff55}
@keyframes lm-room-breathe{0%,100%{transform:scale(.94);opacity:.65}50%{transform:scale(1.06);opacity:1}}
@keyframes lm-window-float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-7px) rotate(.8deg)}}
@keyframes lm-sun-glow{0%,100%{box-shadow:0 0 20px #ffdda34f;transform:scale(.98)}50%{box-shadow:0 0 33px #ffdda38c;transform:scale(1.04)}}
@keyframes lm-plant-sway{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(2.4deg)}}
@keyframes lm-star-twinkle{0%,100%{opacity:.5;transform:scale(.85)}50%{opacity:1;transform:scale(1.18)}}
@keyframes lm-note-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@media(max-width:1100px){.lm-companion-art{right:-3%;transform:scale(.84)}.lm-welcome-inner{max-width:430px}}
@media(max-width:800px){.lm-header-right{gap:8px}.lm-header-caption{display:none}.lm-dashboard-return{padding:8px 10px}.lm-companion-art{right:-10px;top:20px;transform:scale(.72);opacity:.82}.lm-welcome-inner{max-width:420px}}
@media(max-width:500px){.lm-header-right{gap:6px}.lm-dashboard-return{padding:7px 8px;font-size:9px}.lm-companion-art{right:-76px;top:2px;transform:scale(.68);opacity:.34}.lm-welcome-inner{max-width:100%}.lm-welcome h1,.lm-welcome-copy,.lm-welcome-actions,.lm-safety-note{position:relative;z-index:2}}
@media(prefers-reduced-motion:reduce){.lm-companion-art *{animation:none!important}}

.lm-history-panel{padding:15px;border:1px solid #ffffff12;border-radius:16px;background:linear-gradient(145deg,#ffffff07,#ffffff02)}
.lm-history-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.lm-history-title{margin:0;color:#edf4ef;font:800 17px/1.3 'Manrope',sans-serif;letter-spacing:-.45px}
.lm-new-chat{flex-shrink:0;padding:8px 10px;border:1px solid #80e6c044;border-radius:10px;color:#d8f3e5;background:#80e6c012;font-size:10px;font-weight:700;cursor:pointer}
.lm-new-chat:hover:not(:disabled){background:#80e6c021;border-color:#80e6c077}
.lm-new-chat:disabled{opacity:.45;cursor:not-allowed}
.lm-history-list{display:flex;flex-direction:column;gap:11px;max-height:280px;overflow:auto;scrollbar-width:thin;scrollbar-color:#42564d transparent}
.lm-history-group{display:flex;flex-direction:column;gap:4px}
.lm-history-group-title{padding:3px 10px;color:#80978a;font-size:9px;font-weight:800;letter-spacing:1.1px;text-transform:uppercase}
.lm-history-item{display:flex;align-items:center;gap:9px;width:100%;min-width:0;padding:9px 10px;border:1px solid transparent;border-radius:10px;text-align:left;color:#bdcbc2;background:transparent;cursor:pointer}
.lm-history-item:hover:not(:disabled),.lm-history-item.is-active{border-color:#80e6c026;background:#80e6c00c;color:#e6f4ea}
.lm-history-item:disabled{opacity:.55;cursor:wait}
.lm-history-item-icon{flex:0 0 auto;color:#9ed9b6;font-size:12px}
.lm-history-item-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:1.5}
.lm-history-empty{margin:0;color:#92a79a;font-size:11px;line-height:1.7}


/* Viewport-fit layout: only the message transcript and history list scroll. */
.lm-chat{height:100vh;height:100dvh;min-height:0;padding:12px;overflow:hidden}
.lm-frame{height:calc(100vh - 24px);height:calc(100dvh - 24px);min-height:0;display:flex;flex-direction:column}
.lm-header{height:72px;min-height:72px;flex:0 0 72px;padding:0 24px}
.lm-layout{flex:1;min-height:0;height:auto;grid-template-columns:minmax(0,1fr) 310px;overflow:hidden}
.lm-chat-panel{height:100%;min-height:0;overflow:hidden;display:flex;flex-direction:column}
.lm-scroll-area{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:18px clamp(18px,3vw,36px) 16px}
.lm-composer-area{flex:0 0 auto;padding:12px clamp(14px,2.5vw,28px) 13px}
.lm-composer textarea{resize:none;max-height:120px;overflow-y:auto}
.lm-compose-hint{margin-top:7px}
.lm-sidebar{height:100%;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:17px 16px;gap:16px;scrollbar-width:thin}
.lm-history-list{max-height:none;min-height:0;overflow:visible}
.lm-welcome{min-height:0;height:auto;max-width:820px;margin:0 auto;padding:clamp(22px,3vh,34px) clamp(22px,3vw,38px)}
.lm-welcome h1{font-size:clamp(29px,3vw,42px);margin:13px 0 10px}
.lm-welcome-copy{line-height:1.75}
.lm-companion-art{width:220px;height:225px;right:2%;top:20px;transform:scale(.85);transform-origin:top right}
.lm-welcome-inner{max-width:62%;position:relative;z-index:2}
.lm-welcome-actions{margin-top:18px;gap:9px;flex-wrap:wrap}
.lm-safety-note{margin-top:15px}
.lm-mobile-history-toggle{display:none;align-items:center;gap:6px;padding:8px 10px;border:1px solid #ffffff20;border-radius:10px;color:#d9f3e6;background:#80e6c010;font-size:11px;font-weight:700;cursor:pointer}
@media(max-height:760px) and (min-width:801px){
 .lm-header{height:62px;min-height:62px;flex-basis:62px}
 .lm-scroll-area{padding-top:12px;padding-bottom:10px}
 .lm-welcome{padding-top:18px;padding-bottom:18px}
 .lm-companion-art{transform:scale(.68);top:8px}
 .lm-welcome h1{font-size:clamp(27px,2.7vw,36px);margin:8px 0}
 .lm-welcome-copy{font-size:11px;line-height:1.6}
 .lm-welcome-actions{margin-top:12px}
 .lm-safety-note{margin-top:10px}
 .lm-sidebar{padding-top:12px;padding-bottom:12px;gap:11px}
 .lm-history-panel{padding:11px}
 .lm-starter-list{gap:7px}
 .lm-starter{padding:9px;min-height:0}
 .lm-checkin{padding-top:0}
 .lm-reminder{margin-top:0}
}
@media(max-width:800px){
 .lm-chat{padding:0}
 .lm-frame{height:100vh;height:100dvh;min-height:0;border-radius:0;border:0}
 .lm-header{height:64px;min-height:64px;flex-basis:64px;padding:0 12px}
 .lm-layout{display:block;position:relative;min-height:0;height:auto;flex:1;overflow:hidden}
 .lm-chat-panel{height:100%;min-height:0;width:100%;border:0}
 .lm-scroll-area{min-height:0;padding:14px 14px 12px}
 .lm-composer-area{padding:10px 12px max(10px, env(safe-area-inset-bottom))}
 .lm-compose-hint{font-size:9px}
 .lm-mobile-history-toggle{display:inline-flex}
 .lm-header-right{gap:7px}
 .lm-private-pill{padding:7px 8px;font-size:9px}
 .lm-dashboard-return{padding:7px 9px;font-size:10px}
 .lm-sidebar{display:none;position:absolute;z-index:10;top:8px;left:8px;right:8px;bottom:8px;width:auto;height:auto;min-height:0;overflow-y:auto;padding:13px;border:1px solid #ffffff1c;border-radius:17px;background:rgba(17,22,27,.98);box-shadow:0 18px 60px #0009;backdrop-filter:blur(18px)}
 .lm-sidebar.is-open{display:flex;flex-direction:column}
 .lm-sidebar>div:not(.lm-history-panel),.lm-sidebar>.lm-side-divider,.lm-sidebar>.lm-reminder,.lm-sidebar>.lm-reset{display:none}
 .lm-history-panel{padding:13px}
 .lm-history-list{max-height:calc(100dvh - 210px);overflow-y:auto}
 .lm-welcome{min-height:0;margin:auto 0;padding:20px 18px;border-radius:18px}
 .lm-welcome-inner{max-width:100%}
 .lm-welcome h1{font-size:clamp(29px,7vw,39px);margin:12px 0}
 .lm-welcome-copy{max-width:440px;font-size:12px;line-height:1.75}
 .lm-companion-art{width:160px;height:170px;right:-26px;top:0;transform:scale(.68);opacity:.3}
 .lm-welcome-actions{margin-top:15px}
 .lm-safety-note{margin-top:12px}
}
@media(max-width:430px){
 .lm-brand-sub{font-size:7px;letter-spacing:.7px}
 .lm-brand-name{font-size:15px}
 .lm-header-right{gap:5px}
 .lm-header-caption{display:none}
 .lm-mobile-history-toggle{padding:7px 8px;font-size:10px}
 .lm-dashboard-return{padding:7px 8px;font-size:9px}
 .lm-private-pill{padding:7px 7px;font-size:8px}
 .lm-scroll-area{padding:10px 9px}
 .lm-welcome{padding:17px 14px}
 .lm-welcome h1{font-size:30px}
 .lm-welcome-copy{font-size:11px}
 .lm-action-primary,.lm-action-secondary{padding:10px 11px;font-size:10px}
 .lm-safety-note{font-size:9px}
 .lm-composer{gap:7px;padding:7px 7px 7px 11px}
 .lm-composer textarea{min-height:39px;font-size:12px}
 .lm-send{width:38px;height:38px;flex-basis:38px}
}

`;

export default function Chatbox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);
  const conversationRef = useRef(null);
  const loadingRef = useRef(false);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    user = {};
  }

  const firstName = (user.name || user.full_name || "").trim().split(" ")[0];
  const email = typeof user.email === "string" ? user.email : "guest";
  const token =
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access_token");

  function authHeaders(json = false) {
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function readResponse(response, fallbackMessage) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : `${fallbackMessage} (${response.status}).`
      );
    }
    return data;
  }

  async function fetchConversationList() {
    if (!token) {
      setError("Your session has expired. Please log in again.");
      setHistoryLoading(false);
      return [];
    }

    const response = await fetch(`${API_URL}/chat/conversations`, {
      headers: authHeaders(),
    });
    const data = await readResponse(response, "Could not load conversations");
    const items = Array.isArray(data.conversations) ? data.conversations : [];
    setConversations(items);
    return items;
  }

  async function loadConversation(conversationId) {
    if (!token || typeof conversationId !== "string" || !conversationId) return;

    setHistoryLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/chat/history?conversation_id=${encodeURIComponent(conversationId)}`,
        { headers: authHeaders() }
      );
      const data = await readResponse(response, "Could not load chat history");
      conversationRef.current = data.conversation_id || conversationId;
      const safeMessages = Array.isArray(data.messages)
        ? data.messages
            .filter(
              (item) =>
                item &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.text === "string"
            )
            .map((item) => ({ role: item.role, text: item.text }))
        : [];
      setMessages(safeMessages);
      setInput("");
    } catch (err) {
      setError(err.message || "Could not load this conversation.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function createConversation() {
    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }
    const response = await fetch(`${API_URL}/chat/conversations`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({}),
    });
    const data = await readResponse(response, "Could not create a new conversation");
    if (typeof data.conversation_id !== "string" || !data.conversation_id) {
      throw new Error("LifeMirror couldn't create a conversation. Please try again.");
    }
    conversationRef.current = data.conversation_id;
    setMessages([]);
    setInput("");
    setError("");
    setConversations((previous) => [
      data,
      ...previous.filter((item) => item.conversation_id !== data.conversation_id),
    ]);
    return data.conversation_id;
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    let cancelled = false;

    async function initialiseChat() {
      if (!token) {
        setError("Your session has expired. Please log in again.");
        setHistoryLoading(false);
        return;
      }
      try {
        const items = await fetchConversationList();
        if (cancelled) return;
        if (items.length > 0) {
          await loadConversation(items[0].conversation_id);
        } else {
          await createConversation();
          if (!cancelled) setHistoryLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not open LifeMirror chat.");
          setHistoryLoading(false);
        }
      }
    }

    initialiseChat();
    return () => {
      cancelled = true;
    };
    // Token is read from browser storage on mount; route remount handles account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage(text = input) {
    // Never let a React event, DOM node, or other object reach JSON.stringify().
    const message = typeof text === "string" ? text.trim() : "";
    if (!message || loadingRef.current) return;

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    loadingRef.current = true;
    setError("");
    setInput("");
    setMessages((previous) => [...previous, { role: "user", text: message }]);
    setLoading(true);

    try {
      let conversationId = conversationRef.current;
      if (typeof conversationId !== "string" || !conversationId) {
        conversationId = await createConversation();
      }

      let mood = localStorage.getItem("mood") || "neutral";
      try {
        const parsedMood = JSON.parse(mood);
        if (typeof parsedMood === "string") mood = parsedMood;
      } catch {
        // Keep the original string mood.
      }
      if (typeof mood !== "string") mood = "neutral";

      const payload = {
        message,
        mood,
        email,
        conversation_id: conversationId,
      };

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      });

      const data = await readResponse(response, "LifeMirror couldn't respond");
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("LifeMirror couldn't respond just now. Please try again.");
      }

      if (typeof data.conversation_id === "string") {
        conversationRef.current = data.conversation_id;
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.reply },
      ]);

      // Refresh titles/order after the message is saved.
      try {
        await fetchConversationList();
      } catch {
        // The reply is already saved; a history refresh can be retried later.
      }
    } catch (err) {
      // Remove the optimistic user message if the request failed.
      setMessages((previous) => {
        const last = previous[previous.length - 1];
        return last?.role === "user" && last.text === message
          ? previous.slice(0, -1)
          : previous;
      });
      setError(
        err.message === "Failed to fetch"
          ? "I can't reach LifeMirror right now. Please check that your backend is running."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      loadingRef.current = false;
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  async function startFreshConversation() {
    if (loadingRef.current) return;
    setHistoryOpen(false);
    setError("");
    setHistoryLoading(true);
    try {
      await createConversation();
    } catch (err) {
      setError(err.message || "Could not start a new conversation.");
    } finally {
      setHistoryLoading(false);
      inputRef.current?.focus();
    }
  }

  function getConversationGroups(items) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const groups = [
      { title: "Today", items: [] },
      { title: "Yesterday", items: [] },
      { title: "Previous 7 days", items: [] },
      { title: "Older", items: [] },
    ];

    for (const item of items) {
      const rawDate = item.updated_at || item.created_at || item.updatedAt || item.createdAt;
      const time = rawDate ? new Date(rawDate).getTime() : NaN;
      if (!Number.isFinite(time)) {
        groups[3].items.push(item);
      } else if (time >= startOfToday) {
        groups[0].items.push(item);
      } else if (time >= startOfYesterday) {
        groups[1].items.push(item);
      } else if (time >= startOfWeek) {
        groups[2].items.push(item);
      } else {
        groups[3].items.push(item);
      }
    }
    return groups.filter((group) => group.items.length > 0);
  }

  function chooseMood(mood) {
    const prompts = {
      "A bit low": "I'm feeling a bit low today. Can you stay with me and help me talk through it?",
      "Anxious": "I'm feeling anxious right now. Can you help me slow down and figure out what's going on?",
      "Doing okay": "I'm doing okay today, and I'd like to check in with myself for a moment.",
      "Need clarity": "My thoughts feel tangled. Can you help me sort through them without judging me?",
    };
    sendMessage(prompts[mood]);
  }

  return (
    <div className="lm-chat">
      <style>{styles}</style>

      <div className="lm-atmosphere" aria-hidden="true">
        <div className="lm-haze lm-haze-a" />
        <div className="lm-haze lm-haze-b" />
      </div>

      <main className="lm-frame">
        <header className="lm-header">
          <div className="lm-brand">
            <div className="lm-brand-mark" aria-hidden="true">✧</div>
            <div>
              <div className="lm-brand-name">Life<span>Mirror</span></div>
              <div className="lm-brand-sub">YOUR SPACE TO BE HUMAN</div>
            </div>
          </div>
          <div className="lm-header-right">
            <button className="lm-mobile-history-toggle" type="button" onClick={() => setHistoryOpen((open) => !open)} aria-expanded={historyOpen}><span aria-hidden="true">☷</span> History</button>
            <button className="lm-dashboard-return" type="button" onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.assign("/dashboard"); }} aria-label="Return to dashboard"><span aria-hidden="true">←</span> Dashboard</button>
            <span className="lm-header-caption">A moment for you</span>
            <div className="lm-private-pill"><span className="lm-live-dot" />Here with you</div>
          </div>
        </header>

        <div className="lm-layout">
          <section className="lm-chat-panel" aria-label="LifeMirror conversation">
            <div className="lm-scroll-area" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="lm-welcome">
                  <div className="lm-companion-art" aria-label="A softly animated cozy window with sunrise and a growing plant">
                    <div className="lm-room-glow" />
                    <div className="lm-window-frame">
                      <div className="lm-window-pane pane-one" />
                      <div className="lm-window-pane pane-two" />
                      <div className="lm-window-pane pane-three" />
                      <div className="lm-window-pane pane-four" />
                      <div className="lm-sunrise" />
                      <div className="lm-window-hill hill-back" />
                      <div className="lm-window-hill hill-front" />
                      <span className="lm-window-star star-one">✦</span>
                      <span className="lm-window-star star-two">✧</span>
                    </div>
                    <div className="lm-plant-pot"><div className="lm-plant-stem" /><span className="lm-leaf leaf-one" /><span className="lm-leaf leaf-two" /><span className="lm-leaf leaf-three" /><span className="lm-leaf leaf-four" /><div className="lm-pot" /></div>
                    <div className="lm-art-note"><span>✦</span><span>take it one moment at a time</span></div>
                  </div>
                  <div className="lm-welcome-inner">
                  <div className="lm-eyebrow"><span className="lm-eyebrow-dot" />A little space, just for you</div>
                  <h1>{firstName ? `Hey ${firstName},` : "Hey, you,"}<br />what's on your <span>mind?</span></h1>
                  <p className="lm-welcome-copy">
                    You don't have to find the perfect words or pretend you're doing fine.
                    We can talk through the messy bits, celebrate the small wins, or simply
                    take a breath and start wherever you are.
                  </p>
                  <div className="lm-welcome-actions">
                    <button className="lm-action-primary" type="button" onClick={() => inputRef.current?.focus()}>Let's talk <span>↗</span></button>
                    <button className="lm-action-secondary" type="button" onClick={() => chooseMood("Need clarity")}>Help me untangle my thoughts <span>✧</span></button>
                  </div>
                  <div className="lm-safety-note">
                    <span className="lm-safety-icon">♡</span>
                    No judgement. No pressure. Take it at your pace.
                  </div></div>
                </div>
              ) : (
                <div className="lm-conversation">
                  {messages.map((message, index) => (
                    <div
                      className={`lm-message ${message.role === "user" ? "lm-message-user" : ""}`}
                      key={`${index}-${message.role}`}
                    >
                      <div className="lm-avatar" aria-label={message.role === "user" ? "You" : "LifeMirror"}>
                        {message.role === "user" ? "♡" : "✧"}
                      </div>
                      <div className="lm-bubble">{message.text}</div>
                    </div>
                  ))}
                  {loading && (
                    <div className="lm-message">
                      <div className="lm-avatar" aria-label="LifeMirror">✧</div>
                      <div className="lm-bubble lm-typing" aria-label="LifeMirror is thinking">
                        <span className="lm-typing-dot" />
                        <span className="lm-typing-dot" />
                        <span className="lm-typing-dot" />
                        <span className="lm-typing-label">I'm here, thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="lm-composer-area">
              {error && <div className="lm-error" role="alert">{error}</div>}
              <form className="lm-composer" onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="I'm listening... what's on your mind?"
                  rows={1}
                  aria-label="Write your message"
                  disabled={loading}
                />
                <button className="lm-send" type="submit" disabled={!input.trim() || loading} aria-label="Send message" title="Send message">↑</button>
              </form>
              <div className="lm-compose-hint">
                <span><b>↵</b> send · <b>Shift + ↵</b> new line</span>
                <span>AI companion · Not professional care</span>
              </div>
            </div>
          </section>

          <aside className={`lm-sidebar ${historyOpen ? "is-open" : ""}`} aria-label="Conversation history, ideas and gentle reminders">
            <div className="lm-history-panel">
              <div className="lm-history-heading">
                <div>
                  <div className="lm-side-label">Your space</div>
                  <h2 className="lm-history-title">Conversations</h2>
                </div>
                <button type="button" className="lm-new-chat" onClick={startFreshConversation} disabled={loading || historyLoading}>
                  + New chat
                </button>
              </div>
              {historyLoading ? (
                <p className="lm-history-empty">Opening your conversations…</p>
              ) : conversations.length === 0 ? (
                <p className="lm-history-empty">Your conversations will appear here.</p>
              ) : (
                <div className="lm-history-list">
                  {getConversationGroups(conversations).map((group) => (
                    <div className="lm-history-group" key={group.title}>
                      <div className="lm-history-group-title">{group.title}</div>
                      {group.items.map((item) => (
                        <button
                          type="button"
                          key={item.conversation_id}
                          className={`lm-history-item ${item.conversation_id === conversationRef.current ? "is-active" : ""}`}
                          onClick={() => { loadConversation(item.conversation_id); setHistoryOpen(false); }}
                          disabled={loading || historyLoading}
                          title={item.title || "New chat"}
                        >
                          <span className="lm-history-item-icon" aria-hidden="true">↗</span>
                          <span className="lm-history-item-title">{item.title || "New chat"}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="lm-side-label">A gentle place to begin</div>
              <h2 className="lm-side-title">You don't have to carry it all by yourself.</h2>
              <p className="lm-side-copy">No need to explain everything at once. Choose a starting point, or ignore these and tell me in your own way.</p>
            </div>

            <div>
              <div className="lm-side-label">Maybe start with...</div>
              <div className="lm-starter-list">
                {starters.map((starter) => (
                  <button
                    type="button"
                    className="lm-starter"
                    key={starter.title}
                    onClick={() => sendMessage(starter.text)}
                    disabled={loading}
                  >
                    <span className={`lm-starter-icon ${["mint","lav","rose","blue"][starters.indexOf(starter) % 4]}`} aria-hidden="true">{starter.icon}</span>
                    <span className="lm-starter-text">
                      <span className="lm-starter-title">{starter.title}</span>
                      <span className="lm-starter-caption">{starter.caption}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lm-side-divider" />

            <div className="lm-checkin">
              <div className="lm-checkin-top"><span>◉</span> Quick check-in</div>
              <h3 className="lm-checkin-title">What kind of day is it?</h3>
              <p className="lm-checkin-copy">Tap whichever feels closest. You don't have to explain it perfectly.</p>
              <div className="lm-mood-options">
                {["A bit low", "Anxious", "Doing okay", "Need clarity"].map((mood) => (
                  <button className="lm-mood-chip" type="button" key={mood} onClick={() => chooseMood(mood)} disabled={loading}>
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="lm-reminder">
              <div className="lm-reminder-icon" aria-hidden="true">☾</div>
              <p>A reminder, just for now:<br /><strong>You are allowed to have a hard day without making it a hard life.</strong> One moment at a time is enough.</p>
            </div>

            {messages.length > 0 && (
              <button type="button" className="lm-reset" onClick={startFreshConversation} disabled={loading}>
                <span aria-hidden="true">↺</span> Start a fresh conversation
              </button>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}