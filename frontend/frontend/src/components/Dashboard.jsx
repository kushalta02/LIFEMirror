import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout, useSessionTimeout } from "../utils";
// import "./Dashboard.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const meta = {
  positive: { label: "Positive", emoji: "☀", color: "#aae1d6" },
  neutral: { label: "Neutral", emoji: "☁", color: "#b9aaff" },
  negative: { label: "Negative", emoji: "🌧", color: "#ff9eac" },
  unknown: { label: "Unclassified", emoji: "✧", color: "#9ba8ad" },
};
const groups = [
  ["YOUR SPACE", [["Overview","⌂","overview"],["Mood timeline","◷","timeline"],["Journal memories","▤","journal"],["AI reflections","✧","insights"]]],
  ["UNDERSTAND YOURSELF", [["Emotion patterns","◉","patterns"],["Personality map","◎","personality"],["Growth goals","↗","goals"]]],
  ["YOUR ECOSYSTEM", [["AI companion","✳","chat"],["Camera mood","◌","camera"],["Health connections","⌁","connections"]]],
];
const getDate = x => { const d = new Date(x?.created_at || x?.createdAt || x?.date || x?.timestamp || x?.updated_at); return Number.isNaN(d.getTime()) ? null : d; };
const mood = x => { const s=String(x?.mood || x?.sentiment || x?.ai_analysis?.mood || x?.analysis?.mood || x?.emotion || "").toLowerCase(); return /positive|happy|joy|good/.test(s) ? "positive" : /negative|sad|stress|angry|anx/.test(s) ? "negative" : /neutral|calm|mixed/.test(s) ? "neutral" : "unknown"; };
const fmt = d => d ? d.toLocaleDateString(undefined,{month:"short",day:"numeric"}) : "—";
const first = s => String(s || "there").trim().split(/\s+/)[0] || "there";

function Chart({ entries, range }) {
  const list = useMemo(() => {
    const cut = range==="7D" ? 7 : range==="30D" ? 30 : Infinity;
    return entries.filter(e => { const d=getDate(e); return d && (Date.now()-d.getTime())/86400000 <= cut; }).slice(-12);
  }, [entries,range]);
  if (!list.length) return <div className="lm-empty"><div className="lm-empty-icon">◷</div><b>Your emotional timeline starts here</b><p>Save journal entries on different days to begin seeing your mood changes. No sample data is being shown.</p></div>;
  const pts=list.map((e,i)=>({x:list.length===1?50:5+i*90/(list.length-1),y:mood(e)==="positive"?24:mood(e)==="negative"?78:mood(e)==="neutral"?51:51,key:mood(e),date:getDate(e)}));
  const path=pts.map((p,i)=>`${i?"L":"M"} ${p.x} ${p.y}`).join(" ");
  return <><div className="lm-legend"><span><i className="mint"/>Positive</span><span><i className="lav"/>Neutral</span><span><i className="rose"/>Negative</span></div><svg className="lm-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Mood history chart">{[24,51,78].map(y=><line key={y} x1="2" x2="98" y1={y} y2={y} className="gridline"/>)}<path d={path} className="chartline"/>{pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2.1" className={`point ${p.key}`}/>)}</svg><div className="lm-chart-dates">{pts.map((p,i)=><span key={i}>{fmt(p.date)}</span>)}</div><small className="lm-note">Based on saved journal entries · Not a clinical assessment</small></>;
}
function Heading({eyebrow,title,desc,action}) { return <div className="lm-heading"><div><small>{eyebrow}</small><h2>{title}</h2>{desc&&<p>{desc}</p>}</div>{action}</div>; }

export default function Dashboard() {
  useSessionTimeout();
  const navigate=useNavigate();
  const [data,setData]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState("");
  const [range,setRange]=useState("7D"), [active,setActive]=useState("overview"), [checks,setChecks]=useState([false,false,false]);
  const [prompt,setPrompt]=useState("What has been taking up the most space in my mind lately?");
  const [modal,setModal]=useState(false), [toast,setToast]=useState("");
  const [showWelcome, setShowWelcome] = useState(
      () => sessionStorage.getItem("lm_welcome_shown") !== "true"
      );

  const user=useMemo(()=>{try{return JSON.parse(localStorage.getItem("user")||"{}")}catch{return{}}},[]);
  const token=sessionStorage.getItem("access_token"), name=user.name||user.full_name||"there";
  useEffect(()=>{let alive=true;(async()=>{if(!user.email){setError("Session details are missing. Please sign in again.");setLoading(false);return;}try{const r=await fetch(`${API_URL}/dashboard/${encodeURIComponent(user.email)}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});if(r.status===401||r.status===403){logout();navigate("/",{replace:true});return;}if(!r.ok)throw new Error(`Dashboard request failed (${r.status}).`);const j=await r.json();if(alive)setData(j);}catch(e){if(alive)setError(e.message||"Could not reach the backend.");}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[navigate,user.email,token]);
  useEffect(() => {
    const nodes = document.querySelectorAll(".hero, .insight-path, .path-step, .metric-grid, .section, .lm-footer");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    nodes.forEach((node) => node.classList.add("lm-scroll-reveal"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("lm-is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const history=useMemo(()=>Array.isArray(data?.history)?data.history:Array.isArray(data?.journals)?data.journals:[],[data]);
  const sorted=useMemo(()=>[...history].sort((a,b)=>(getDate(b)?.getTime()||0)-(getDate(a)?.getTime()||0)),[history]);
  const counts=useMemo(()=>{const c={positive:0,neutral:0,negative:0};history.forEach(e=>{const k=mood(e);if(c[k]!==undefined)c[k]++});return c},[history]);
  const count=counts.positive+counts.neutral+counts.negative;
  const top=count?Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]:"unknown";
  const current=data?.mood&&!["No data","Unknown","unknown"].includes(data.mood)?data.mood:(count?meta[top].label:"Not enough data");
  const traits=Array.isArray(data?.traits)?data.traits:[];
  const personality=data?.personality&&data.personality!=="Unknown"?data.personality:null;
  const insight=data?.ai_insight||data?.insight||data?.reflection||data?.prediction;
  const done=checks.filter(Boolean).length;
  const notify=t=>{setToast(t);window.setTimeout(()=>setToast(""),3600)};
  const jump=id=>{setActive(id);const el=document.getElementById(`lm-${id}`);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});else if(id==="connections")setModal(true);else if(id==="camera")notify("Camera Mood is a planned feature and is not connected yet.");else if(["journal","chat","personality","recommendations"].includes(id))navigate({journal:"/journal",chat:"/chat",personality:"/personality",recommendations:"/recommendations"}[id]);};
  const goChat=()=>navigate("/chat",{state:{prompt}});
  return <div className="lm-app">
    <style>{styles}</style>
        {showWelcome && (
          <div className="lm-welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="lm-welcome-title">
            <div className="lm-welcome-card">
              <div className="lm-welcome-orbit" aria-hidden="true">
                <svg className="lm-welcome-mark" viewBox="0 0 100 100" role="presentation">
                  <path d="M50 15 C37 15 28 25 28 37 C17 39 15 52 22 59 C19 71 29 80 40 78 C45 87 57 87 62 78 C74 80 83 70 78 59 C86 50 80 39 72 37 C72 24 62 15 50 15Z" />
                  <path d="M50 25V75 M31 38C39 40 42 45 42 50 M69 38C61 40 58 45 58 50 M27 60C36 58 42 61 45 68 M73 60C64 58 58 61 55 68 M42 50L50 56L58 50" />
                  <circle cx="50" cy="56" r="4" />
                </svg>
                <span className="lm-orbit-point point-one" />
                <span className="lm-orbit-point point-two" />
              </div>
              <div className="lm-welcome-tag"><span className="lm-welcome-dot" /> LIFEMIRROR / YOUR PERSONAL SPACE</div>
              <h1 id="lm-welcome-title">A moment for you,<br /><span>{first(name)}.</span></h1>
              <p className="lm-welcome-message">Your day is more than a mood or a metric. This is a space to notice what matters, connect the dots, and move forward at your own pace.</p>
              <div className="lm-welcome-divider"><span>YOUR SPACE IS READY</span></div>
              <button className="lm-welcome-enter" onClick={() => {
                sessionStorage.setItem("lm_welcome_shown", "true");
                setShowWelcome(false);
              }}>Open my dashboard <span>→</span></button>
              <small className="lm-welcome-footer">PRIVATE BY DESIGN · BUILT AROUND YOUR REFLECTIONS</small>
            </div>
          </div>
        )}

    <aside className="lm-sidebar"><button className="lm-brand" onClick={()=>jump("overview")}><span className="brand-mark">✿</span><span>Life<span className="mint-text">Mirror</span><small>YOUR INNER WORLD, IN FOCUS</small></span></button>
      <div className="lm-profile"><div className="avatar">{first(name).slice(0,1).toUpperCase()}</div><div><b>{name}</b><small>Personal growth space</small></div><i/></div>
      <nav>{groups.map(([group,items])=><div className="nav-group" key={group}><small className="nav-title">{group}</small>{items.map(([label,icon,id])=><button key={id} className={`nav-item ${active===id?"active":""}`} onClick={()=>jump(id)}><span>{icon}</span>{label}{id==="connections"&&<em>NEW</em>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="quote"><b>“</b><p>You don't have to have it all figured out to take the next gentle step.</p><small>A NOTE TO YOURSELF</small></div><button onClick={()=>notify("Privacy and data controls are being expanded.")}>♧ &nbsp; Privacy & data</button><button className="signout" onClick={()=>{logout();navigate("/",{replace:true})}}>↗ &nbsp; Sign out</button></div>
    </aside>
    <main className="lm-main" id="lm-overview"><header className="lm-topbar"><span>YOUR SPACE <i>/</i> <b>OVERVIEW</b></span><div><label>◷ &nbsp;{new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</label><button onClick={()=>navigate("/chat")}>✳</button><div className="avatar small">{first(name).slice(0,1).toUpperCase()}</div></div></header>
    <div className="lm-content">
      <section className="hero"><div className="hero-copy"><small className="live"><i/> YOUR PERSONAL WELLNESS SPACE</small><h1>A little more <em>you,</em><br/>every day, {first(name)}.</h1><p>A calmer place to notice your patterns, understand your emotions, and grow at your own pace.</p><div className="hero-actions"><button className="primary" onClick={()=>navigate("/journal")}>＋ Write a journal entry <b>↗</b></button><button className="quiet" onClick={()=>navigate("/chat")}>Talk to your AI companion →</button></div></div><div className="hero-art"><div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/><div className="flower">✿</div><span className="spark s1">✦</span><span className="spark s2">✧</span><small>PAUSE　·　NOTICE　·　GROW</small></div><div className="hero-bottom"><span>✧ A gentle reminder</span><b>You are allowed to grow at your own pace.</b><small>01 / YOUR JOURNEY</small></div></section>
      <section className="insight-path" aria-label="How LifeMirror helps you reflect">
        <div className="insight-path-intro">
          <span className="path-kicker">THE LIFEMIRROR METHOD</span>
          <h2>Turn everyday moments<br /><em>into self-understanding.</em></h2>
          <p>Your entries are the starting point. The value comes from noticing patterns over time, with room for your own interpretation.</p>
        </div>
        <div className="path-visual" aria-hidden="true">
          <div className="path-track"><span className="path-track-fill" /></div>
          <div className="path-step path-step-one">
            <div className="path-node"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17"/><path d="M24 11v26M13 19c5 0 8 3 8 7M35 19c-5 0-8 3-8 7M16 31c4-2 7-1 9 3M32 31c-4-2-7-1-9 3"/></svg></div>
            <div><small>01 / NOTICE</small><b>Capture the moment</b><span>Give your thoughts a place to land.</span></div>
          </div>
          <div className="path-step path-step-two">
            <div className="path-node"><svg viewBox="0 0 48 48"><circle cx="15" cy="16" r="5"/><circle cx="33" cy="13" r="4"/><circle cx="29" cy="32" r="6"/><circle cx="12" cy="34" r="3"/><path d="M19 15l10-1M17 20l9 8M15 31l9 1M31 17l-2 9"/></svg></div>
            <div><small>02 / CONNECT</small><b>Find the patterns</b><span>See what repeats across your entries.</span></div>
          </div>
          <div className="path-step path-step-three">
            <div className="path-node"><svg viewBox="0 0 48 48"><path d="M9 35V13M9 35h30M14 29l7-8 6 4 10-13"/><circle cx="14" cy="29" r="2"/><circle cx="21" cy="21" r="2"/><circle cx="27" cy="25" r="2"/><circle cx="37" cy="12" r="2"/></svg></div>
            <div><small>03 / REFLECT</small><b>Choose your next step</b><span>Use insight as a guide, not a label.</span></div>
          </div>
        </div>
      </section>
      {error&&<div className="error"><b>Dashboard connection notice</b><span>{error}</span><button onClick={()=>window.location.reload()}>Try again ↻</button></div>}
      <section className="metric-grid">
        <article className="metric mood-card"><div className="card-top">MOOD CHECK-IN <i className="mint">☼</i></div><h3>{loading?"…":current}</h3><p>{count?`${count} mood-labelled journal ${count===1?"entry":"entries"}`:"Your mood picture appears as you journal."}</p><div className="bar"><i style={{width:count?`${Math.max(12,counts[top]/count*100)}%`:"6%"}}/></div><button onClick={()=>navigate("/journal")}>Add a check-in <b>↗</b></button></article>
        <article className="metric"><div className="card-top">JOURNAL LIBRARY <i className="lav">▤</i></div><h3>{loading?"…":history.length}<small> entries</small></h3><p>Thoughts, moments, and memories you've captured.</p><button onClick={()=>navigate("/journal")}>Explore your journal <b>→</b></button></article>
        <article className="metric"><div className="card-top">PERSONALITY SNAPSHOT <i className="rose">◎</i></div><h3 className="metric-label">{personality||"In discovery"}</h3><p>{personality?"Your saved profile at a glance.":"Complete your profile to explore your traits."}</p><button onClick={()=>navigate("/personality")}>Explore your traits <b>→</b></button></article>
        <article className="metric"><div className="card-top">GROWTH CHECKLIST <i className="blue">↗</i></div><h3>{done}<small> / 3</small></h3><p>Small actions count. Choose what feels manageable.</p><div className="bar"><i style={{width:`${done/3*100}%`}}/></div></article>
      </section>

      <section className="section" id="lm-timeline"><Heading eyebrow="NOTICE THE SHIFTS" title="Your emotional timeline" desc="A journal-led view of how your emotional weather changes over time." action={<div className="range">{["7D","30D","ALL"].map(x=><button key={x} className={range===x?"selected":""} onClick={()=>setRange(x)}>{x}</button>)}</div>}/><div className="two-col timeline"><article className="panel"><div className="panel-title"><div><h3>Mood movement</h3><p>Each point reflects a saved entry, not a guess.</p></div><i>⌁</i></div><Chart entries={sorted} range={range}/></article><article className="panel"><div className="panel-title"><div><h3>Emotion distribution</h3><p>Across your analysed journal entries</p></div><i>◉</i></div>{count?<><div className="donut-row"><div className="donut" style={{"--p":`${counts.positive/count*100}%`,"--n":`${counts.neutral/count*100}%`}}><div><b>{count}</b><small>entries</small></div></div><div className="distribution">{[["positive","Positive","mint"],["neutral","Neutral","lav"],["negative","Negative","rose"]].map(([k,l,c])=><div key={k}><span><i className={c}/>{l}</span><b>{Math.round(counts[k]/count*100)}% <small>({counts[k]})</small></b></div>)}</div></div></>:<div className="empty"><span>◉</span><b>Your patterns need a little data</b><p>Write journal entries. LifeMirror only summarizes moods it can actually see.</p><button onClick={()=>navigate("/journal")}>Write first entry →</button></div>}</article></div></section>

      <section className="section" id="lm-insights"><Heading eyebrow="A MIRROR, NOT A JUDGEMENT" title="Your AI reflection room" desc="Turn your journal history into thoughtful questions and possible patterns." action={<button className="text-link" onClick={()=>navigate("/chat")}>Open AI companion ↗</button>}/><div className="two-col reflection-grid"><article className="reflection"><div className="reflection-symbol">✧</div><small> LIFEMIRROR · REFLECTION</small><h3>{insight&&insight!=="Write journals"?"A thought to carry with you":"Your story is still unfolding"}</h3><p>{loading?"Gathering the details you have shared…":insight&&insight!=="Write journals"?String(insight):"As you add journal entries, this space can help you notice recurring emotions, themes, and possible connections. There is no need to rush the process."}</p><footer><span>✦ Built around your reflections</span><button onClick={()=>navigate("/chat")}>Explore this with AI →</button></footer></article><article className="panel"><div className="panel-title"><div><h3>Start with a question</h3><p>Choose a prompt for a deeper check-in.</p></div><i>✳</i></div><div className="prompts">{["What has been taking up the most space in my mind lately?","What situations seem to affect my mood?","What is one thing I need more of this week?","What pattern should I reflect on in my journal?"].map(q=><button key={q} className={prompt===q?"chosen":""} onClick={()=>setPrompt(q)}>↗ &nbsp; {q}</button>)}</div><button className="primary full" onClick={goChat}>Reflect with AI <b>→</b></button><small className="disclaimer">Supportive prompts, not medical advice.</small></article></div></section>

      <section className="section" id="lm-patterns"><Heading eyebrow="CONNECT THE DOTS" title="Patterns worth noticing" desc="A starting point for self-awareness, based only on data available so far."/><div className="three-col"><article className="panel pattern"><i className="mint">↗</i><small>MOOD SIGNAL</small><h3>{count?`${meta[top].label} appears most often`:"Your mood story is waiting"}</h3><p>{count?`${counts[top]} of ${count} labelled entries fall into this broad category. One mood does not define your whole experience.`:"Add entries across different days to begin seeing your emotional rhythm."}</p><footer>{count?"Calculated from saved entries":"Needs journal data"}</footer></article><article className="panel pattern"><i className="lav">⌁</i><small>RECURRING THEMES</small><h3>What keeps coming back?</h3><p>When journal analysis captures repeated topics, compare themes over time instead of relying on one difficult or great day.</p><button className="text-link" onClick={()=>navigate("/journal")}>Review journal history →</button></article><article className="panel pattern"><i className="rose">♡</i><small>TRIGGERS & SUPPORTS</small><h3>What shifts how you feel?</h3><p>Notice people, routines, rest, or responsibilities around different moods. These are clues to explore, not proof of cause.</p><button className="text-link" onClick={()=>navigate("/chat")}>Explore with AI →</button></article></div></section>

      <section className="section" id="lm-goals"><Heading eyebrow="SMALL STEPS, REAL LIFE" title="Your gentle growth plan" desc="No streak pressure. Pick tiny actions that feel realistic today." action={<span className="pill">{done} of 3 checked</span>}/><div className="two-col goals"><article className="panel goal-panel"><div className="goal-header"><div><small>YOUR DAILY CHECKLIST</small><h3>Make space for yourself</h3></div><div className="goal-ring" style={{"--progress":`${done/3*100}%`}}><b>{Math.round(done/3*100)}%</b></div></div>{[["Take a 2-minute pause","Breathe slowly, unclench your jaw, and notice your surroundings."],["Write one honest paragraph","It doesn't have to sound good. It only has to be yours."],["Name one thing you need","Rest, clarity, support, movement, or simply a little time."]].map(([t,d],i)=><label key={t} className={`goal-row ${checks[i]?"done":""}`}><input type="checkbox" checked={checks[i]} onChange={e=>setChecks(old=>old.map((v,j)=>i===j?e.target.checked:v))}/><span className="check">{checks[i]?"✓":""}</span><span><b>{t}</b><small>{d}</small></span><i>↗</i></label>)}</article><article className="breathing"><div className="breathing-top"><span>PAUSE CORNER</span><b>02:00</b></div><div className="breath-circle"><div><small>BREATHE</small><b>in · out</b></div></div><h3>Come back to this moment.</h3><p>Let your shoulders soften. Feel your feet on the floor. You only need to be here for one breath at a time.</p><button onClick={()=>notify("Try a gentle 4-count inhale and 6-count exhale for a few rounds. This is a grounding suggestion, not a timer.")}>Start a mindful pause →</button></article></div></section>

      <section className="section" id="lm-journal"><Heading eyebrow="YOUR LIFE, IN YOUR WORDS" title="Recent journal memories" desc="Your latest saved reflections, all in one place." action={<button className="text-link" onClick={()=>navigate("/journal")}>Open journal archive ↗</button>}/><div className="recent-list">{sorted.slice(0,4).length?sorted.slice(0,4).map((e,i)=>{const k=mood(e),d=getDate(e),txt=e.text||e.content||e.entry||"Journal entry";return <article className="recent" key={e._id||e.id||i}><div className={`recent-emoji ${k}`}>{meta[k].emoji}</div><div><small>{d?d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"Saved reflection"}　·　{meta[k].label}</small><p>{String(txt).slice(0,190)}{String(txt).length>190?"…":""}</p></div><button onClick={()=>navigate("/journal")}>↗</button></article>}):<div className="journal-empty"><div className="lm-empty-icon">▤</div><div><h3>Your first memory can start small.</h3><p>Capture what happened, how it felt, or one thing you want to remember.</p><button className="primary" onClick={()=>navigate("/journal")}>Write your first entry →</button></div></div>}</div></section>

      <section className="section" id="lm-personality"><Heading eyebrow="GET TO KNOW YOURSELF" title="Personality & inner strengths" desc="Explore tendencies without squeezing yourself into a label." action={<button className="text-link" onClick={()=>navigate("/personality")}>View personality profile ↗</button>}/><div className="two-col personality"><article className="panel personality-intro"><i>◎</i><small>YOUR PERSONALITY MAP</small><h3>{personality||"A work in progress, just like you."}</h3><p>{personality?"Your saved profile can help you reflect on preferences and strengths. It is a snapshot, not a fixed definition of who you are.":"Complete the personality feature to build a richer picture of your preferences, strengths, and ways of responding to the world."}</p><button className="secondary" onClick={()=>navigate("/personality")}>Explore personality →</button></article><article className="panel"><div className="panel-title"><div><h3>Traits & strengths</h3><p>Only saved trait data is shown here.</p></div><i>✧</i></div>{traits.length?traits.slice(0,6).map((t,i)=>{const label=typeof t==="string"?t:(t.name||t.trait||t.label||`Trait ${i+1}`),v=typeof t==="object"?(t.score??t.value??t.level):null;return <div className="trait" key={label}><span>{label}</span><div><i style={{width:typeof v==="number"?`${Math.max(0,Math.min(100,v))}%`:"35%"}}/></div><small>{v??"—"}</small></div>}):<div className="empty compact"><span>◎</span><b>Your trait map isn't available yet</b><p>Take or update the personality assessment to populate this panel.</p><button onClick={()=>navigate("/personality")}>Go to personality →</button></div>}</article></div></section>

      <section className="section" id="lm-connections"><Heading eyebrow="THE BIGGER PICTURE" title="Connect your everyday world" desc="Future-ready connection cards for sleep, movement, and daily routines." action={<span className="pill">Integration preview</span>}/><div className="three-col">{[["⌁","Smartwatch & wearable","Sleep, activity, and heart-rate context may enrich future reflections.","mint"],["♡","Health & wellbeing data","Bring supported wellness measurements into a personal timeline.","rose"],["▦","Calendar & routines","Explore how busy periods may relate to your mood.","lav"]].map(([icon,title,desc,color])=><article className="panel connection" key={title}><i className={color}>{icon}</i><small className="planned">● PLANNED INTEGRATION</small><h3>{title}</h3><p>{desc}</p><button onClick={()=>setModal(true)}>Explore connection →</button></article>)}</div><p className="integration-note">These are roadmap previews, not live integrations. LifeMirror is not currently reading data from a smartwatch, health provider, or calendar.</p></section>

      <section className="section" id="lm-featurehub"><Heading eyebrow="YOUR TOOLKIT" title="Your LifeMirror feature hub" desc="Different ways to reflect, understand, and support yourself."/><div className="feature-grid">{[["▤","Smart journal","Write, search, edit, and revisit your entries.","/journal","Open journal","mint"],["✳","AI companion","Talk through a thought with your AI reflection partner.","/chat","Start a conversation","lav"],["◎","Personality map","Explore traits and personal tendencies.","/personality","Explore traits","rose"],["✧","Personalized recommendations","Discover gentle next steps from available context.","/recommendations","View suggestions","blue"],["◌","Camera mood","A visual check-in concept for a future multimodal flow.","","Coming soon","gold"],["◷","Mood history","Follow your emotional timeline as journal data grows.","#lm-timeline","View timeline","mint"]].map(([icon,title,desc,route,cta,color])=><article className="feature" key={title}><i className={color}>{icon}</i><h3>{title}</h3><p>{desc}</p><button onClick={()=>route.startsWith("#")?jump("timeline"):route?navigate(route):notify("Camera Mood is a planned feature preview; it is not connected yet.")}>{cta} ↗</button></article>)}</div></section>
      <footer className="lm-footer"><div><b>✿ LifeMirror</b><small>MAKE ROOM FOR YOURSELF.</small></div><p>Your inner world deserves curiosity, care, and privacy.</p><nav><button onClick={()=>notify("Privacy controls and account settings are being expanded.")}>Privacy</button><span>·</span><button onClick={()=>navigate("/chat")}>Need a reflection?</button><span>·</span><button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>Back to top ↑</button></nav></footer>
    </div></main>
    {modal&&<div className="modal-backdrop" onClick={()=>setModal(false)}><div className="modal" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setModal(false)}>×</button><div className="modal-symbol">⌁</div><small>CONNECTIONS ROADMAP</small><h2>Your world, connected thoughtfully.</h2><p>Smartwatch, health, and calendar cards are planned features. They are not connected to real accounts yet, and no external data is being collected.</p><div className="modal-points"><span>✓ Clear consent before any future connection</span><span>✓ Show sync status and data source</span><span>✓ Keep unsupported data out of insights</span></div><button className="primary full" onClick={()=>setModal(false)}>Got it →</button></div></div>}
    {toast&&<div className="toast"><span>✧</span>{toast}<button onClick={()=>setToast("")}>×</button></div>}
  </div>;
}


const styles = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{--bg:#0d1014;--panel:#151a20;--line:rgba(226,236,243,.085);--text:#f0f4f4;--muted:#8f9ba5;--mint:#78e4bb;--lav:#b9aaff;--rose:#ff9eac;--blue:#8bc7ff;--gold:#edcf92}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:85px}body{margin:0;background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif}.lm-app{min-height:100vh;display:flex;background:radial-gradient(ellipse at 65% -15%,rgba(100,180,155,.07),transparent 35%),var(--bg)}.lm-app button{font:inherit;cursor:pointer;color:inherit}.lm-sidebar{width:248px;flex:0 0 248px;position:sticky;top:0;height:100vh;overflow:auto;padding:24px 15px 18px;border-right:1px solid var(--line);background:#0d1014f5;display:flex;flex-direction:column;z-index:5}.lm-brand{display:flex;gap:11px;align-items:center;text-align:left;border:0;background:none;padding:0 8px 26px;font:800 19px Manrope;letter-spacing:-.8px}.brand-mark{width:39px;height:39px;display:grid;place-items:center;border:1px solid #6bcfa7;border-radius:14px;color:var(--mint);font-size:24px;background:linear-gradient(145deg,#78e4bb29,#b9aaff12)}.mint-text{color:var(--mint)}.lm-brand small{display:block;font:600 8px 'DM Sans';letter-spacing:1.5px;color:#718078;margin-top:4px}.lm-profile{display:flex;align-items:center;gap:10px;padding:12px 10px;border:1px solid var(--line);border-radius:13px;background:#ffffff05;margin-bottom:26px}.avatar{width:35px;height:35px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(135deg,#9aefd0,#b6a7ff);color:#111c1b;font-weight:800}.lm-profile>div:nth-child(2){display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}.lm-profile b{font-size:12px;overflow:hidden;text-overflow:ellipsis}.lm-profile small{font-size:10px;color:var(--muted)}.lm-profile>i,.live i{width:6px;height:6px;border-radius:50%;background:var(--mint);box-shadow:0 0 10px var(--mint)}.nav-group{margin-bottom:22px}.nav-title,.lm-heading>div>small{display:block;padding:0 10px;margin-bottom:9px;font-size:9px;letter-spacing:1.6px;font-weight:700;color:#77868c}.nav-item{display:flex;align-items:center;gap:12px;width:100%;padding:11px 10px;margin:3px 0;border:1px solid transparent;border-radius:10px;background:none;text-align:left;color:#99a5ad;font-size:12px;transition:.2s}.nav-item>span{width:19px;text-align:center;font-size:16px}.nav-item:hover{background:#ffffff08;color:#eef4f2}.nav-item.active{background:linear-gradient(90deg,#78e4bb1f,#78e4bb05);border-color:#78e4bb20;color:var(--mint)}.nav-item em{margin-left:auto;color:var(--lav);font-size:8px;font-style:normal}.sidebar-bottom{margin-top:auto}.quote{padding:14px;border:1px solid #b9aaff20;border-radius:14px;background:linear-gradient(135deg,#b9aaff13,#78e4bb08)}.quote>b{font:32px Georgia;color:var(--lav)}.quote p{font:500 11px/1.7 Manrope;color:#d2d9db}.quote small{font-size:8px;letter-spacing:1.3px;color:#8b929f}.sidebar-bottom>button{width:100%;text-align:left;padding:12px 10px 2px;background:none;border:0;color:#89969c;font-size:11px}.sidebar-bottom>button.signout{color:#d09ba4;padding-top:13px}.lm-main{min-width:0;flex:1}.lm-topbar{height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,4vw,58px);position:sticky;top:0;background:#0d1014e8;backdrop-filter:blur(18px);z-index:4;font-size:9px;letter-spacing:1.4px;color:#7e8b91}.lm-topbar>span i{padding:0 9px;color:#4c595e;font-style:normal}.lm-topbar>span b{color:#dfe7e6}.lm-topbar>div{display:flex;align-items:center;gap:13px}.lm-topbar label{font-size:10px;letter-spacing:0;color:#a5b0b4;border:1px solid var(--line);padding:9px 12px;border-radius:10px}.lm-topbar button{width:34px;height:34px;border:1px solid var(--line);background:#171d22;border-radius:11px;color:var(--mint);font-size:16px}.avatar.small{width:31px;height:31px;border-radius:10px;font-size:12px}.lm-content{max-width:1600px;margin:auto;padding:30px clamp(18px,4vw,58px) 40px}.hero{position:relative;min-height:335px;padding:38px 42px 0;border:1px solid #78e4bb24;border-radius:23px;overflow:hidden;background:radial-gradient(ellipse at 80% 45%,#75deb71f,transparent 33%),radial-gradient(ellipse at 99% 0%,#b9aaff21,transparent 35%),linear-gradient(120deg,#18221f,#171b23 55%,#1b1b27);animation:rise .6s ease both}.hero:before{content:"";position:absolute;inset:0;background-image:radial-gradient(#dcfff13b .6px,transparent .6px);background-size:18px 18px;opacity:.12;mask-image:linear-gradient(90deg,transparent,#000)}.hero-copy{position:relative;z-index:2;max-width:590px}.live{display:flex;align-items:center;gap:9px;color:var(--mint);font-size:9px;letter-spacing:1.7px;font-weight:700}.hero h1{font:700 clamp(31px,3.5vw,48px)/1.12 Manrope;letter-spacing:-2px;margin:20px 0 13px}.hero h1 em{font-style:normal;color:var(--mint)}.hero-copy>p{max-width:450px;color:#a9b7b7;font-size:13px;line-height:1.75;margin:0}.hero-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:25px}.primary,.secondary{display:inline-flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid var(--mint);border-radius:10px;padding:12px 16px;background:var(--mint);color:#10201a!important;font-size:11px;font-weight:700;transition:.2s}.primary:hover,.secondary:hover{transform:translateY(-2px);box-shadow:0 10px 28px #78e4bb29}.quiet{border:0;background:none;color:#c4cfce!important;font-size:11px;padding:11px 2px}.hero-art{position:absolute;width:310px;height:280px;right:5%;top:9px;display:grid;place-items:center;opacity:.95}.orbit{position:absolute;border:1px solid #78e4bb40;border-radius:50%;transform:rotate(-27deg)}.o1{width:160px;height:225px}.o2{width:225px;height:170px;border-color:#b9aaff40;transform:rotate(40deg)}.o3{width:270px;height:270px;border-style:dashed;border-color:#ffffff20}.flower{width:95px;height:95px;border-radius:50%;display:grid;place-items:center;font-size:56px;color:var(--mint);background:radial-gradient(circle,#78e4bb30,#78e4bb06 70%);border:1px solid #78e4bb4d;box-shadow:0 0 60px #78e4bb1a;animation:float 5s ease-in-out infinite}.spark{position:absolute;color:var(--lav);font-size:25px}.s1{top:29px;right:65px}.s2{bottom:39px;left:52px;color:var(--mint)}.hero-art>small{position:absolute;bottom:0;font-size:8px;letter-spacing:1.3px;color:#8b9998}.hero-bottom{position:relative;z-index:2;margin-top:27px;border-top:1px solid #ffffff17;padding:14px 0;display:flex;align-items:center;gap:12px;font-size:10px;color:#8e9e9b}.hero-bottom>span{color:var(--mint)}.hero-bottom b{font-weight:500;color:#d6e0dc}.hero-bottom>small{margin-left:auto;font-size:8px;letter-spacing:1.3px;color:#64716f}.error{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:18px;padding:14px 17px;border:1px solid #ff9eac40;border-radius:12px;background:#ff9eac0d;font-size:11px;color:#d8c6c8}.error b{color:var(--rose)}.error button{margin-left:auto;border:0;background:none;color:var(--mint)}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:20px}.metric{padding:20px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,#171d23,#14191f);min-height:184px;transition:.25s;animation:rise .6s ease both}.metric:hover,.panel:hover,.feature:hover{transform:translateY(-3px);border-color:#78e4bb38}.card-top{display:flex;align-items:center;justify-content:space-between;color:#85949a;font-size:8px;letter-spacing:1.3px;font-weight:700}.card-top i{width:31px;height:31px;display:grid;place-items:center;border-radius:10px;font-size:17px;font-style:normal}.mint{color:var(--mint)!important;background:#78e4bb1c}.lav{color:var(--lav)!important;background:#b9aaff1c}.rose{color:var(--rose)!important;background:#ff9eac1c}.blue{color:var(--blue)!important;background:#8bc7ff1c}.metric h3{font:700 clamp(20px,2vw,28px) Manrope;letter-spacing:-.8px;margin:17px 0 8px;overflow-wrap:anywhere}.metric h3 small{font:500 11px 'DM Sans';color:#8d9a9e;letter-spacing:0}.metric h3.metric-label{font-size:19px}.metric p{font-size:10px;line-height:1.6;color:#87949b;min-height:32px;margin:8px 0 12px}.metric>button{border:0;background:none;color:#a7b4b5;font-size:10px;padding:11px 0 0;display:flex;justify-content:space-between;width:100%}.metric>button b{color:var(--mint)}.bar{height:3px;background:#293137;border-radius:8px;overflow:hidden}.bar i{display:block;height:100%;border-radius:8px;background:var(--mint);transition:width .5s}.section{margin-top:48px;scroll-margin-top:88px}.lm-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:17px}.lm-heading>div>small{padding:0;margin:0;color:#77868c}.lm-heading h2{font:700 clamp(22px,2.2vw,29px)/1.2 Manrope;letter-spacing:-1px;margin:8px 0 7px}.lm-heading p{font-size:11px;color:#89969c;line-height:1.65;margin:0;max-width:650px}.range{display:flex;gap:3px;padding:4px;background:#171c22;border:1px solid var(--line);border-radius:10px;flex-shrink:0}.range button{border:0;background:none;color:#89969c;font-size:9px;padding:8px 11px;border-radius:7px}.range button.selected{background:#2b3935;color:var(--mint)}.two-col{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(270px,1fr);gap:15px}.three-col{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.panel{min-width:0;padding:22px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,#171c22,#14191f);transition:.25s}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.panel-title h3{font:700 14px Manrope;margin:0 0 7px}.panel-title p{font-size:10px;color:#859198;margin:0;line-height:1.6}.panel-title>i{width:30px;height:30px;display:grid;place-items:center;color:var(--mint);border-radius:9px;background:#78e4bb14;font-size:17px;font-style:normal}.lm-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:9px;color:#a4afb2;margin:22px 0 14px}.lm-legend span,.distribution span{display:flex;align-items:center;gap:7px}.lm-legend i,.distribution i{display:inline-block;width:7px;height:7px;border-radius:50%}.lm-legend i.mint,.distribution i.mint{background:var(--mint)}.lm-legend i.lav,.distribution i.lav{background:var(--lav)}.lm-legend i.rose,.distribution i.rose{background:var(--rose)}.lm-chart{display:block;width:100%;height:170px;overflow:visible}.gridline{stroke:#ffffff17;stroke-dasharray:1 2;stroke-width:.4;vector-effect:non-scaling-stroke}.chartline{fill:none;stroke:var(--mint);stroke-width:1.8;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 4px #78e4bb33)}.point{stroke:#14191f;stroke-width:1.3;vector-effect:non-scaling-stroke}.point.positive{fill:var(--mint)}.point.neutral{fill:var(--lav)}.point.negative{fill:var(--rose)}.lm-chart-dates{display:flex;justify-content:space-between;gap:8px;font-size:8px;color:#7c8a90;margin-top:8px}.lm-note{display:block;margin-top:18px;padding-top:12px;border-top:1px solid var(--line);font-size:9px;color:#68777c}.lm-empty,.empty{min-height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}.lm-empty-icon{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;border:1px solid #78e4bb35;background:#78e4bb0f;color:var(--mint);font-size:22px}.lm-empty>b,.empty>b{font:600 12px Manrope;margin:14px 0 7px}.lm-empty p,.empty p{max-width:290px;color:#849197;font-size:10px;line-height:1.7}.donut-row{display:flex;align-items:center;justify-content:center;gap:22px;padding:28px 0 15px}.donut{width:132px;height:132px;flex:0 0 132px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--mint) 0 var(--p),var(--lav) var(--p) calc(var(--p) + var(--n)),var(--rose) calc(var(--p) + var(--n)) 100%);position:relative}.donut:before{content:"";position:absolute;inset:11px;border-radius:50%;background:#171c22}.donut>div{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px}.donut b{font:700 23px Manrope}.donut small{font-size:9px;color:#8d9a9e}.distribution{flex:1;min-width:100px;display:flex;flex-direction:column;gap:16px}.distribution>div{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:10px;color:#adb8b9}.distribution b{font-size:10px;color:#e0e7e5}.distribution b small{font-weight:400;color:#7f8b91}.empty>span{font-size:25px;color:var(--lav)}.empty>b{margin:10px 0 5px}.empty button{border:0;background:none;color:var(--mint);font-size:10px}.reflection{position:relative;overflow:hidden;border-radius:18px;padding:28px;border:1px solid #b9aaff33;background:radial-gradient(ellipse at 88% 5%,#b9aaff26,transparent 37%),linear-gradient(140deg,#211f2c,#171b22 65%);min-height:285px}.reflection-symbol{width:43px;height:43px;border-radius:14px;display:grid;place-items:center;font-size:24px;color:var(--lav);background:#b9aaff21;border:1px solid #b9aaff30;margin-bottom:22px}.reflection>small{font-size:8px;letter-spacing:1.7px;color:var(--lav);font-weight:700}.reflection h3{font:700 21px Manrope;letter-spacing:-.5px;margin:11px 0}.reflection>p{font-size:12px;line-height:1.85;color:#b3bdc1;max-width:630px;white-space:pre-wrap}.reflection footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-top:1px solid #ffffff15;padding-top:16px;margin-top:20px;font-size:9px;color:#9eabb0}.reflection footer span{color:var(--lav)}.reflection footer button{border:0;background:none;color:#e4defe;font-size:10px}.prompts{display:flex;flex-direction:column;gap:8px;margin:20px 0 15px}.prompts button{display:flex;align-items:flex-start;text-align:left;padding:11px;border:1px solid var(--line);border-radius:10px;background:#ffffff04;font-size:10px;line-height:1.5;color:#aeb9bc;transition:.2s}.prompts button:hover,.prompts button.chosen{border-color:#b9aaff55;background:#b9aaff0f;color:#f0eefe}.full{width:100%}.disclaimer{display:block;color:#68777d;font-size:8px;margin-top:12px}.text-link{border:0;background:none;color:var(--mint);font-size:10px;padding:7px 0}.pattern{min-height:230px}.pattern>i,.connection>i,.feature>i,.personality-intro>i{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;font-size:20px;font-style:normal;margin-bottom:18px}.pattern>small{display:block;font-size:8px;letter-spacing:1.5px;color:#859198}.pattern h3,.connection h3,.feature h3{font:700 14px/1.45 Manrope;margin:9px 0}.pattern p,.connection p,.feature p{font-size:10px;color:#8e9ba0;line-height:1.8}.pattern footer{border-top:1px solid var(--line);padding-top:12px;margin-top:17px;color:#718087;font-size:9px}.pattern .text-link{margin-top:5px}.pill{border:1px solid var(--line);border-radius:8px;padding:8px 11px;color:#9caaa9;font-size:9px;white-space:nowrap}.goals{grid-template-columns:minmax(0,1.3fr) minmax(260px,.7fr)}.goal-panel{padding:25px}.goal-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:19px;border-bottom:1px solid var(--line)}.goal-header>div:first-child>small{font-size:8px;letter-spacing:1.4px;color:var(--mint)}.goal-header h3{font:700 17px Manrope;margin:7px 0 0}.goal-ring{width:57px;height:57px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--mint) var(--progress),#293237 0);position:relative}.goal-ring:before{content:"";position:absolute;inset:5px;background:#171c22;border-radius:50%}.goal-ring b{position:relative;font:700 12px Manrope}.goal-row{display:flex;align-items:center;gap:13px;padding:17px 0;border-bottom:1px solid var(--line);cursor:pointer}.goal-row:last-child{border-bottom:0;padding-bottom:0}.goal-row input{position:absolute;opacity:0;width:1px}.check{width:20px;height:20px;flex:0 0 20px;display:grid;place-items:center;border:1px solid #45524f;border-radius:7px;color:#13221b;font-size:12px}.goal-row.done .check{background:var(--mint);border-color:var(--mint)}.goal-row>span:nth-of-type(2){display:flex;flex-direction:column;gap:5px;flex:1}.goal-row b{font-size:11px;font-weight:600}.goal-row small{font-size:9px;color:#849197;line-height:1.5}.goal-row.done b{text-decoration:line-through;color:#849197}.goal-row>i{color:#718078;font-style:normal}.breathing{border:1px solid #78e4bb29;border-radius:17px;padding:21px;background:radial-gradient(ellipse at 50% 45%,#78e4bb19,transparent 55%),linear-gradient(145deg,#192722,#151d20);display:flex;flex-direction:column;align-items:center;text-align:center}.breathing-top{width:100%;display:flex;justify-content:space-between;font-size:8px;letter-spacing:1.3px;color:#8ca69a}.breathing-top b{color:var(--mint)}.breath-circle{margin:25px 0 14px;width:122px;height:122px;border-radius:50%;border:1px solid #78e4bb4d;display:grid;place-items:center;box-shadow:0 0 0 12px #78e4bb08,0 0 0 24px #78e4bb05;animation:breathe 7s ease-in-out infinite}.breath-circle>div{display:flex;flex-direction:column;gap:6px}.breath-circle small{font-size:8px;letter-spacing:1.5px;color:var(--mint)}.breath-circle b{font:500 13px Manrope}.breathing h3{font:700 16px Manrope;margin:12px 0 7px}.breathing p{font-size:10px;color:#9ba9a8;line-height:1.8;max-width:280px}.breathing button{margin-top:auto;padding:12px 0 0;background:none;border:0;color:var(--mint);font-size:10px}.recent-list{border:1px solid var(--line);border-radius:17px;overflow:hidden;background:#151a20}.recent{display:flex;align-items:center;gap:15px;padding:18px 21px;border-bottom:1px solid var(--line);transition:background .2s}.recent:last-child{border-bottom:0}.recent:hover{background:#ffffff06}.recent-emoji{width:39px;height:39px;flex:0 0 39px;display:grid;place-items:center;border-radius:12px;font-size:17px;background:#b9aaff1a;color:var(--lav)}.recent-emoji.positive{background:#78e4bb1a;color:var(--mint)}.recent-emoji.negative{background:#ff9eac1a;color:var(--rose)}.recent>div:nth-child(2){min-width:0;flex:1}.recent small{font-size:9px;color:#89969c}.recent p{font-size:11px;color:#c3cccd;line-height:1.65;margin:8px 0 0;overflow-wrap:anywhere}.recent>button{width:32px;height:32px;border:1px solid var(--line);background:#1b2228;border-radius:9px;color:var(--mint)}.journal-empty{padding:35px;display:flex;align-items:center;gap:20px}.journal-empty h3{font:700 15px Manrope;margin:0 0 7px}.journal-empty p{font-size:10px;color:#8b999e;margin:0 0 15px}.personality{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}.personality-intro{background:radial-gradient(ellipse at 100% 0,#ff9eac1a,transparent 40%),#171c22}.personality-intro>i{width:47px;height:47px;display:grid;place-items:center;border-radius:15px;color:var(--rose);background:#ff9eac1a;font-size:27px;margin-bottom:21px}.personality-intro>small{font-size:8px;letter-spacing:1.5px;color:#859198}.personality-intro h3{font:700 19px Manrope;margin:10px 0}.personality-intro p{font-size:11px;line-height:1.8;color:#94a0a4}.secondary{background:#ff9eac1a;color:#ffd3d9!important;border-color:#ff9eac40;margin-top:10px}.trait{display:grid;grid-template-columns:minmax(90px,1fr) minmax(70px,1.3fr) 25px;gap:12px;align-items:center;margin-top:22px;font-size:10px;color:#aeb9bc}.trait>div{height:5px;background:#2a3037;border-radius:8px;overflow:hidden}.trait>div>i{display:block;height:100%;background:linear-gradient(90deg,var(--lav),var(--mint));border-radius:8px}.trait small{text-align:right;color:#89969b}.empty.compact{min-height:170px}.connection{position:relative;min-height:225px}.connection>i{margin-bottom:17px}.planned{position:absolute;right:17px;top:20px;font-size:8px;color:#a69b7f}.connection h3{margin:0 0 9px}.connection p{min-height:54px}.connection button{margin-top:10px;border:0;background:none;color:var(--mint);font-size:10px;padding:0}.integration-note{font-size:9px;color:#748187;line-height:1.6;margin-top:12px;padding:12px 14px;border-left:2px solid #edcf9280;background:#edcf9208}.feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.feature{padding:21px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,#171c22,#14191f);transition:.25s;min-height:204px;display:flex;flex-direction:column;align-items:flex-start}.feature>i{margin-bottom:16px}.feature h3{margin:0 0 8px}.feature p{margin:0 0 17px}.feature button{margin-top:auto;background:none;border:0;padding:0;color:var(--mint);font-size:10px}.lm-footer{margin-top:55px;padding:23px 0 5px;border-top:1px solid var(--line);display:flex;align-items:center;gap:20px;flex-wrap:wrap}.lm-footer>div{display:flex;align-items:center;gap:8px}.lm-footer>div b{font:800 13px Manrope;color:var(--mint)}.lm-footer>div small{font-size:7px;letter-spacing:1px;color:#6f7d82;margin-left:5px}.lm-footer>p{margin:0 auto;color:#7d898f;font-size:9px}.lm-footer nav{display:flex;gap:10px;align-items:center}.lm-footer nav button{border:0;background:none;padding:0;color:#8b979c;font-size:9px}.modal-backdrop{position:fixed;inset:0;z-index:20;background:#040709b8;backdrop-filter:blur(9px);display:grid;place-items:center;padding:20px}.modal{width:min(480px,100%);position:relative;border:1px solid #78e4bb38;border-radius:21px;background:#171d23;padding:31px;box-shadow:0 25px 100px #0008;animation:rise .25s ease}.modal-close{position:absolute;right:17px;top:13px;border:0;background:none;color:#aab4b6;font-size:25px}.modal-symbol{width:47px;height:47px;border-radius:14px;display:grid;place-items:center;background:#78e4bb1a;color:var(--mint);font-size:25px;margin-bottom:19px}.modal>small{font-size:9px;letter-spacing:1.6px;color:#7c9c8f}.modal h2{font:700 23px/1.3 Manrope;margin:10px 0}.modal p{font-size:11px;line-height:1.9;color:#a3afb2}.modal-points{display:flex;flex-direction:column;gap:11px;padding:17px 0 21px;font-size:10px;color:#c3cecb}.modal-points span:before{content:"✧";color:var(--mint);margin-right:9px}.toast{position:fixed;z-index:30;bottom:22px;right:24px;max-width:min(430px,calc(100vw - 35px));display:flex;align-items:center;gap:10px;border:1px solid #78e4bb38;border-radius:13px;padding:13px 15px;background:#202a2a;box-shadow:0 15px 55px #0008;font-size:11px;line-height:1.6;color:#dce7e3;animation:rise .25s ease}.toast>span{color:var(--mint)}.toast button{border:0;background:none;color:#9aa8a8;font-size:18px;margin-left:5px}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes float{50%{transform:translateY(-7px) rotate(4deg)}}@keyframes breathe{0%,100%{transform:scale(.94);box-shadow:0 0 0 9px #78e4bb08,0 0 0 19px #78e4bb05}50%{transform:scale(1.05);box-shadow:0 0 0 15px #78e4bb0a,0 0 0 29px #78e4bb06}}@media(max-width:1200px){.lm-sidebar{width:220px;flex-basis:220px}.hero-art{right:1%;transform:scale(.85)}.hero-copy{max-width:55%}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.donut-row{gap:13px}.donut{width:105px;height:105px;flex-basis:105px}}@media(max-width:900px){.lm-sidebar{width:70px;flex-basis:70px;padding:20px 8px}.lm-brand{justify-content:center;padding:0 0 25px}.lm-brand>span:last-child,.lm-profile>div:nth-child(2),.lm-profile>i,.nav-title,.nav-item{font-size:0}.lm-profile{justify-content:center;padding:8px 0;border:0;background:none;margin-bottom:22px}.nav-item{justify-content:center;padding:12px 0}.nav-item>span{font-size:18px}.nav-item em,.sidebar-bottom{display:none}.lm-topbar{padding:0 22px}.lm-content{padding:22px}.hero-art{right:-45px;opacity:.48}.hero-copy{max-width:75%}.two-col,.goals,.personality{grid-template-columns:1fr}.three-col{grid-template-columns:1fr 1fr}.three-col>.pattern:last-child{grid-column:span 2}.breathing{min-height:340px}}@media(max-width:580px){.lm-sidebar{display:none}.lm-topbar{height:59px;padding:0 15px}.lm-topbar{font-size:8px}.lm-topbar label{display:none}.lm-content{padding:16px 13px 28px}.hero{padding:27px 22px 0;min-height:370px;border-radius:18px}.hero h1{font-size:35px;letter-spacing:-1.5px}.hero-copy{max-width:100%}.hero-copy>p{max-width:310px;font-size:12px}.hero-art{right:-130px;top:60px;opacity:.2}.hero-bottom{gap:7px;align-items:flex-start;flex-wrap:wrap}.hero-bottom>small{display:none}.hero-bottom b{font-size:9px}.metric-grid{grid-template-columns:1fr 1fr;gap:9px}.metric{padding:15px 13px;min-height:175px}.card-top{font-size:7px;letter-spacing:.7px}.metric h3{font-size:20px}.metric p{font-size:9px}.section{margin-top:36px}.lm-heading{align-items:flex-start;flex-direction:column;gap:12px}.lm-heading h2{font-size:24px}.lm-heading p{font-size:10px}.range{align-self:flex-end;margin-top:-3px}.panel{padding:17px}.donut-row{flex-direction:column;gap:20px}.distribution{width:100%}.reflection{padding:22px}.reflection h3{font-size:19px}.three-col,.feature-grid{grid-template-columns:1fr}.three-col>.pattern:last-child{grid-column:auto}.pattern{min-height:0}.goal-panel{padding:18px}.goal-row small{font-size:9px}.recent{padding:14px 12px;gap:10px}.recent-emoji{width:32px;height:32px;flex-basis:32px}.recent p{font-size:10px}.recent small{font-size:8px}.journal-empty{padding:22px;align-items:flex-start;flex-direction:column}.trait{grid-template-columns:minmax(75px,1fr) minmax(55px,1fr) 20px;gap:8px}.planned{position:static;display:block;margin:-5px 0 12px}.connection{min-height:0}.connection p{min-height:0}.lm-footer{gap:13px;margin-top:40px}.lm-footer>p{width:100%;order:3;line-height:1.6}.lm-footer nav{margin-left:auto}.lm-footer>div small{display:none}.modal{padding:25px}.toast{right:12px;bottom:12px}.lm-chart-dates{font-size:7px}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
.lm-welcome-overlay {
position: fixed;
inset: 0;
z-index: 1000;
display: grid;
place-items: center;
padding: 22px;
overflow: hidden;
isolation: isolate;
background:
radial-gradient(ellipse at 50% 42%, #78e4bb16, transparent 42%),
rgba(5, 8, 11, 0.88);
backdrop-filter: blur(18px);
-webkit-backdrop-filter: blur(18px);
animation: lmWelcomeFadeIn 0.45s ease both;
}

.lm-welcome-card {
position: relative;
z-index: 2;
width: min(510px, 100%);
padding: 38px 36px 30px;
overflow: hidden;
text-align: center;
border: 1px solid #78e4bb42;
border-radius: 28px;
background:
radial-gradient(ellipse at 50% 0%, #78e4bb12, transparent 45%),
linear-gradient(145deg, #1a2225, #12171d 72%);
box-shadow:
0 35px 110px #0009,
0 0 55px #78e4bb0d,
inset 0 1px #ffffff0b;
animation: lmWelcomeCardIn 0.75s cubic-bezier(.2,.8,.2,1) both;
}

.lm-welcome-card::before {
content: "";
position: absolute;
inset: 0;
pointer-events: none;
border-radius: inherit;
background-image: radial-gradient(#ffffff16 0.6px, transparent 0.6px);
background-size: 19px 19px;
opacity: 0.2;
mask-image: linear-gradient(#000, transparent 75%);
}

.lm-welcome-orbit {
position: relative;
width: 116px;
height: 116px;
margin: 0 auto 24px;
display: grid;
place-items: center;
border: 1px solid #78e4bb36;
border-radius: 50%;
animation: lmWelcomeOrbit 18s linear infinite;
}

.lm-welcome-orbit::before,
.lm-welcome-orbit::after {
content: "";
position: absolute;
border: 1px solid #b9aaff30;
border-radius: 50%;
}

.lm-welcome-orbit::before {
inset: 9px -9px;
transform: rotate(35deg);
}

.lm-welcome-orbit::after {
inset: -8px 13px;
transform: rotate(-38deg);
border-color: #78e4bb25;
}

.lm-welcome-flower {
display: grid;
place-items: center;
width: 76px;
height: 76px;
border: 1px solid #78e4bb50;
border-radius: 50%;
color: #9cf0ce;
font-size: 49px;
background: radial-gradient(circle, #78e4bb25, #78e4bb06 75%);
box-shadow: 0 0 38px #78e4bb18;
animation: lmWelcomeFlowerFloat 3.5s ease-in-out infinite;
}

.lm-welcome-spark {
position: absolute;
z-index: 2;
font-size: 22px;
animation: lmWelcomeTwinkle 2s ease-in-out infinite;
}

.lm-welcome-spark.spark-a {
top: 0;
right: 3px;
color: #b9aaff;
}

.lm-welcome-spark.spark-b {
bottom: 5px;
left: 0;
color: #78e4bb;
animation-delay: 0.6s;
}

.lm-welcome-spark.spark-c {
top: 12px;
left: 0;
color: #ffb4c0;
animation-delay: 1s;
}

.lm-welcome-tag {
display: flex;
align-items: center;
justify-content: center;
gap: 9px;
margin-bottom: 19px;
color: #8fdcc0;
font-size: 9px;
font-weight: 700;
letter-spacing: 2px;
}

.lm-welcome-dot {
width: 6px;
height: 6px;
flex: 0 0 6px;
border-radius: 50%;
background: #78e4bb;
box-shadow: 0 0 12px #78e4bb;
}

.lm-welcome-card h1 {
position: relative;
margin: 0;
color: #f0f4f4;
font: 700 clamp(32px, 6vw, 43px)/1.2 Manrope, sans-serif;
letter-spacing: -1.8px;
}

.lm-welcome-card h1 span {
display: inline-block;
padding-top: 3px;
color: #91ebc6;
background: linear-gradient(100deg, #a5f0d1, #b9aaff);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
}

.lm-welcome-message {
position: relative;
margin: 19px 0 0;
color: #b1bdbd;
font-size: 12px;
line-height: 1.9;
}

.lm-welcome-divider {
display: flex;
align-items: center;
gap: 13px;
margin: 24px 0 17px;
color: #78e4bb;
}

.lm-welcome-divider::before,
.lm-welcome-divider::after {
content: "";
height: 1px;
flex: 1;
background: linear-gradient(90deg, transparent, #78e4bb35);
}

.lm-welcome-divider::after {
background: linear-gradient(90deg, #78e4bb35, transparent);
}

.lm-welcome-subtitle {
margin: 0 0 24px;
color: #899a9a;
font-size: 10px;
line-height: 1.7;
letter-spacing: 0.3px;
}

.lm-welcome-enter {
position: relative;
display: flex;
align-items: center;
justify-content: center;
gap: 25px;
width: 100%;
min-height: 49px;
padding: 13px 20px;
border: 1px solid #a0f0d0;
border-radius: 12px;
background: linear-gradient(110deg, #a0edce, #78e4bb);
color: #10211a !important;
font-size: 12px !important;
font-weight: 700 !important;
box-shadow: 0 8px 27px #78e4bb19;
transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.lm-welcome-enter:hover {
transform: translateY(-2px);
box-shadow: 0 12px 35px #78e4bb35;
}

.lm-welcome-enter span {
font-size: 19px;
transition: transform 0.2s ease;
}

.lm-welcome-enter:hover span {
transform: translateX(4px);
}

.lm-welcome-footer {
display: block;
margin-top: 22px;
color: #657773;
font-size: 8px;
letter-spacing: 1.5px;
}

.lm-welcome-particles {
position: absolute;
inset: 0;
z-index: 1;
overflow: hidden;
pointer-events: none;
}

.lm-particle {
position: absolute;
color: #9be9cb;
opacity: 0;
animation: lmParticleFloat 5s ease-in-out infinite;
filter: drop-shadow(0 0 8px #78e4bb35);
}

.lm-particle-1 { left: 12%; top: 17%; font-size: 23px; animation-delay: 0s; }
.lm-particle-2 { left: 22%; top: 72%; font-size: 20px; animation-delay: 1s; }
.lm-particle-3 { left: 79%; top: 20%; font-size: 25px; color: #ffadbf; animation-delay: 0.6s; }
.lm-particle-4 { left: 86%; top: 70%; font-size: 25px; animation-delay: 1.5s; }
.lm-particle-5 { left: 8%; top: 49%; font-size: 20px; color: #edcf92; animation-delay: 2s; }
.lm-particle-6 { left: 73%; top: 83%; font-size: 23px; animation-delay: 0.4s; }
.lm-particle-7 { left: 89%; top: 43%; font-size: 25px; animation-delay: 1.2s; }
.lm-particle-8 { left: 15%; top: 83%; font-size: 19px; animation-delay: 2.4s; }
.lm-particle-9 { left: 28%; top: 12%; font-size: 23px; animation-delay: 1.7s; }
.lm-particle-10 { left: 68%; top: 13%; font-size: 21px; animation-delay: 0.8s; }

@keyframes lmWelcomeFadeIn {
from { opacity: 0; }
to { opacity: 1; }
}

@keyframes lmWelcomeCardIn {
from { opacity: 0; transform: translateY(24px) scale(0.94); }
to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes lmWelcomeOrbit {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}

@keyframes lmWelcomeFlowerFloat {
0%, 100% { transform: translateY(0) scale(1); }
50% { transform: translateY(-5px) scale(1.04); }
}

@keyframes lmWelcomeTwinkle {
0%, 100% { opacity: 0.55; transform: scale(0.85); }
50% { opacity: 1; transform: scale(1.2); }
}

@keyframes lmParticleFloat {
0% { opacity: 0; transform: translateY(15px) rotate(-12deg) scale(0.7); }
25% { opacity: 0.85; }
65% { opacity: 0.65; transform: translateY(-22px) rotate(12deg) scale(1); }
100% { opacity: 0; transform: translateY(-42px) rotate(-8deg) scale(0.8); }
}

@media (max-width: 580px) {
.lm-welcome-card {
padding: 30px 22px 24px;
border-radius: 23px;
}

.lm-welcome-orbit {
width: 100px;
height: 100px;
margin-bottom: 22px;
}

.lm-welcome-flower {
width: 66px;
height: 66px;
font-size: 43px;
}

.lm-welcome-tag {
font-size: 8px;
letter-spacing: 1.4px;
}

.lm-welcome-message {
font-size: 11px;
}

.lm-welcome-particles {
opacity: 0.65;
}
}

@media (prefers-reduced-motion: reduce) {
.lm-welcome-overlay,
.lm-welcome-card,
.lm-welcome-orbit,
.lm-welcome-flower,
.lm-welcome-spark,
.lm-particle {
animation: none !important;
}

.lm-welcome-enter {
transition: none !important;
}
}
/* LifeMirror visual refresh: calm editorial layout, restrained motion, product-grade hierarchy */
:root{--bg:#f5f5f0;--panel:#fffefa;--line:#e5e8df;--text:#202d27;--muted:#6e7b72;--mint:#397a5b;--lav:#7870a7;--rose:#b96b75;--blue:#527f9b;--gold:#a9854c}
html{scroll-padding-top:90px;background:var(--bg)}body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif}
.lm-app{background:linear-gradient(180deg,#f8f8f3 0%,#f3f4ee 100%);color:var(--text)}
.lm-sidebar{background:rgba(255,254,250,.94);border-right:1px solid #e4e7de;box-shadow:4px 0 24px #1b2b1e05}
.lm-brand{color:#20372b}.brand-mark{border:1px solid #c6d8c8;border-radius:12px;color:#397a5b;background:#edf4ec}.mint-text{color:#397a5b}.lm-brand small,.nav-title{color:#829087}
.lm-profile{background:#f6f7f1;border-color:#e7e9e1}.avatar{background:linear-gradient(140deg,#d8e9d8,#c7d8cb);color:#244a35}.lm-profile b{color:#26372d}.lm-profile small{color:#77847a}
.nav-item{color:#6b786e;border-radius:9px}.nav-item:hover{background:#f0f3ec;color:#263b2e}.nav-item.active{background:#eaf2e8;border-color:#dce8d9;color:#286446}
.sidebar-bottom .quote{background:linear-gradient(135deg,#f0f4e9,#f7f4ec);border-color:#e0e7d9}.quote>b{color:#679074}.quote p{color:#4f6055}.quote small{color:#819084}.sidebar-bottom>button{color:#6b786e}.sidebar-bottom>button.signout{color:#a05e65}
.lm-topbar{background:#fbfbf7e8;border-bottom:1px solid #e6e8e0;color:#849087;backdrop-filter:blur(18px)}.lm-topbar>span b{color:#3c4b40}.lm-topbar>span i{color:#b5bdb4}.lm-topbar label{border-color:#e4e8df;color:#69786d;background:#fffefa}.lm-topbar button{background:#edf3ea;border-color:#dce6d8;color:#397a5b}
.hero{border-color:#d9e5d8;border-radius:24px;background:radial-gradient(ellipse at 83% 25%,#d6e8d7 0%,transparent 35%),linear-gradient(112deg,#edf3e9 0%,#f5f4ec 55%,#eeefe5 100%);box-shadow:0 16px 40px #243c2608;animation:lmHeroEnter .7s cubic-bezier(.2,.7,.2,1) both}.hero:before{background-image:radial-gradient(#718a7230 .6px,transparent .6px);opacity:.26}
.live{color:#397a5b}.live i{background:#5c9870;box-shadow:0 0 0 4px #5c987018}.hero h1{color:#20372b;letter-spacing:-1.8px}.hero h1 em{color:#397a5b}.hero-copy>p{color:#65746a}
.hero-art{opacity:.8}.orbit{border-color:#9ebba04f}.o2{border-color:#b2a9cf70}.o3{border-color:#80998242}.flower{color:#397a5b;background:radial-gradient(circle,#b8d6b7 0%,#dce9d6 65%,#e7eee0 100%);border-color:#b4cdb5;box-shadow:0 8px 30px #41694c12}.spark{color:#8b81b1}.s2{color:#397a5b}.hero-art>small{color:#718575}
.hero-bottom{border-color:#d5dfd1;color:#758276}.hero-bottom>span{color:#397a5b}.hero-bottom b{color:#42564a}.hero-bottom>small{color:#88958a}
.primary{background:#2f684a;border-color:#2f684a;color:#fff!important;border-radius:9px;box-shadow:0 5px 14px #2f684a12}.primary:hover{background:#24563c;box-shadow:0 10px 25px #2f684a22}.quiet{color:#45604d!important}
.metric-grid{gap:14px}.metric,.panel,.feature{background:#fffefa;border:1px solid #e4e7df;box-shadow:0 4px 18px #23362704}.metric{border-radius:14px;min-height:175px}.metric:hover,.panel:hover,.feature:hover{transform:translateY(-2px);border-color:#bfd3bf;box-shadow:0 10px 25px #23362709}
.card-top{color:#77847a}.card-top i{border-radius:9px}.mint{color:#397a5b!important;background:#e7f1e5}.lav{color:#7770a5!important;background:#eeebf8}.rose{color:#b96b75!important;background:#f8e9eb}.blue{color:#527f9b!important;background:#e8f0f5}
.metric h3{color:#26372d}.metric h3 small{color:#77847a}.metric p{color:#758177}.metric>button{color:#617267}.metric>button b{color:#397a5b}.bar{background:#e7ebe3}.bar i{background:linear-gradient(90deg,#397a5b,#7da885)}
.section{margin-top:46px}.lm-heading>div>small{color:#64816a;letter-spacing:1.8px}.lm-heading h2{color:#25372c;letter-spacing:-.9px}.lm-heading p{color:#758177}
.range{background:#eeefe8;border-color:#e0e5db}.range button{color:#758177}.range button.selected{background:#fffefa;color:#2f684a;box-shadow:0 1px 5px #243c260e}
.panel{border-radius:15px}.panel-title h3{color:#2c3d31}.panel-title p{color:#7a867d}.panel-title>i{background:#edf3e9;color:#397a5b}
.lm-legend{color:#718075}.lm-chart{height:180px}.gridline{stroke:#dfe5dc;stroke-dasharray:2 3}.chartline{stroke:#397a5b;filter:none;stroke-width:1.5}.point{stroke:#fffefa;stroke-width:1.6}.point.positive{fill:#397a5b}.point.neutral{fill:#8d83b7}.point.negative{fill:#c27780}.lm-chart-dates{color:#879188}.lm-note{border-color:#e5e8df;color:#7f8b81}
.lm-empty-icon{border-color:#d7e5d5;background:#edf4e9;color:#397a5b}.lm-empty>b,.empty>b{color:#35483a}.lm-empty p,.empty p{color:#7a867d}
.donut{background:conic-gradient(#397a5b 0 var(--p),#aaa2d0 var(--p) calc(var(--p) + var(--n)),#d9949c calc(var(--p) + var(--n)) 100%)}.donut:before{background:#fffefa}.donut b{color:#2b3d31}.donut small{color:#7b877d}.distribution{color:#6f7e72}.distribution>div{color:#68776b}.distribution b{color:#34473a}.distribution b small{color:#879187}
.reflection{border-color:#e0dced;background:radial-gradient(ellipse at 90% 0%,#e7e3f4 0%,transparent 42%),linear-gradient(135deg,#f5f2fa,#fffefa 70%);min-height:285px}.reflection-symbol{background:#ebe7f5;border-color:#e0d9f0;color:#786fa8}.reflection>small{color:#7b72a9}.reflection h3{color:#29392f}.reflection>p{color:#66756a}.reflection footer{border-color:#e6e3ed;color:#7a857b}.reflection footer span{color:#7770a5}.reflection footer button{color:#5c5585}
.prompts button{border-color:#e4e7df;background:#fbfbf7;color:#67756b;border-radius:9px}.prompts button:hover,.prompts button.chosen{border-color:#cfc7e7;background:#f4f1fa;color:#5f578d}.disclaimer{color:#879187}.text-link{color:#397a5b}
.pattern>small{color:#7d897f}.pattern h3,.connection h3,.feature h3{color:#2d4033}.pattern p,.connection p,.feature p{color:#758177}.pattern footer{border-color:#e5e8df;color:#879187}.pill{border-color:#e1e6dc;color:#6e7d70;background:#f8f9f4}
.goal-panel{padding:25px}.goal-header{border-color:#e4e8df}.goal-header>div:first-child>small{color:#397a5b}.goal-header h3{color:#2c3e31}.goal-ring{background:conic-gradient(#397a5b var(--progress),#e5e9e1 0)}.goal-ring:before{background:#fffefa}.goal-ring b{color:#2c3e31}
.goal-row{border-color:#e9ece5}.check{border-color:#cdd8ca;color:#fff}.goal-row.done .check{background:#397a5b;border-color:#397a5b}.goal-row b{color:#35473a}.goal-row small{color:#7c887e}.goal-row.done b{color:#8a958b}.goal-row>i{color:#849187}
.breathing{border-color:#d7e5d5;background:radial-gradient(ellipse at 50% 42%,#dcebd9,transparent 58%),linear-gradient(145deg,#edf4e9,#f8f8f2)}.breathing-top{color:#738879}.breathing-top b{color:#397a5b}.breath-circle{border-color:#8eb493;box-shadow:0 0 0 12px #6e9d7010,0 0 0 24px #6e9d7008}.breath-circle small{color:#397a5b}.breath-circle b{color:#314737}.breathing h3{color:#2d4033}.breathing p{color:#718075}.breathing button{color:#397a5b}
.recent-list{border-color:#e4e7df;background:#fffefa;border-radius:14px}.recent{border-color:#e7eae3}.recent:hover{background:#f8f9f4}.recent-emoji{background:#eeebf8;color:#7770a5}.recent-emoji.positive{background:#e7f1e5;color:#397a5b}.recent-emoji.negative{background:#f8e9eb;color:#b96b75}.recent small{color:#7c887d}.recent p{color:#46584b}.recent>button{border-color:#e1e6dc;background:#f6f8f2;color:#397a5b}
.personality-intro{background:radial-gradient(ellipse at 100% 0,#f6e8e9 0%,transparent 42%),#fffefa}.personality-intro>i{color:#b96b75;background:#f8e9eb}.personality-intro>small{color:#7c887d}.personality-intro h3{color:#2d4033}.personality-intro p{color:#738075}
.secondary{background:#f8e9eb;color:#8c4e57!important;border-color:#f0d8dc}.trait{color:#66756a}.trait>div{background:#e8ece5}.trait>div>i{background:linear-gradient(90deg,#aaa1ce,#6d9a77)}.trait small{color:#7f8b81}
.connection{min-height:225px}.planned{color:#8a7c5d}.integration-note{color:#7e887e;border-color:#c3a66d;background:#f8f4e9}.feature{min-height:204px}.feature-grid{gap:14px}
.lm-footer{border-color:#e2e7dd}.lm-footer>div b{color:#397a5b}.lm-footer>div small{color:#829084}.lm-footer>p{color:#7b877d}.lm-footer nav button{color:#728075}
.error{border-color:#eed1d3;background:#fbf0f0;color:#7f6568}.error b{color:#a35c64}.error button{color:#397a5b}
.modal-backdrop{background:#1e2c22a8;backdrop-filter:blur(8px)}.modal{border-color:#d7e5d5;background:#fffefa;box-shadow:0 25px 100px #1c2a1d25}.modal-close{color:#728075}.modal-symbol{background:#edf4e9;color:#397a5b}.modal>small{color:#66816a}.modal h2{color:#293d30}.modal p{color:#6f7e72}.modal-points{color:#4e6253}.modal-points span:before{color:#397a5b}
.toast{border-color:#d6e4d4;background:#fffefa;box-shadow:0 15px 45px #1c2a1d16;color:#35483a}.toast>span{color:#397a5b}.toast button{color:#7c887e}
.lm-welcome-overlay{background:rgba(24,39,29,.56);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);padding:22px}
.lm-welcome-card{width:min(490px,100%);padding:40px 42px 32px;border:1px solid #d9e5d6;border-radius:24px;background:linear-gradient(145deg,#fffefa,#f2f5ec);box-shadow:0 35px 100px #17281d35,inset 0 1px #ffffff;animation:lmWelcomeCardIn .65s cubic-bezier(.2,.8,.2,1) both}
.lm-welcome-card:before{background-image:radial-gradient(#688b6a16 .6px,transparent .6px);opacity:.25}.lm-welcome-orbit{width:120px;height:120px;margin:0 auto 25px;border-color:#b7cfb4;animation:lmWelcomeOrbit 30s linear infinite}.lm-welcome-orbit:before{border-color:#d1c9e6}.lm-welcome-orbit:after{border-color:#c5d8c0}
.lm-welcome-mark{width:66px;height:66px;fill:none;stroke:#397a5b;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 4px 12px #397a5b18)}
.lm-orbit-point{position:absolute;width:7px;height:7px;border-radius:50%;background:#6d9a77;box-shadow:0 0 0 5px #6d9a7718}.point-one{top:12px;right:12px}.point-two{bottom:13px;left:12px;background:#9589bd;box-shadow:0 0 0 5px #9589bd18}
.lm-welcome-tag{color:#597b5e;font-size:8px;letter-spacing:1.6px;margin-bottom:18px}.lm-welcome-dot{background:#5d9569;box-shadow:0 0 0 4px #5d95691b}
.lm-welcome-card h1{color:#26392c;font-size:clamp(31px,5vw,39px);letter-spacing:-1.5px}.lm-welcome-card h1 span{background:linear-gradient(100deg,#397a5b,#7b72a8);-webkit-background-clip:text;background-clip:text}
.lm-welcome-message{color:#6a796d;font-size:12px;line-height:1.9;max-width:365px;margin:18px auto 0}.lm-welcome-divider{margin:23px 0 22px;color:#8b9587;font-size:8px;letter-spacing:1.6px}.lm-welcome-divider:before,.lm-welcome-divider:after{background:linear-gradient(90deg,transparent,#d6dfd1)}.lm-welcome-divider:after{background:linear-gradient(90deg,#d6dfd1,transparent)}
.lm-welcome-enter{min-height:49px;border-color:#2f684a;background:#2f684a;color:#fff!important;border-radius:9px;box-shadow:0 7px 20px #2f684a18}.lm-welcome-enter:hover{box-shadow:0 12px 26px #2f684a25}.lm-welcome-footer{color:#8b9689;font-size:7px;letter-spacing:1.35px;margin-top:21px}
.insight-path{position:relative;display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:clamp(24px,5vw,70px);align-items:center;margin:24px 0 5px;padding:27px 30px;border:1px solid #e1e7dc;border-radius:18px;background:linear-gradient(110deg,#fffefa,#f1f5ec);overflow:hidden}
.insight-path:before{content:"";position:absolute;width:270px;height:270px;right:-100px;top:-150px;border-radius:50%;border:1px solid #dce7d7;box-shadow:0 0 0 24px #dce7d71a,0 0 0 48px #dce7d712;pointer-events:none}
.path-kicker{font-size:8px;font-weight:700;letter-spacing:1.8px;color:#64816a}.insight-path-intro h2{margin:11px 0 10px;font:700 clamp(21px,2.3vw,29px)/1.22 Manrope;letter-spacing:-1px;color:#26392c}.insight-path-intro h2 em{font-style:normal;color:#397a5b}.insight-path-intro p{max-width:400px;margin:0;color:#758177;font-size:11px;line-height:1.8}
.path-visual{position:relative;display:flex;flex-direction:column;gap:13px;padding:2px 0}.path-track{position:absolute;top:25px;bottom:25px;left:22px;width:1px;background:#d9e4d5}.path-track-fill{display:block;width:100%;height:100%;transform-origin:top;transform:scaleY(.7);background:linear-gradient(#6c9b73,#b7c9b1)}
.path-step{position:relative;display:flex;align-items:center;gap:14px;padding:8px 10px;border-radius:12px;transition:background .25s,transform .35s}.path-step:hover{background:#f6f8f2;transform:translateX(3px)}.path-node{position:relative;z-index:1;width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;border:1px solid #dce7d8;border-radius:13px;background:#fffefa;box-shadow:0 3px 10px #2d4a2f08}.path-node svg{width:28px;height:28px;fill:none;stroke:#397a5b;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.path-step-two .path-node svg{stroke:#8176ae}.path-step-three .path-node svg{stroke:#668d70}.path-step>div:last-child{display:flex;flex-direction:column;gap:3px}.path-step small{font-size:7px;letter-spacing:1.5px;font-weight:700;color:#829083}.path-step b{font:700 11px Manrope;color:#34483a}.path-step span{font-size:9px;color:#7a877c;line-height:1.5}
.lm-scroll-reveal{opacity:0;transform:translateY(18px);transition:opacity .65s ease,transform .65s cubic-bezier(.2,.7,.2,1)}.lm-scroll-reveal.lm-is-visible{opacity:1;transform:translateY(0)}
.metric-grid.lm-scroll-reveal .metric{opacity:0;transform:translateY(12px);animation:none;transition:opacity .5s ease,transform .5s ease}.metric-grid.lm-is-visible .metric{opacity:1;transform:translateY(0)}.metric-grid.lm-is-visible .metric:nth-child(2){transition-delay:.08s}.metric-grid.lm-is-visible .metric:nth-child(3){transition-delay:.16s}.metric-grid.lm-is-visible .metric:nth-child(4){transition-delay:.24s}
@keyframes lmHeroEnter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:1200px){.insight-path{gap:25px;padding:24px}.hero-copy{max-width:58%}.hero-art{right:0}}
@media(max-width:900px){.insight-path{grid-template-columns:1fr;gap:18px}.insight-path-intro p{max-width:600px}.path-visual{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.path-track{display:none}.path-step{align-items:flex-start;flex-direction:column;padding:10px}.path-step>div:last-child{gap:5px}.path-step span{font-size:9px}.hero-copy{max-width:75%}}
@media(max-width:580px){.lm-welcome-card{padding:30px 22px 24px;border-radius:20px}.lm-welcome-orbit{width:100px;height:100px;margin-bottom:22px}.lm-welcome-mark{width:56px;height:56px}.lm-welcome-tag{font-size:7px;letter-spacing:1.1px}.lm-welcome-message{font-size:11px}.insight-path{padding:21px 17px;margin-top:18px}.path-visual{grid-template-columns:1fr;gap:4px}.path-step{flex-direction:row;align-items:center;padding:9px 4px}.path-node{width:39px;height:39px;flex-basis:39px}.path-node svg{width:24px;height:24px}.hero{background:linear-gradient(130deg,#edf3e9,#f5f4ec)}.hero-art{opacity:.23}.hero-copy{max-width:100%}.lm-heading h2{letter-spacing:-.7px}}
@media(prefers-reduced-motion:reduce){.lm-scroll-reveal,.metric-grid.lm-scroll-reveal .metric{opacity:1;transform:none;transition:none}}
`