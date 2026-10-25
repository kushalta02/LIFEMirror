
import React, { useEffect, useRef, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const starters = [
  {
    icon: "♡",
    title: "Let something out",
    text: "I have something on my mind that I'd like to share.",
  },
  {
    icon: "☁",
    title: "Feeling a little low",
    text: "I've been feeling a little low lately. Can we talk?",
  },
  {
    icon: "✧",
    title: "Understand myself",
    text: "Can you help me understand what I've been feeling lately?",
  },
  {
    icon: "☾",
    title: "Find some calm",
    text: "I feel overwhelmed. Can you help me slow down?",
  },
];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=Manrope:wght@400;500;600;650;700;750;800&display=swap');

.companion-page,
.companion-page * {
  box-sizing: border-box;
}

.companion-page {
  --lm-bg: #171019;
  --lm-panel: #211722;
  --lm-panel-soft: #281c29;
  --lm-text: #fff5f6;
  --lm-muted: #c0aebd;
  --lm-dim: #998493;
  --lm-rose: #f0b7c8;
  --lm-lilac: #d5b7ed;
  width: 100%;
  min-height: 100vh;
  padding: 24px;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color: var(--lm-text);
  background:
    radial-gradient(ellipse at 12% 12%, rgba(131, 66, 89, .17), transparent 36%),
    radial-gradient(ellipse at 85% 82%, rgba(104, 65, 88, .13), transparent 36%),
    #171019;
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.companion-page button,
.companion-page textarea {
  font-family: inherit;
}

.companion-ambient {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.companion-glow {
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: .14;
  animation: lm-drift 16s ease-in-out infinite alternate;
}

.companion-glow.one {
  background: #c56b8b;
  left: -210px;
  top: 12%;
}

.companion-glow.two {
  background: #956b9d;
  right: -230px;
  bottom: 2%;
  animation-delay: -7s;
}

.companion-star {
  position: absolute;
  color: #f0c9d8;
  opacity: .5;
  animation: lm-twinkle 4s ease-in-out infinite;
}

.companion-shell {
  width: 100%;
  max-width: 1280px;
  min-height: min(850px, calc(100vh - 48px));
  margin: 0 auto;
  border: 1px solid rgba(242, 208, 221, .12);
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  background: rgba(28, 20, 29, .96);
  box-shadow:
    0 30px 100px rgba(0, 0, 0, .28),
    0 1px 0 rgba(255, 255, 255, .035) inset;
  animation: lm-shell-in .65s ease both;
}

.companion-topbar {
  min-height: 82px;
  padding: 17px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid rgba(244, 211, 224, .09);
  background: rgba(255, 255, 255, .012);
}

.companion-brand {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}

.companion-brand-mark {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  font-size: 24px;
  color: #3b2537;
  background: linear-gradient(145deg, #f6d4df, #c9a9df);
  box-shadow: 0 5px 24px rgba(221, 161, 193, .16);
  animation: lm-mark-glow 5s ease-in-out infinite;
}

.companion-brand-name {
  font-family: 'Manrope', sans-serif;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -.8px;
  color: #fff3f5;
}

.companion-brand-sub {
  margin-top: 4px;
  color: #ad96a8;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.7px;
}

.companion-status {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 14px;
  border: 1px solid rgba(186, 221, 174, .15);
  border-radius: 30px;
  color: #dfebd9;
  font-size: 11px;
  font-weight: 550;
  background: rgba(165, 202, 151, .055);
  white-space: nowrap;
}

.companion-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a9d8a0;
  box-shadow: 0 0 12px rgba(169, 216, 160, .6);
  animation: lm-status-pulse 2.5s ease-in-out infinite;
}

.companion-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  min-height: 690px;
}

.companion-chat {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 690px;
  border-right: 1px solid rgba(244, 211, 224, .08);
}

.companion-conversation {
  flex: 1;
  min-height: 0;
  padding: 34px clamp(20px, 4vw, 46px) 20px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #604653 transparent;
}

.companion-conversation::-webkit-scrollbar {
  width: 5px;
}

.companion-conversation::-webkit-scrollbar-thumb {
  background: #604653;
  border-radius: 10px;
}

.companion-welcome {
  max-width: 570px;
  margin: 0 auto;
  text-align: center;
  padding: 13px 10px 30px;
  animation: lm-welcome-in .8s ease both;
}

.companion-orb-stage {
  width: 190px;
  height: 174px;
  position: relative;
  display: grid;
  place-items: center;
  margin: 0 auto 23px;
}

.companion-orb-halo {
  position: absolute;
  width: 165px;
  height: 165px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(214, 151, 183, .19),
    rgba(178, 126, 172, .075) 44%,
    transparent 72%
  );
  filter: blur(4px);
  animation: lm-halo 4.5s ease-in-out infinite;
}

.companion-orb-ring {
  position: absolute;
  width: 144px;
  height: 144px;
  border: 1px solid rgba(236, 181, 210, .2);
  border-radius: 50%;
  animation: lm-orbit 18s linear infinite;
}

.companion-orb-ring::before {
  content: "";
  position: absolute;
  width: 7px;
  height: 7px;
  top: 17px;
  left: 24px;
  border-radius: 50%;
  background: #f5d1e2;
  box-shadow: 0 0 14px rgba(245, 209, 226, .8);
}

.companion-orb-ring.ring-two {
  width: 166px;
  height: 166px;
  border-style: dashed;
  border-color: rgba(202, 163, 221, .15);
  animation-direction: reverse;
  animation-duration: 30s;
}

.companion-orb {
  width: 104px;
  height: 104px;
  display: grid;
  place-items: center;
  position: relative;
  z-index: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 31% 25%, #fff0f5 0%, #f0c6df 10%, transparent 31%),
    radial-gradient(circle at 35% 30%, #d9a7d1 0%, #b27eb6 33%, #76557f 63%, #3c2b4a 100%);
  box-shadow:
    0 0 28px rgba(211, 144, 196, .29),
    0 0 75px rgba(184, 123, 181, .14),
    inset -10px -12px 22px rgba(34, 17, 39, .42),
    inset 5px 5px 16px rgba(255, 237, 249, .23);
  animation: lm-orb-breathe 5s ease-in-out infinite;
}

.companion-orb::after {
  content: "";
  position: absolute;
  inset: 9px;
  border: 1px solid rgba(255, 239, 249, .15);
  border-radius: 50%;
}

.companion-orb-core {
  color: #fff4fb;
  font-size: 34px;
  text-shadow: 0 0 22px #fff;
  animation: lm-heartbeat 5s ease-in-out infinite;
}

.companion-eyebrow {
  margin-bottom: 13px;
  color: #e4b4cf;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.companion-welcome h1 {
  margin: 0 auto 16px;
  color: #fff4f6;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(28px, 3.5vw, 42px);
  font-weight: 750;
  line-height: 1.24;
  letter-spacing: -1.9px;
}

.companion-welcome h1 em {
  color: #e9b8d2;
  font-style: normal;
}

.companion-welcome p {
  max-width: 420px;
  margin: 0 auto;
  color: #c4b2bf;
  font-size: 14px;
  line-height: 1.95;
  font-weight: 400;
}

.companion-welcome-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 9px 13px;
  border: 1px solid rgba(234, 192, 211, .11);
  border-radius: 30px;
  color: #cdb3c4;
  font-size: 11px;
  background: rgba(240, 190, 215, .035);
}

.companion-welcome-note span {
  color: #efbad2;
}

.companion-messages {
  display: flex;
  flex-direction: column;
  gap: 23px;
  padding: 12px 0 20px;
}

.companion-message {
  display: flex;
  align-items: flex-end;
  gap: 11px;
  max-width: 91%;
  animation: lm-message-in .42s cubic-bezier(.2,.7,.2,1) both;
}

.companion-message.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.companion-avatar {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: #f0c7dc;
  font-size: 17px;
  background: linear-gradient(145deg, #493044, #302331);
  border: 1px solid rgba(242, 192, 218, .12);
  box-shadow: 0 4px 14px rgba(0, 0, 0, .12);
}

.companion-message.user .companion-avatar {
  color: #493043;
  background: linear-gradient(145deg, #f2c9da, #d7b8e9);
  border-color: transparent;
}

.companion-bubble {
  min-width: 0;
  max-width: 100%;
  padding: 14px 17px;
  border: 1px solid rgba(242, 207, 222, .1);
  border-radius: 19px 19px 19px 5px;
  color: #f2e7ed;
  background: linear-gradient(145deg, #2b202d, #251b28);
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  box-shadow: 0 7px 22px rgba(0, 0, 0, .07);
}

.companion-message.user .companion-bubble {
  color: #fff8fb;
  background: linear-gradient(135deg, #87566f, #714f76);
  border-color: rgba(255, 224, 241, .13);
  border-radius: 19px 19px 5px 19px;
  box-shadow: 0 8px 24px rgba(91, 45, 76, .14);
}

.companion-typing {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 72px;
  padding: 17px 18px;
}

.companion-typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e4b4d0;
  animation: lm-typing 1.2s infinite ease-in-out;
}

.companion-typing span:nth-child(2) {
  animation-delay: .16s;
}

.companion-typing span:nth-child(3) {
  animation-delay: .32s;
}

.companion-typing-label {
  margin-left: 6px;
  color: #c4a8bb;
  font-size: 11px;
}

.companion-composer-wrap {
  padding: 18px clamp(16px, 3vw, 34px) 22px;
  border-top: 1px solid rgba(244, 211, 224, .09);
  background: rgba(17, 12, 19, .3);
}

.companion-composer {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 11px 11px 11px 19px;
  border: 1px solid rgba(227, 176, 203, .18);
  border-radius: 21px;
  background: #261c29;
  transition: border-color .25s, box-shadow .25s, background .25s;
}

.companion-composer:focus-within {
  border-color: rgba(230, 174, 204, .65);
  background: #2a1e2d;
  box-shadow: 0 0 0 4px rgba(218, 157, 192, .055);
}

.companion-composer textarea {
  flex: 1;
  min-width: 0;
  max-height: 140px;
  min-height: 42px;
  padding: 11px 0;
  resize: none;
  border: 0;
  outline: none;
  color: #fff2f6;
  background: transparent;
  font-size: 14px;
  line-height: 1.65;
}

.companion-composer textarea::placeholder {
  color: #a58e9e;
}

.companion-send {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 15px;
  color: #382438;
  background: linear-gradient(140deg, #f4d0df, #d5b6e8);
  font-size: 23px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .22s, box-shadow .22s, opacity .22s;
}

.companion-send:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 6px 22px rgba(221, 166, 205, .2);
}

.companion-send:active:not(:disabled) {
  transform: scale(.95);
}

.companion-send:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.companion-footnote {
  margin-top: 12px;
  color: #a38d9d;
  font-size: 10px;
  line-height: 1.8;
  text-align: center;
}

.companion-error {
  margin: 0 0 12px;
  padding: 11px 13px;
  border: 1px solid rgba(240, 151, 171, .2);
  border-radius: 12px;
  color: #ffc0cc;
  background: rgba(180, 65, 91, .09);
  font-size: 12px;
  line-height: 1.7;
}

.companion-side {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 34px 23px 25px;
  background: linear-gradient(180deg, rgba(240, 194, 216, .025), transparent 75%);
}

.companion-side-heading {
  margin-bottom: 12px;
  color: #d7a9c3;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.9px;
  text-transform: uppercase;
}

.companion-side-title {
  margin: 0 0 10px;
  color: #fff0f5;
  font-family: 'Manrope', sans-serif;
  font-size: 23px;
  line-height: 1.4;
  font-weight: 750;
  letter-spacing: -.9px;
}

.companion-side-copy {
  margin: 0;
  color: #bba7b7;
  font-size: 12px;
  line-height: 1.9;
}

.companion-starter-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.companion-starter {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border: 1px solid rgba(243, 206, 225, .1);
  border-radius: 16px;
  text-align: left;
  color: #f1e5ec;
  background: rgba(255, 255, 255, .022);
  cursor: pointer;
  transition: transform .23s, background .23s, border-color .23s, box-shadow .23s;
}

.companion-starter:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(231, 177, 208, .32);
  background: rgba(210, 155, 194, .07);
  box-shadow: 0 7px 22px rgba(0, 0, 0, .1);
}

.companion-starter:active:not(:disabled) {
  transform: scale(.985);
}

.companion-starter:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.companion-starter-icon {
  flex: 0 0 39px;
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: #edc4da;
  background: linear-gradient(145deg, #493044, #352638);
  font-size: 19px;
  transition: transform .25s;
}

.companion-starter:hover .companion-starter-icon {
  transform: rotate(-5deg) scale(1.06);
}

.companion-starter-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.companion-starter-title {
  font-size: 12px;
  font-weight: 650;
  line-height: 1.5;
}

.companion-starter-caption {
  color: #b49eae;
  font-size: 10px;
  line-height: 1.5;
}

.companion-note {
  margin-top: auto;
  padding: 19px;
  border: 1px solid rgba(228, 178, 205, .13);
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(155, 93, 126, .12), rgba(157, 118, 165, .055));
  position: relative;
  overflow: hidden;
}

.companion-note::after {
  content: "✧";
  position: absolute;
  top: 4px;
  right: 12px;
  color: rgba(241, 194, 218, .1);
  font-size: 65px;
  pointer-events: none;
}

.companion-note-mark {
  margin-bottom: 12px;
  color: #edc2d9;
  font-size: 22px;
}

.companion-note p {
  margin: 0;
  color: #d0bbc9;
  font-size: 12px;
  line-height: 1.95;
}

.companion-note strong {
  color: #f4d9e6;
  font-weight: 650;
}

.companion-reset {
  align-self: flex-start;
  padding: 5px 0;
  border: 0;
  color: #c5a6bd;
  background: transparent;
  font-size: 11px;
  cursor: pointer;
  transition: color .2s;
}

.companion-reset:hover {
  color: #ffe3ef;
}

.companion-reset span {
  margin-right: 7px;
  font-size: 15px;
}

.companion-empty-action {
  display: none;
}

@keyframes lm-shell-in {
  from { opacity: 0; transform: translateY(9px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes lm-welcome-in {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes lm-message-in {
  from { opacity: 0; transform: translateY(12px) scale(.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes lm-orb-breathe {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 28px rgba(211,144,196,.29), 0 0 75px rgba(184,123,181,.14), inset -10px -12px 22px rgba(34,17,39,.42), inset 5px 5px 16px rgba(255,237,249,.23);
  }
  50% {
    transform: scale(1.045);
    box-shadow: 0 0 38px rgba(211,144,196,.36), 0 0 95px rgba(184,123,181,.19), inset -10px -12px 22px rgba(34,17,39,.42), inset 5px 5px 16px rgba(255,237,249,.23);
  }
}

@keyframes lm-halo {
  0%, 100% { transform: scale(.92); opacity: .7; }
  50% { transform: scale(1.1); opacity: 1; }
}

@keyframes lm-orbit {
  to { transform: rotate(360deg); }
}

@keyframes lm-heartbeat {
  0%, 100% { transform: scale(1); }
  8% { transform: scale(1.08); }
  16% { transform: scale(1); }
  24% { transform: scale(1.06); }
  32% { transform: scale(1); }
}

@keyframes lm-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(35px, -24px, 0); }
}

@keyframes lm-twinkle {
  0%, 100% { opacity: .2; transform: scale(.85); }
  50% { opacity: .8; transform: scale(1.15); }
}

@keyframes lm-status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

@keyframes lm-mark-glow {
  0%, 100% { box-shadow: 0 5px 24px rgba(221,161,193,.12); }
  50% { box-shadow: 0 5px 30px rgba(221,161,193,.25); }
}

@keyframes lm-typing {
  0%, 60%, 100% { opacity: .45; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-5px); }
}

@media (min-width: 1400px) {
  .companion-main { grid-template-columns: minmax(0, 1fr) 345px; }
  .companion-side { padding: 39px 27px 28px; }
  .companion-conversation { padding-top: 40px; }
}

@media (max-width: 900px) {
  .companion-page { padding: 15px; }
  .companion-shell { min-height: calc(100vh - 30px); }
  .companion-main { grid-template-columns: minmax(0, 1fr) 275px; }
  .companion-side { padding: 26px 17px; gap: 23px; }
  .companion-starter { padding: 11px; }
  .companion-starter-icon { flex-basis: 34px; width: 34px; height: 34px; }
  .companion-side-title { font-size: 21px; }
}

@media (max-width: 700px) {
  .companion-page { padding: 10px; }
  .companion-shell { border-radius: 22px; min-height: calc(100vh - 20px); }
  .companion-topbar { min-height: 72px; padding: 14px 17px; }
  .companion-brand-mark { width: 40px; height: 40px; flex-basis: 40px; }
  .companion-brand-name { font-size: 17px; }
  .companion-brand-sub { font-size: 9px; letter-spacing: 1.2px; }
  .companion-status { padding: 9px 10px; font-size: 10px; gap: 7px; }
  .companion-main { grid-template-columns: minmax(0, 1fr); }
  .companion-chat { min-height: 570px; border-right: 0; }
  .companion-conversation { padding: 26px 17px 18px; min-height: 350px; }
  .companion-welcome { padding-top: 8px; }
  .companion-orb-stage { transform: scale(.88); margin-top: -8px; margin-bottom: 12px; }
  .companion-welcome h1 { font-size: clamp(28px, 7vw, 36px); letter-spacing: -1.3px; }
  .companion-welcome p { font-size: 13px; }
  .companion-composer-wrap { padding: 14px 14px 18px; }
  .companion-side {
    border-top: 1px solid rgba(244, 211, 224, .09);
    padding: 24px 18px;
    gap: 22px;
  }
  .companion-starter-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .companion-starter { align-items: flex-start; min-height: 91px; }
  .companion-starter-caption { font-size: 10px; }
  .companion-note { margin-top: 0; }
}

@media (max-width: 420px) {
  .companion-page { padding: 6px; }
  .companion-shell { border-radius: 18px; }
  .companion-topbar { padding: 12px; }
  .companion-brand { gap: 9px; }
  .companion-brand-mark { width: 36px; height: 36px; flex-basis: 36px; border-radius: 12px; }
  .companion-brand-name { font-size: 15px; }
  .companion-brand-sub { font-size: 8px; letter-spacing: .8px; }
  .companion-status { font-size: 9px; padding: 8px; }
  .companion-conversation { padding: 23px 12px 15px; }
  .companion-message { max-width: 97%; gap: 7px; }
  .companion-avatar { width: 29px; height: 29px; flex-basis: 29px; border-radius: 10px; }
  .companion-bubble { padding: 12px 13px; font-size: 13px; line-height: 1.8; }
  .companion-starter-list { grid-template-columns: 1fr; }
  .companion-starter { min-height: auto; }
  .companion-side { padding: 22px 14px; }
  .companion-composer { padding-left: 13px; gap: 7px; }
  .companion-composer textarea { font-size: 13px; }
  .companion-send { width: 39px; height: 39px; flex-basis: 39px; }
}

@media (prefers-reduced-motion: reduce) {
  .companion-page *,
  .companion-page *::before,
  .companion-page *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
}
`;

export default function Chatbox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const conversationRef = useRef(null);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    user = {};
  }

  const firstName = (user.name || user.full_name || "").trim().split(" ")[0];
  const email = user.email || "guest";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  async function sendMessage(text = input) {
    const message = text.trim();

    if (!message || loading) return;

    setError("");
    setInput("");
    setMessages((previous) => [
      ...previous,
      { role: "user", text: message },
    ]);
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
            : `LifeMirror couldn't respond (${response.status}). Please try again.`
        );
      }

      if (!data.reply) {
        throw new Error("I couldn't find the right words just now. Please try again.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.reply },
      ]);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "I can't reach LifeMirror right now. Please check that your backend is running."
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

  function startFreshConversation() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <div className="companion-page">
      <style>{styles}</style>

      <div className="companion-ambient" aria-hidden="true">
        <div className="companion-glow one" />
        <div className="companion-glow two" />
        <span className="companion-star" style={{ top: "13%", left: "15%", animationDelay: ".2s" }}>✦</span>
        <span className="companion-star" style={{ top: "35%", right: "9%", animationDelay: "1.5s" }}>✧</span>
        <span className="companion-star" style={{ bottom: "17%", left: "8%", animationDelay: "2.2s" }}>·</span>
      </div>

      <div className="companion-shell">
        <header className="companion-topbar">
          <div className="companion-brand">
            <div className="companion-brand-mark">✧</div>
            <div>
              <div className="companion-brand-name">LifeMirror</div>
              <div className="companion-brand-sub">YOUR LITTLE CORNER OF CALM</div>
            </div>
          </div>

          <div className="companion-status">
            <span className="companion-status-dot" />
            Here with you
          </div>
        </header>

        <div className="companion-main">
          <section className="companion-chat">
            <div className="companion-conversation" ref={conversationRef}>
              {messages.length === 0 ? (
                <div className="companion-welcome">
                  <div className="companion-orb-stage" aria-label="Animated LifeMirror companion">
                    <div className="companion-orb-halo" />
                    <div className="companion-orb-ring" />
                    <div className="companion-orb-ring ring-two" />
                    <div className="companion-orb">
                      <span className="companion-orb-core">✧</span>
                    </div>
                  </div>

                  <div className="companion-eyebrow">
                    A little space just for you
                  </div>

                  <h1>
                    {firstName ? `Hey ${firstName},` : "Hey, you,"}
                    <br />
                    how are you <em>really?</em>
                  </h1>

                  <p>
                    You don't have to pretend everything is okay here.
                    Tell me about your day, your little wins, your worries,
                    or the things you haven't found the words for yet.
                  </p>

                  <div className="companion-welcome-note">
                    <span>♡</span>
                    No judgement. No pressure. Just a little space to talk.
                  </div>
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
                      <div
                        className="companion-avatar"
                        aria-label={
                          message.role === "user" ? "You" : "LifeMirror"
                        }
                      >
                        {message.role === "user" ? "♡" : "✧"}
                      </div>

                      <div className="companion-bubble">
                        {message.text}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="companion-message">
                      <div className="companion-avatar">✧</div>
                      <div
                        className="companion-bubble companion-typing"
                        aria-label="LifeMirror is thinking"
                      >
                        <span />
                        <span />
                        <span />
                        <span className="companion-typing-label">
                          thinking with you
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="companion-composer-wrap">
              {error && (
                <div className="companion-error" role="alert">
                  {error}
                </div>
              )}

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
                  placeholder="I'm listening... what's on your mind?"
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
                Take your time. You don't need to have it all figured out.
                <br />
                LifeMirror is an AI companion, not a replacement for professional support.
              </div>
            </div>
          </section>

          <aside className="companion-side">
            <div>
              <div className="companion-side-heading">
                You can start anywhere
              </div>

              <h2 className="companion-side-title">
                Whatever is on your heart, there's room for it here.
              </h2>

              <p className="companion-side-copy">
                You don't need a perfect explanation. Sometimes, a small
                beginning is all you need.
              </p>
            </div>

            <div>
              <div className="companion-side-heading">
                What feels right today?
              </div>

              <div className="companion-starter-list">
                {starters.map((starter) => (
                  <button
                    type="button"
                    className="companion-starter"
                    key={starter.title}
                    onClick={() => sendMessage(starter.text)}
                    disabled={loading}
                  >
                    <span className="companion-starter-icon">
                      {starter.icon}
                    </span>

                    <span className="companion-starter-content">
                      <span className="companion-starter-title">
                        {starter.title}
                      </span>
                      <span className="companion-starter-caption">
                        A gentle place to begin
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="companion-note">
              <div className="companion-note-mark">☾</div>
              <p>
                A little reminder for you:
                <br />
                <strong>You don't have to be okay every single day.</strong>
                <br />
                You're allowed to pause, feel things, and take life one
                little step at a time.
              </p>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                className="companion-reset"
                onClick={startFreshConversation}
                disabled={loading}
              >
                <span>↺</span>
                Start a fresh conversation
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
