// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } else alert("Invalid login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>LifeMirror ✨</h1>
        <p>Understand yourself better</p>

        <input placeholder="Email"
          onChange={e => setForm({...form, email: e.target.value})}/>

        <input type="password" placeholder="Password"
          onChange={e => setForm({...form, password: e.target.value})}/>

        <button onClick={handleLogin}>Login</button>

        <span onClick={() => navigate("/signup")} style={styles.link}>
          Create account →
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backdropFilter: "blur(20px)",
    background: "rgba(255,255,255,0.05)",
    padding: "40px",
    borderRadius: "20px",
    width: "350px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    boxShadow: "0 0 40px rgba(0,0,0,0.5)",
    animation: "fadeIn 0.8s ease",
  },
  link: {
    cursor: "pointer",
    color: "#38bdf8"
  }
};