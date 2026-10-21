
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
