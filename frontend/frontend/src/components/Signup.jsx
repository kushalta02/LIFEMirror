
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const signupStyles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

.mirror-signup-page,.mirror-signup-page *{box-sizing:border-box}
.mirror-signup-page{
  --mint:#a5f3d5;--violet:#b5aaff;--muted:#969db5;
  position:relative;isolation:isolate;display:grid;
  grid-template-columns:1.08fr .92fr;min-height:100vh;
  overflow:hidden;background:#090b16;color:#f6f4ff;
  font-family:'DM Sans',sans-serif
}
.mirror-signup-page a{color:inherit;text-decoration:none}
.mirror-signup-page button,.mirror-signup-page input{font:inherit}
.mirror-signup-page button:focus-visible,.mirror-signup-page a:focus-visible{
  outline:2px solid var(--mint);outline-offset:4px
}
.ms-ambient{position:absolute;z-index:-1;inset:0;overflow:hidden;pointer-events:none}
.ms-ambient:before,.ms-ambient:after{
  content:'';position:absolute;width:430px;height:430px;border-radius:50%;
  filter:blur(110px);opacity:.17
}
.ms-ambient:before{background:#7365f5;top:-240px;left:-100px}
.ms-ambient:after{background:#58e7b8;right:-240px;bottom:-180px}
.ms-noise{
  position:absolute;inset:0;opacity:.1;
  background-image:radial-gradient(#b8b7d4 .5px,transparent .5px);
  background-size:6px 6px
}
.ms-left{
  display:flex;flex-direction:column;justify-content:space-between;gap:28px;
  min-width:0;padding:34px clamp(25px,5.2vw,76px) 25px;
  border-right:1px solid #ffffff0d
}
.ms-logo{display:flex;align-items:center;gap:10px;align-self:flex-start}
.ms-logo-icon{
  display:grid;place-items:center;width:40px;height:50px;border-radius:13px;
  border:1px solid #a5f3d52b;background:#a5f3d50b;color:var(--mint);font-size:25px
}
.ms-logo-name{font:890 28px Manrope,sans-serif;letter-spacing:-1px}
.ms-logo-name span{color:var(--mint)}
.ms-logo-tag{
  margin-left:8px;padding-left:13px;border-left:1px solid #ffffff26;
  color:#8289a4;font-size:8px;letter-spacing:1.5px
}
.ms-left-content{width:100%;max-width:570px;margin:auto 0}
.ms-kicker{
  display:flex;align-items:center;gap:9px;color:#a9b4c5;
  font-size:9px;font-weight:700;letter-spacing:2px
}
.ms-kicker-dot{
  width:7px;height:7px;border-radius:50%;background:var(--mint);
  box-shadow:0 0 14px #a5f3d5a6
}
.ms-headline{
  margin:24px 0 16px;font:700 clamp(38px,4.2vw,64px)/1.13 Manrope,sans-serif;
  letter-spacing:-2.9px
}
.ms-headline span{
  color:transparent;background:linear-gradient(100deg,#a5f3d5,#b6aaff 85%);
  -webkit-background-clip:text;background-clip:text
}
.ms-description{max-width:410px;margin:0;color:var(--muted);font-size:13px;line-height:1.95}
.ms-art{
  position:relative;display:grid;place-items:center;width:min(100%,430px);
  height:245px;margin:7px auto 0
}
.ms-halo{
  position:absolute;width:190px;height:190px;border-radius:50%;
  background:#8170f52b;filter:blur(42px)
}
.ms-ring{position:absolute;border:1px solid #bcb9e32a;border-radius:50%}
.ms-ring-a{width:300px;height:145px;transform:rotate(-28deg);animation:ms-spin 28s linear infinite}
.ms-ring-b{width:255px;height:112px;transform:rotate(35deg);border-color:#a5f3d53d;animation:ms-spin 32s linear infinite reverse}
.ms-ring-c{width:185px;height:185px;border-color:#b5aaff38}
.ms-ring:after{
  content:'';position:absolute;top:15%;left:12%;width:8px;height:8px;
  border:2px solid #090b16;border-radius:50%;background:var(--mint);
  box-shadow:0 0 17px #a5f3d5a6
}
.ms-ring-b:after{top:auto;left:auto;right:10%;bottom:20%;background:var(--violet)}
.ms-sun{
  position:relative;z-index:1;display:grid;place-items:center;width:108px;height:108px;
  border:1px solid #b5aaff70;border-radius:50%;
  background:radial-gradient(circle at 35% 25%,#3a3a67,#15192c 70%);
  box-shadow:0 0 60px #7b67f43b,inset 0 0 25px #b4aaff20;
  animation:ms-breathe 5s ease-in-out infinite
}
.ms-sun-inner{
  display:grid;place-items:center;width:68px;height:68px;border-radius:50%;
  border:1px solid #a5f3d52d;background:#a5f3d50b;color:var(--mint);font-size:36px
}
.ms-spark{position:absolute;color:#c8c1ff;font-size:22px}
.ms-spark-a{top:22px;right:20%}
.ms-spark-b{bottom:26px;left:18%;color:var(--mint)}
.ms-spark-c{right:8%;top:46%;color:var(--mint)}
.ms-mantra{display:flex;align-items:center;gap:13px;margin-top:2px}
.ms-mantra-line{width:30px;height:1px;background:var(--mint)}
.ms-mantra strong{display:block;font-size:12px;font-weight:600}
.ms-mantra small{display:block;margin-top:5px;color:#828aa6;font-size:10px}
.ms-left-footer{
  display:flex;align-items:center;gap:12px;color:#747c96;font-size:8px;letter-spacing:1.25px
}
.ms-left-footer b{color:var(--mint)}
.ms-right{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:18px;min-width:0;padding:28px clamp(22px,4.4vw,65px)
}
.ms-topline{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  width:100%;max-width:405px;color:#858da7;font-size:9px;font-weight:700;letter-spacing:1.2px
}
.ms-step{display:flex;align-items:center;gap:7px;white-space:nowrap}
.ms-step i{width:5px;height:5px;border-radius:50%;background:var(--mint)}
.ms-card{
  position:relative;width:100%;max-width:405px;overflow:hidden;
  padding:clamp(24px,2.7vw,34px);border:1px solid #c7c5f222;border-radius:23px;
  background:linear-gradient(145deg,#181c31f5,#0e1120fa);
  box-shadow:0 30px 90px #00000032,inset 0 1px #ffffff09
}
.ms-card-glow{
  position:absolute;top:-105px;right:-100px;width:210px;height:210px;
  border-radius:50%;background:#806ef51f;filter:blur(65px);pointer-events:none
}
.ms-card-content{position:relative}
.ms-symbol{
  display:grid;place-items:center;width:37px;height:37px;margin-bottom:19px;
  border:1px solid #a5f3d530;border-radius:12px;background:#a5f3d50b;
  color:var(--mint);font-size:22px
}
.ms-eyebrow{color:var(--mint);font-size:9px;font-weight:700;letter-spacing:2px}
.ms-card h2{
  margin:11px 0 8px;font:700 clamp(32px,2.8vw,39px)/1.14 Manrope,sans-serif;
  letter-spacing:-1.6px
}
.ms-card h2 span{color:var(--violet)}
.ms-subtitle{margin:0 0 22px;color:#949bb5;font-size:11px;line-height:1.8}
.ms-form{display:grid;gap:16px}
.ms-field{display:grid;gap:8px}
.ms-field label{color:#b3bad0;font-size:9px;font-weight:700;letter-spacing:1.3px}
.ms-input{
  display:flex;align-items:center;gap:10px;height:47px;min-width:0;padding:0 12px;
  border:1px solid #2a3048;border-radius:10px;background:#080b1785;
  transition:border-color .2s,box-shadow .2s
}
.ms-input:focus-within{border-color:#a5f3d5a8;box-shadow:0 0 0 3px #a5f3d50d}
.ms-input-icon{flex:0 0 17px;width:17px;height:17px;stroke:#8f97b5;fill:none;stroke-width:1.5}
.ms-input input{
  width:100%;min-width:0;height:100%;padding:0;border:0;outline:0;
  background:transparent;color:#f2f0ff;font-size:12px
}
.ms-input input::placeholder{color:#606985}
.ms-toggle{
  flex:0 0 auto;padding:6px 0 6px 5px;border:0;background:transparent;
  color:var(--mint);font-size:8px;font-weight:700;letter-spacing:.8px;cursor:pointer
}
.ms-error,.ms-success{
  display:flex;align-items:flex-start;gap:9px;padding:10px 12px;
  border:1px solid;border-radius:9px;font-size:11px;line-height:1.6;overflow-wrap:anywhere
}
.ms-error{border-color:#ff78913d;background:#ff648212;color:#ffb5c3}
.ms-success{border-color:#a5f3d53b;background:#a5f3d510;color:#a5f3d5}
.ms-message-icon{
  display:grid;flex:0 0 16px;place-items:center;width:16px;height:16px;
  border:1px solid currentColor;border-radius:50%;font-size:10px
}
.ms-submit{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  width:100%;min-height:50px;margin-top:2px;padding:0 16px;
  border:1px solid #beffe64a;border-radius:10px;
  background:linear-gradient(105deg,#a5f3d5,#b8b0ff);color:#12172a;
  font-size:12px;font-weight:700;cursor:pointer;
  transition:transform .2s,filter .2s,opacity .2s
}
.ms-submit:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.06)}
.ms-submit:disabled{opacity:.7;cursor:wait}
.ms-submit-arrow{font-size:20px;font-weight:400}
.ms-divider{display:flex;align-items:center;gap:11px;margin:21px 0 17px}
.ms-divider i{flex:1;height:1px;background:#ffffff12}
.ms-divider span{color:#727a97;font-size:8px;letter-spacing:1px;white-space:nowrap}
.ms-login-link{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;color:#8b92ab;font-size:11px}
.ms-login-link a{color:var(--mint);font-weight:700}
.ms-login-link a span{padding-left:3px}
.ms-right-footer{
  display:flex;align-items:center;justify-content:center;gap:9px;
  color:#737b96;font-size:10px;text-align:center
}
.ms-right-footer b{color:var(--mint);font-size:16px;font-weight:400}
@keyframes ms-breathe{
  0%,100%{transform:scale(1);box-shadow:0 0 55px #7b67f43b,inset 0 0 25px #b4aaff20}
  50%{transform:scale(1.045);box-shadow:0 0 72px #7b67f44d,inset 0 0 32px #b4aaff2e}
}
@keyframes ms-spin{from{rotate:0deg}to{rotate:360deg}}
@media(min-width:1500px){
  .ms-left{padding-right:95px;padding-left:95px}
  .ms-right{padding-right:85px;padding-left:85px}
}
@media(max-width:1000px){
  .mirror-signup-page{grid-template-columns:minmax(0,1fr) minmax(340px,.95fr)}
  .ms-left{padding-right:26px;padding-left:30px}
  .ms-logo-tag{display:none}
  .ms-headline{font-size:clamp(36px,4.5vw,48px)}
  .ms-art{height:205px}
  .ms-ring-a{width:255px;height:120px}
  .ms-ring-b{width:220px;height:95px}
  .ms-ring-c{width:155px;height:155px}
  .ms-right{padding-right:20px;padding-left:20px}
}
@media(max-width:760px){
  .mirror-signup-page{grid-template-columns:1fr;overflow:visible}
  .ms-left{gap:23px;padding:22px 22px 8px;border-right:0}
  .ms-left-content{margin:14px 0 0}
  .ms-headline{margin-top:17px;font-size:clamp(36px,8vw,48px);letter-spacing:-2px}
  .ms-description{font-size:12px}
  .ms-art{height:175px;width:min(100%,340px);margin-top:0}
  .ms-ring-a{width:235px;height:105px}
  .ms-ring-b{width:200px;height:85px}
  .ms-ring-c{width:140px;height:140px}
  .ms-sun{width:94px;height:94px}
  .ms-sun-inner{width:60px;height:60px}
  .ms-left-footer{display:none}
  .ms-right{gap:16px;padding:15px 19px 30px}
  .ms-topline,.ms-card{max-width:460px}
  .ms-card{padding:27px}
}
@media(max-width:420px){
  .ms-left{padding-right:17px;padding-left:17px}
  .ms-headline{font-size:35px}
  .ms-kicker{font-size:8px;letter-spacing:1.4px}
  .ms-right{padding-right:12px;padding-left:12px}
  .ms-card{padding:23px 18px;border-radius:18px}
  .ms-topline{font-size:8px}
  .ms-card h2{font-size:34px}
}
@media(prefers-reduced-motion:reduce){
  .ms-sun,.ms-ring-a,.ms-ring-b{animation:none}
  .ms-submit{transition:none}
}
`;

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSignup(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all three fields.");
      return;
    }

    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.message !== "Signup successful") {
        setError(
          data.message ||
            data.error ||
            "We couldn't create your account. Please try again."
        );
        return;
      }

      setSuccess("Your account is ready! Taking you to sign in...");

      window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 1200);
    } catch {
      setError("Can't reach the server. Please check that your backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{signupStyles}</style>

      <main className="mirror-signup-page">
        <div className="ms-ambient" aria-hidden="true">
          <div className="ms-noise" />
        </div>

        <section className="ms-left">
          <Link to="/" className="ms-logo">
            <span className="ms-logo-icon" aria-hidden="true">
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

            <span className="ms-logo-name">
              life<span>mirror</span>
            </span>

            <span className="ms-logo-tag">PERSONAL WELLNESS</span>
          </Link>

          <div className="ms-left-content">
            <div className="ms-kicker">
              <span className="ms-kicker-dot" />
              EVERY JOURNEY STARTS SOMEWHERE
            </div>

            <h1 className="ms-headline">
              Make space
              <br />
              <span>for your growth.</span>
            </h1>

            <p className="ms-description">
              Start with a moment for yourself. Reflect on your thoughts,
              discover your patterns, and build a deeper understanding
              of who you are — at your own pace.
            </p>

            <div className="ms-art" role="img" aria-label="Abstract glowing orbit symbolizing a new beginning">
              <div className="ms-halo" />
              <div className="ms-ring ms-ring-a" />
              <div className="ms-ring ms-ring-b" />
              <div className="ms-ring ms-ring-c" />
              <div className="ms-sun">
                <div className="ms-sun-inner">✳</div>
              </div>
              <span className="ms-spark ms-spark-a">✧</span>
              <span className="ms-spark ms-spark-b">✳</span>
              <span className="ms-spark ms-spark-c">·</span>
            </div>

            <div className="ms-mantra">
              <span className="ms-mantra-line" />
              <div>
                <strong>There is no perfect starting point.</strong>
                <small>Just a willingness to understand yourself.</small>
              </div>
            </div>
          </div>

          <footer className="ms-left-footer">
            <span>YOUR STORY IS STILL UNFOLDING</span>
            <b>✳</b>
            <span>ONE DAY AT A TIME</span>
          </footer>
        </section>

        <section className="ms-right">
          <div className="ms-topline">
            <span>BEGIN YOUR JOURNEY</span>
            <span className="ms-step"><i /> 01 / CREATE ACCOUNT</span>
          </div>

          <div className="ms-card">
            <div className="ms-card-glow" aria-hidden="true" />

            <div className="ms-card-content">
              <div className="ms-symbol" aria-hidden="true">✧</div>
              <span className="ms-eyebrow">A SPACE THAT'S YOURS</span>

              <h2>Become your<br /><span>own reflection.</span></h2>

              <p className="ms-subtitle">
                Create your account and take your first small step.
              </p>

              <form className="ms-form" onSubmit={handleSignup}>
                <div className="ms-field">
                  <label htmlFor="signup-name">FULL NAME</label>
                  <div className="ms-input">
                    <svg className="ms-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21v-2a8 8 0 0116 0v2z" />
                    </svg>
                    <input
                      id="signup-name"
                      type="text"
                      placeholder="What should we call you?"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="ms-field">
                  <label htmlFor="signup-email">EMAIL ADDRESS</label>
                  <div className="ms-input">
                    <svg className="ms-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3.5" y="5" width="17" height="14" rx="3" />
                      <path d="M5 7l7 5.5L19 7" />
                    </svg>
                    <input
                      id="signup-email"
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

                <div className="ms-field">
                  <label htmlFor="signup-password">CREATE PASSWORD</label>
                  <div className="ms-input">
                    <svg className="ms-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="3" />
                      <path d="M8 10V7a4 4 0 018 0v3M12 14.5V17" />
                    </svg>
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="ms-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="ms-error" role="alert">
                    <span className="ms-message-icon">!</span>
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="ms-success" role="status">
                    <span className="ms-message-icon">✓</span>
                    <span>{success}</span>
                  </div>
                )}

                <button
                  className="ms-submit"
                  type="submit"
                  disabled={loading || Boolean(success)}
                >
                  <span>
                    {loading
                      ? "Creating your space..."
                      : success
                        ? "Account created"
                        : "Create my account"}
                  </span>
                  <span className="ms-submit-arrow" aria-hidden="true">
                    {loading ? "···" : "↗"}
                  </span>
                </button>
              </form>

              <div className="ms-divider">
                <i />
                <span>YOUR SPACE. YOUR PACE.</span>
                <i />
              </div>

              <div className="ms-login-link">
                <span>Already have an account?</span>
                <Link to="/">Sign in <span>↗</span></Link>
              </div>
            </div>
          </div>

          <div className="ms-right-footer">
            <b>◇</b>
            <span>A personal space for reflection and growth.</span>
          </div>
        </section>
      </main>
    </>
  );
}
