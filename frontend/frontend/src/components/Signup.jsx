// Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.message === "Signup successful") {
        setSuccess("Account created successfully ✨");

        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setError(data.message);
      }

    } catch (err) {
      setError("Unable to connect to server");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>

      {/* LEFT PANEL */}
      <div style={styles.leftPanel}>
        <h1 style={styles.brand}>LifeMirror</h1>

        <p style={styles.tagline}>
          Your safe space for growth and reflection.
        </p>

        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
          alt="Wellness"
          style={styles.image}
        />

        <div style={styles.quoteBox}>
          “Healing begins when you choose yourself.”
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>

          <h2 style={styles.title}>
            Create Account 🌿
          </h2>

          <p style={styles.subtitle}>
            Begin your wellness journey today
          </p>

          <input
            style={styles.input}
            placeholder="Full Name"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

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

          {success && (
            <div style={styles.success}>
              {success}
            </div>
          )}

          <button
            style={styles.button}
            onClick={handleSignup}
          >
            {loading ? "Creating Account..." : "Signup"}
          </button>

          <p
            style={styles.link}
            onClick={() => navigate("/")}
          >
            Already have an account? Login →
          </p>

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    background: "#f8fafc",
    fontFamily: "Inter, sans-serif"
  },

  leftPanel: {
    flex: 1,
    background:
      "linear-gradient(135deg, #dbeafe, #f0fdf4)",
    padding: "60px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
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
    color: "#0f172a"
  },

  tagline: {
    fontSize: "20px",
    color: "#475569",
    maxWidth: "500px"
  },

  image: {
    width: "80%",
    borderRadius: "24px",
    marginTop: "10px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
  },

  quoteBox: {
    marginTop: "10px",
    background: "rgba(255,255,255,0.7)",
    padding: "18px",
    borderRadius: "18px",
    width: "80%",
    color: "#334155",
    fontStyle: "italic"
  },

  card: {
    width: "100%",
    maxWidth: "430px",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)"
  },

  title: {
    fontSize: "32px",
    color: "#0f172a"
  },

  subtitle: {
    color: "#64748b",
    marginBottom: "10px"
  },

  input: {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "15px",
    color: "#0f172a",
    background: "#ffffff"
  },

  button: {
    padding: "16px",
    borderRadius: "14px",
    border: "none",
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

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "14px"
  },

  link: {
    textAlign: "center",
    cursor: "pointer",
    color: "#6366f1",
    marginTop: "8px"
  }
};