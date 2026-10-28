
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

.mirror-page,.mirror-page *{box-sizing:border-box}
.mirror-page{
  --mint:#a5f3d5;--violet:#b5aaff;--muted:#969db5;
  position:relative;isolation:isolate;display:grid;
  grid-template-columns:1.08fr .92fr;min-height:100vh;
  overflow:hidden;background:#090b16;color:#f6f4ff;
  font-family:'DM Sans',sans-serif;
}
.mirror-page a{color:inherit;text-decoration:none}
.mirror-page button,.mirror-page input{font:inherit}
.mirror-page button:focus-visible,.mirror-page a:focus-visible{
  outline:2px solid var(--mint);outline-offset:4px
}
.mirror-ambient{position:absolute;z-index:-1;inset:0;overflow:hidden;pointer-events:none}
.mirror-ambient:before,.mirror-ambient:after{
  content:'';position:absolute;width:430px;height:430px;border-radius:50%;
  filter:blur(110px);opacity:.17
}
.mirror-ambient:before{background:#7365f5;top:-240px;left:-100px}
.mirror-ambient:after{background:#58e7b8;right:-240px;bottom:-180px}
.mirror-noise{
  position:absolute;inset:0;opacity:.1;
  background-image:radial-gradient(#b8b7d4 .5px,transparent .5px);
  background-size:6px 6px
}
.mirror-left{
  display:flex;flex-direction:column;justify-content:space-between;
  gap:30px;min-width:0;padding:34px clamp(25px,5.2vw,76px) 25px;
  border-right:1px solid #ffffff0d
}
.mirror-logo{display:flex;align-items:center;gap:10px;align-self:flex-start}
.mirror-logo-icon{
  display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border-radius:14px;
  border:1px solid #b5aaff45;
  background:linear-gradient(145deg,#b5aaff14,#78e0d00b);
  box-shadow:0 0 24px #8e80ff12
}
.mirror-logo-icon svg{display:block;width:34px;height:34px}
.mirror-logo-name{font:800 28px Manrope,sans-serif;letter-spacing:-1px;white-space:nowrap}
.mirror-logo-name span{color:var(--mint)}
.mirror-logo-tag{
  margin-left:8px;padding-left:13px;border-left:1px solid #ffffff26;
  color:#8289a4;font-size:8px;letter-spacing:1.5px
}
.mirror-left-content{width:100%;max-width:570px;margin:auto 0}
.mirror-kicker{
  display:flex;align-items:center;gap:9px;color:#a9b4c5;
  font-size:9px;font-weight:700;letter-spacing:2px
}
.mirror-kicker-dot{
  width:7px;height:7px;border-radius:50%;background:var(--mint);
  box-shadow:0 0 14px #a5f3d5a6
}
.mirror-headline{
  margin:24px 0 16px;font:700 clamp(38px,4.2vw,64px)/1.13 Manrope,sans-serif;
  letter-spacing:-2.9px
}
.mirror-headline span{
  color:transparent;background:linear-gradient(100deg,#a5f3d5,#b6aaff 85%);
  -webkit-background-clip:text;background-clip:text
}
.mirror-description{
  max-width:405px;margin:0;color:var(--muted);font-size:13px;line-height:1.95
}
.mirror-art{
  position:relative;display:grid;place-items:center;width:min(100%,430px);
  height:255px;margin:7px auto 0
}
.mirror-art-halo{
  position:absolute;width:190px;height:190px;border-radius:50%;
  background:#8170f52b;filter:blur(42px)
}
.mirror-ring{
  position:absolute;border:1px solid #bcb9e32a;border-radius:50%
}
.mirror-ring-a{width:300px;height:145px;transform:rotate(-28deg);animation:mirror-spin 28s linear infinite}
.mirror-ring-b{width:255px;height:112px;transform:rotate(35deg);border-color:#a5f3d53d;animation:mirror-spin 32s linear infinite reverse}
.mirror-ring-c{width:185px;height:185px;border-color:#b5aaff38}
.mirror-ring:after{
  content:'';position:absolute;top:15%;left:12%;width:8px;height:8px;
  border:2px solid #090b16;border-radius:50%;background:var(--mint);
  box-shadow:0 0 17px #a5f3d5a6
}
.mirror-ring-b:after{top:auto;left:auto;right:10%;bottom:20%;background:var(--violet)}
.mirror-sun{
  position:relative;z-index:1;display:grid;place-items:center;width:108px;height:108px;
  border:1px solid #b5aaff70;border-radius:50%;
  background:radial-gradient(circle at 35% 25%,#3a3a67,#15192c 70%);
  box-shadow:0 0 60px #7b67f43b,inset 0 0 25px #b4aaff20;
  animation:mirror-breathe 5s ease-in-out infinite
}
.mirror-sun-inner{
  display:grid;place-items:center;width:68px;height:68px;border-radius:50%;
  border:1px solid #a5f3d52d;background:#a5f3d50b;color:var(--mint);font-size:36px
}
.mirror-spark{position:absolute;color:#c8c1ff;font-size:22px}
.mirror-spark-a{top:22px;right:20%}
.mirror-spark-b{bottom:26px;left:18%;color:var(--mint)}
.mirror-spark-c{right:8%;top:46%;color:var(--mint)}
.mirror-mantra{display:flex;align-items:center;gap:13px;margin-top:2px}
.mirror-mantra-line{width:30px;height:1px;background:var(--mint)}
.mirror-mantra strong{display:block;font-size:12px;font-weight:600}
.mirror-mantra small{display:block;margin-top:5px;color:#828aa6;font-size:10px}
.mirror-left-footer{
  display:flex;align-items:center;gap:12px;color:#747c96;
  font-size:8px;letter-spacing:1.25px
}
.mirror-left-footer b{color:var(--mint)}
.mirror-right{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:25px;min-width:0;padding:32px clamp(22px,4.4vw,65px)
}
.mirror-topline{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  width:100%;max-width:405px;color:#858da7;font-size:9px;font-weight:700;letter-spacing:1.3px
}
.mirror-step{display:flex;align-items:center;gap:7px;white-space:nowrap}
.mirror-step i{width:5px;height:5px;border-radius:50%;background:var(--mint)}
.mirror-card{
  position:relative;width:100%;max-width:405px;overflow:hidden;
  padding:clamp(25px,3vw,38px);border:1px solid #c7c5f222;border-radius:23px;
  background:linear-gradient(145deg,#181c31f5,#0e1120fa);
  box-shadow:0 30px 90px #00000032,inset 0 1px #ffffff09
}
.mirror-card-glow{
  position:absolute;top:-105px;right:-100px;width:210px;height:210px;
  border-radius:50%;background:#806ef51f;filter:blur(65px);pointer-events:none
}
.mirror-card-content{position:relative}
.mirror-symbol{
  display:grid;place-items:center;width:39px;height:39px;margin-bottom:25px;
  border:1px solid #a5f3d530;border-radius:12px;background:#a5f3d50b;
  color:var(--mint);font-size:23px
}
.mirror-eyebrow{color:var(--mint);font-size:9px;font-weight:700;letter-spacing:2px}
.mirror-card h2{
  margin:13px 0 11px;font:700 clamp(34px,3vw,43px)/1.14 Manrope,sans-serif;
  letter-spacing:-1.8px
}
.mirror-card h2 span{color:var(--violet)}
.mirror-subtitle{margin:0 0 27px;color:#949bb5;font-size:11px;line-height:1.8}
.mirror-form{display:grid;gap:20px}
.mirror-field{display:grid;gap:9px}
.mirror-field label{color:#b3bad0;font-size:9px;font-weight:700;letter-spacing:1.3px}
.mirror-input{
  display:flex;align-items:center;gap:11px;height:51px;min-width:0;padding:0 13px;
  border:1px solid #2a3048;border-radius:10px;background:#080b1785;
  transition:border-color .2s,box-shadow .2s
}
.mirror-input:focus-within{border-color:#a5f3d5a8;box-shadow:0 0 0 3px #a5f3d50d}
.mirror-input-icon{flex:0 0 18px;width:18px;height:18px;stroke:#8f97b5;fill:none;stroke-width:1.5}
.mirror-input input{
  width:100%;min-width:0;height:100%;padding:0;border:0;outline:0;
  background:transparent;color:#f2f0ff;font-size:12px
}
.mirror-input input::placeholder{color:#606985}
.mirror-toggle{
  flex:0 0 auto;padding:6px 0 6px 5px;border:0;background:transparent;
  color:var(--mint);font-size:8px;font-weight:700;letter-spacing:.8px;cursor:pointer
}
.mirror-error{
  display:flex;gap:9px;padding:11px 12px;border:1px solid #ff78913d;
  border-radius:9px;background:#ff648212;color:#ffb5c3;font-size:11px;line-height:1.6
}
.mirror-error-icon{
  flex:0 0 16px;display:grid;place-items:center;width:16px;height:16px;
  border:1px solid #ff9bac;border-radius:50%;font-size:10px
}
.mirror-submit{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  width:100%;min-height:52px;margin-top:3px;padding:0 17px;
  border:1px solid #beffe64a;border-radius:10px;
  background:linear-gradient(105deg,#a5f3d5,#b8b0ff);color:#12172a;
  font-size:12px;font-weight:700;cursor:pointer;
  transition:transform .2s,filter .2s,opacity .2s
}
.mirror-submit:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.06)}
.mirror-submit:disabled{opacity:.7;cursor:wait}
.mirror-submit-arrow{font-size:20px;font-weight:400}
.mirror-divider{display:flex;align-items:center;gap:11px;margin:24px 0 20px}
.mirror-divider i{flex:1;height:1px;background:#ffffff12}
.mirror-divider span{color:#727a97;font-size:8px;letter-spacing:1px;white-space:nowrap}
.mirror-signup{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;color:#8b92ab;font-size:11px}
.mirror-signup a{color:var(--mint);font-weight:700}
.mirror-signup a span{padding-left:3px}
.mirror-right-footer{
  display:flex;align-items:center;justify-content:center;gap:9px;
  color:#737b96;font-size:10px;text-align:center
}
.mirror-right-footer b{color:var(--mint);font-size:16px;font-weight:400}
@keyframes mirror-breathe{
  0%,100%{transform:scale(1);box-shadow:0 0 55px #7b67f43b,inset 0 0 25px #b4aaff20}
  50%{transform:scale(1.045);box-shadow:0 0 72px #7b67f44d,inset 0 0 32px #b4aaff2e}
}
@keyframes mirror-spin{from{rotate:0deg}to{rotate:360deg}}
@media(min-width:1500px){
  .mirror-left{padding-right:95px;padding-left:95px}
  .mirror-right{padding-right:85px;padding-left:85px}
}
@media(max-width:1000px){
  .mirror-page{grid-template-columns:minmax(0,1fr) minmax(350px,.95fr)}
  .mirror-left{padding-right:28px;padding-left:32px}
  .mirror-logo-tag{display:none}
  .mirror-logo{gap:9px}
  .mirror-headline{font-size:clamp(36px,4.5vw,48px)}
  .mirror-art{height:215px}
  .mirror-ring-a{width:260px;height:125px}
  .mirror-ring-b{width:225px;height:95px}
  .mirror-ring-c{width:155px;height:155px}
  .mirror-right{padding-right:22px;padding-left:22px}
}
@media(max-width:760px){
  .mirror-page{grid-template-columns:1fr;overflow:visible}
  .mirror-left{gap:24px;padding:23px 23px 8px;border-right:0}
  .mirror-left-content{margin:15px 0 0}
  .mirror-headline{margin-top:17px;font-size:clamp(36px,8vw,49px);letter-spacing:-2px}
  .mirror-description{font-size:12px}
  .mirror-art{height:190px;width:min(100%,350px);margin-top:0}
  .mirror-ring-a{width:245px;height:110px}
  .mirror-ring-b{width:210px;height:90px}
  .mirror-ring-c{width:145px;height:145px}
  .mirror-sun{width:94px;height:94px}
  .mirror-sun-inner{width:60px;height:60px}
  .mirror-left-footer{display:none}
  .mirror-right{gap:18px;padding:16px 20px 32px}
  .mirror-topline,.mirror-card{max-width:460px}
  .mirror-card{padding:29px}
}
@media(max-width:420px){
  .mirror-left{padding-right:18px;padding-left:18px}
  .mirror-headline{font-size:35px}
  .mirror-kicker{font-size:8px;letter-spacing:1.4px}
  .mirror-right{padding-right:13px;padding-left:13px}
  .mirror-card{padding:24px 19px;border-radius:18px}
  .mirror-topline{font-size:8px}
  .mirror-card h2{font-size:36px}
}
@media(prefers-reduced-motion:reduce){
  .mirror-sun,.mirror-ring-a,.mirror-ring-b{animation:none}
  .mirror-submit{transition:none}
}

/* NIGHT-SKY POLISH: layered aurora, stardust, glass and subtle motion */
.mirror-page{
  background:
    radial-gradient(ellipse at 18% 12%,#24204465 0,transparent 38%),
    radial-gradient(ellipse at 83% 76%,#103d3c45 0,transparent 34%),
    linear-gradient(135deg,#070913 0%,#0b0d1b 48%,#080b15 100%);
}
.mirror-page:before{
  content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.18;
  background-image:linear-gradient(#a8b4ff0b 1px,transparent 1px),linear-gradient(90deg,#a8b4ff0b 1px,transparent 1px);
  background-size:54px 54px;
  mask-image:linear-gradient(to bottom,black,transparent 92%);
}
.mirror-ambient{
  background:
    radial-gradient(1px 1px at 12% 22%,#e7e5ffb8 98%,transparent),
    radial-gradient(1px 1px at 24% 72%,#a5f3d5a8 98%,transparent),
    radial-gradient(1.5px 1.5px at 76% 18%,#c8c1ffb8 98%,transparent),
    radial-gradient(1px 1px at 89% 54%,#ffffff99 98%,transparent),
    radial-gradient(1px 1px at 63% 83%,#a5f3d5a8 98%,transparent);
  background-size:310px 280px,370px 330px,430px 350px,280px 310px,390px 360px;
  animation:mirror-stardrift 34s linear infinite;
}
.mirror-ambient:before{animation:mirror-aurora 13s ease-in-out infinite alternate}
.mirror-ambient:after{animation:mirror-aurora 16s ease-in-out infinite alternate-reverse}
.mirror-left{position:relative}
.mirror-left:after{
  content:"";position:absolute;left:0;top:18%;width:1px;height:36%;
  background:linear-gradient(transparent,#a5f3d56b,transparent);
  box-shadow:0 0 18px #a5f3d52e;pointer-events:none;
}
.mirror-logo-icon{transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .3s}
.mirror-logo:hover .mirror-logo-icon{
  transform:rotate(-9deg) translateY(-2px);
  box-shadow:0 0 30px #a5f3d532,0 0 0 5px #b5aaff08;
}
.mirror-logo-name span{text-shadow:0 0 22px #a5f3d52b}
.mirror-kicker-dot{animation:mirror-dot-pulse 2.8s ease-in-out infinite}
.mirror-headline span{
  background-size:180% 100%;animation:mirror-gradient-flow 8s ease infinite;
  filter:drop-shadow(0 0 22px #a5f3d50d);
}
.mirror-art-halo{animation:mirror-halo-pulse 7s ease-in-out infinite alternate}
.mirror-ring{box-shadow:0 0 20px #a5f3d507,inset 0 0 16px #b5aaff05}
.mirror-ring-a{animation:mirror-spin 28s linear infinite,mirror-ring-glow 5s ease-in-out infinite alternate}
.mirror-ring-b{animation:mirror-spin 32s linear infinite reverse,mirror-ring-glow 6s ease-in-out infinite alternate-reverse}
.mirror-ring-c{animation:mirror-calm-rotate 42s linear infinite}
.mirror-ring:after{animation:mirror-orbit-dot 4.5s ease-in-out infinite}
.mirror-ring-b:after{animation-delay:-2s}
.mirror-sun{backdrop-filter:blur(8px)}
.mirror-sun-inner{box-shadow:0 0 25px #a5f3d514,inset 0 0 20px #a5f3d50b;animation:mirror-inner-glow 4s ease-in-out infinite}
.mirror-spark{animation:mirror-twinkle 3.4s ease-in-out infinite}
.mirror-spark-b{animation-delay:-1.3s}
.mirror-spark-c{animation-delay:-2.1s}
.mirror-mantra-line{box-shadow:0 0 12px #a5f3d55c}
.mirror-card{
  border-color:#c7c5f229;
  background:linear-gradient(145deg,#191d33f7,#0d1020fa 68%,#111628f7);
  box-shadow:0 32px 90px #00000048,0 0 0 1px #ffffff03,inset 0 1px #ffffff0b;
  transition:transform .35s ease,border-color .35s,box-shadow .35s;
}
.mirror-card:before{
  content:"";position:absolute;inset:0;padding:1px;border-radius:inherit;pointer-events:none;
  background:linear-gradient(135deg,#a5f3d546,transparent 27%,#b5aaff22 56%,transparent 76%,#a5f3d52b);
  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;opacity:.7;
  background-size:200% 200%;animation:mirror-border-shift 10s ease infinite;
}
.mirror-card:after{
  content:"";position:absolute;top:-70%;left:-65%;width:45%;height:230%;pointer-events:none;
  background:linear-gradient(90deg,transparent,#ffffff05,transparent);transform:rotate(24deg);
  animation:mirror-card-sheen 12s ease-in-out infinite;
}
.mirror-card-content{z-index:1}
.mirror-card-glow{animation:mirror-card-glow 8s ease-in-out infinite alternate}
.mirror-symbol{box-shadow:0 0 25px #a5f3d50a;transition:transform .3s,box-shadow .3s}
.mirror-card:hover .mirror-symbol{transform:rotate(8deg) scale(1.05);box-shadow:0 0 28px #a5f3d51b}
.mirror-input{
  background:linear-gradient(120deg,#080b17b8,#0d1122b8);
  box-shadow:inset 0 1px #ffffff04;
  transition:border-color .25s,box-shadow .25s,transform .25s,background .25s;
}
.mirror-input:focus-within{
  transform:translateY(-1px);background:#0b1020;
  border-color:#a5f3d5c2;
  box-shadow:0 0 0 3px #a5f3d511,0 0 24px #a5f3d50c,inset 0 0 16px #a5f3d505;
}
.mirror-input:focus-within .mirror-input-icon{stroke:var(--mint);filter:drop-shadow(0 0 4px #a5f3d55c)}
.mirror-submit{
  position:relative;isolation:isolate;overflow:hidden;
  box-shadow:0 8px 28px #a5f3d511,inset 0 1px #ffffff70;
}
.mirror-submit:before{
  content:"";position:absolute;z-index:-1;top:-60%;left:-45%;width:32%;height:220%;
  background:linear-gradient(90deg,transparent,#ffffffb0,transparent);transform:rotate(25deg);
  transition:left .65s ease;
}
.mirror-submit:hover:not(:disabled){
  transform:translateY(-3px);filter:brightness(1.08);
  box-shadow:0 13px 35px #a5f3d525,0 0 0 4px #a5f3d509;
}
.mirror-submit:hover:not(:disabled):before{left:125%}
.mirror-submit-arrow{transition:transform .25s}
.mirror-submit:hover:not(:disabled) .mirror-submit-arrow{transform:translate(3px,-2px)}
.mirror-toggle{transition:color .2s,text-shadow .2s}
.mirror-toggle:hover{color:#d4fff0;text-shadow:0 0 12px #a5f3d55c}
.mirror-signup a{transition:color .2s,text-shadow .2s}
.mirror-signup a:hover{color:#d4fff0;text-shadow:0 0 16px #a5f3d53d}
.mirror-right-footer b{animation:mirror-footer-drift 4s ease-in-out infinite}
@keyframes mirror-stardrift{from{background-position:0 0,0 0,0 0,0 0,0 0}to{background-position:310px -280px,-370px 330px,430px -350px,-280px 310px,390px -360px}}
@keyframes mirror-aurora{0%{transform:translate3d(0,0,0) scale(1);opacity:.13}100%{transform:translate3d(22px,-16px,0) scale(1.12);opacity:.25}}
@keyframes mirror-dot-pulse{0%,100%{box-shadow:0 0 10px #a5f3d55c}50%{box-shadow:0 0 21px #a5f3d5c9}}
@keyframes mirror-gradient-flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes mirror-halo-pulse{from{transform:scale(.88);opacity:.65}to{transform:scale(1.14);opacity:1}}
@keyframes mirror-ring-glow{from{filter:brightness(.8)}to{filter:brightness(1.45)}}
@keyframes mirror-calm-rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes mirror-orbit-dot{0%,100%{box-shadow:0 0 10px #a5f3d55c}50%{box-shadow:0 0 23px #a5f3d5e0}}
@keyframes mirror-inner-glow{0%,100%{box-shadow:0 0 18px #a5f3d50d,inset 0 0 14px #a5f3d50b}50%{box-shadow:0 0 32px #a5f3d523,inset 0 0 24px #a5f3d51a}}
@keyframes mirror-twinkle{0%,100%{opacity:.55;transform:scale(.88) rotate(-8deg)}50%{opacity:1;transform:scale(1.12) rotate(8deg)}}
@keyframes mirror-border-shift{0%,100%{background-position:0% 0%}50%{background-position:100% 100%}}
@keyframes mirror-card-sheen{0%,72%,100%{left:-65%;opacity:0}78%{opacity:1}88%{left:130%;opacity:0}}
@keyframes mirror-card-glow{from{transform:translate(0,0) scale(.9);opacity:.6}to{transform:translate(-18px,15px) scale(1.16);opacity:1}}
@keyframes mirror-footer-drift{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
@media(max-width:760px){
  .mirror-left:after{display:none}
  .mirror-card:hover{transform:none}
}
@media(hover:hover) and (min-width:761px){
  .mirror-card:hover{transform:translateY(-3px);border-color:#a5f3d53b;box-shadow:0 38px 100px #00000055,0 0 32px #8c7dff0b,inset 0 1px #ffffff0c}
}
@media(prefers-reduced-motion:reduce){
  .mirror-ambient,.mirror-ambient:before,.mirror-ambient:after,.mirror-kicker-dot,
  .mirror-headline span,.mirror-art-halo,.mirror-ring-a,.mirror-ring-b,.mirror-ring-c,
  .mirror-ring:after,.mirror-sun-inner,.mirror-spark,.mirror-card:before,.mirror-card:after,
  .mirror-card-glow,.mirror-right-footer b{animation:none!important}
  .mirror-card,.mirror-input,.mirror-submit,.mirror-logo-icon{transition:none!important}
}

`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.user || !data.access_token) {
        setError(
          data.message ||
            data.error ||
            "We couldn't verify your details. Please try again."
        );
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("session_started_at", Date.now().toString());
      if (!data.access_token) {
        throw new Error("Login response did not include an access token.");}

      sessionStorage.setItem("access_token", data.access_token);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Can't reach the server. Please check that your backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{css}</style>

      <main className="mirror-page">
        <div className="mirror-ambient" aria-hidden="true">
          <div className="mirror-noise" />
        </div>

        <section className="mirror-left">
          <Link to="/" className="mirror-logo">
            <span className="mirror-logo-icon" aria-hidden="true">
            <svg
              viewBox="0 0 48 48"
              width="38"
              height="38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
                <path
                  d="M23 10C16 4 9 12 13 18C5 22 10 31 17 30C16 39 24 40 24 34V13Z"
                  fill="#B9A5FF"
                />
                <path
                  d="M25 10C32 4 39 12 35 18C43 22 38 31 31 30C32 39 24 40 24 34V13Z"
                  fill="#a6f8ec"
                />
                <path
                  d="M24 12V35"
                  stroke="#F7F4FF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <span className="mirror-logo-name">
              life<span>mirror</span>
            </span>

            <span className="mirror-logo-tag">PERSONAL WELLNESS</span>
          </Link>

          <div className="mirror-left-content">
            <div className="mirror-kicker">
              <span className="mirror-kicker-dot" />
              YOUR SPACE TO RECONNECT
            </div>

            <h1 className="mirror-headline">
              Meet yourself
              <br />
              <span>where you are.</span>
            </h1>

            <p className="mirror-description">
              Your thoughts. Your patterns. Your growth.
              A quieter space to understand what is happening
              within you — and take your next small step.
            </p>

            <div className="mirror-art" role="img" aria-label="Abstract glowing orbit representing self-reflection">
              <div className="mirror-art-halo" />
              <div className="mirror-ring mirror-ring-a" />
              <div className="mirror-ring mirror-ring-b" />
              <div className="mirror-ring mirror-ring-c" />
              <div className="mirror-sun">
                <div className="mirror-sun-inner">✳</div>
              </div>
              <span className="mirror-spark mirror-spark-a">✧</span>
              <span className="mirror-spark mirror-spark-b">✳</span>
              <span className="mirror-spark mirror-spark-c">·</span>
            </div>

            <div className="mirror-mantra">
              <span className="mirror-mantra-line" />
              <div>
                <strong>Pause. Reflect. Become.</strong>
                <small>Progress starts with understanding yourself.</small>
              </div>
            </div>
          </div>

          <footer className="mirror-left-footer">
            <span>MADE FOR YOUR INNER WORLD</span>
            <b>✳</b>
            <span>ONE DAY AT A TIME</span>
          </footer>
        </section>

        <section className="mirror-right">
          <div className="mirror-topline">
            <span>YOUR JOURNEY CONTINUES</span>
            <span className="mirror-step"><i /> 01 / SIGN IN</span>
          </div>

          <div className="mirror-card">
            <div className="mirror-card-glow" aria-hidden="true" />

            <div className="mirror-card-content">
              <div className="mirror-symbol" aria-hidden="true">✳</div>
              <span className="mirror-eyebrow">WELCOME BACK</span>

              <h2>Return to<br /><span>yourself.</span></h2>

              <p className="mirror-subtitle">
                Pick up where you left off. Your space is waiting.
              </p>

              <form className="mirror-form" onSubmit={handleLogin}>
                <div className="mirror-field">
                  <label htmlFor="mirror-email">EMAIL ADDRESS</label>
                  <div className="mirror-input">
                    <svg className="mirror-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3.5" y="5" width="17" height="14" rx="3" />
                      <path d="M5 7l7 5.5L19 7" />
                    </svg>
                    <input
                      id="mirror-email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mirror-field">
                  <label htmlFor="mirror-password">PASSWORD</label>
                  <div className="mirror-input">
                    <svg className="mirror-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="3" />
                      <path d="M8 10V7a4 4 0 018 0v3M12 14.5V17" />
                    </svg>
                    <input
                      id="mirror-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="mirror-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mirror-error" role="alert">
                    <span className="mirror-error-icon">!</span>
                    <span>{error}</span>
                  </div>
                )}

                <button className="mirror-submit" type="submit" disabled={loading}>
                  <span>{loading ? "Finding your space..." : "Enter LifeMirror"}</span>
                  <span className="mirror-submit-arrow" aria-hidden="true">
                    {loading ? "···" : "↗"}
                  </span>
                </button>
              </form>

              <div className="mirror-divider">
                <i />
                <span>YOUR SPACE. YOUR PACE.</span>
                <i />
              </div>

              <div className="mirror-signup">
                <span>New to your journey?</span>
                <Link to="/signup">Create an account <span>↗</span></Link>
              </div>
            </div>
          </div>

          <div className="mirror-right-footer">
            <b>◇</b>
            <span>A personal space for reflection and growth.</span>
          </div>
        </section>
      </main>
    </>
  );
}