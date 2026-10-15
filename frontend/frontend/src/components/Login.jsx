// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));

        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("Server connection failed");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      
      {/* Left Section */}
      <div style={styles.leftPanel}>
        <h1 style={styles.brand}>LifeMirror</h1>

        <p style={styles.tagline}>
          Reflect. Heal. Grow.
        </p>

        <img
          src="https://images.unsplash.com/photo-1493836512294-502baa1986e2"
          alt="Mental Wellness"
          style={styles.image}
        />

        <div style={styles.quoteBox}>
          “Mental wellness is not a destination, but a process.”
        </div>
      </div>

      {/* Right Section */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome Back ✨</h2>

          <p style={styles.subtitle}>
            Continue your wellness journey
          </p>

          <input
            style={styles.input}
            placeholder="Email Address"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            style={styles.input}
            placeholder="Password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <button
            style={styles.button}
            onClick={handleLogin}
          >
            {loading ? "Signing In..." : "Login"}
          </button>

          <p
            style={styles.link}
            onClick={() => navigate("/signup")}
          >
            Create a new account →
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
    background: "#f8fafc"
  },

  leftPanel: {
    flex: 1,
    background:
      "linear-gradient(135deg, #dbeafe, #f0fdf4)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    gap: "20px"
  },

  rightPanel: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px"
  },

  brand: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "10px"
  },

  tagline: {
    fontSize: "20px",
    color: "#475569",
    marginBottom: "20px"
  },

  image: {
    width: "80%",
    borderRadius: "24px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
  },

  quoteBox: {
    marginTop: "20px",
    padding: "20px",
    background: "rgba(255,255,255,0.7)",
    borderRadius: "20px",
    color: "#334155",
    fontStyle: "italic",
    width: "80%"
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    padding: "40px",
    borderRadius: "28px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  title: {
    fontSize: "32px",
    color: "#0f172a",
    marginBottom: "5px"
  },

  subtitle: {
    color: "#64748b",
    marginBottom: "15px"
  },

  input: {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "15px",
    color: "#0f172a",
    transition: "0.3s"
  },

  button: {
    padding: "16px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #38bdf8, #6366f1)",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "16px",
    transition: "0.3s"
  },

  error: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "14px"
  },

  link: {
    color: "#6366f1",
    cursor: "pointer",
    textAlign: "center",
    marginTop: "10px"
  }
};