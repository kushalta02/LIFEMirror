import { useState } from "react";

export default function Journal() {

  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const user =
    JSON.parse(localStorage.getItem("user"));

  const saveJournal = async () => {

    if (!text.trim()) return;

    setLoading(true);
    setSaved(false);

    try {

      const res = await fetch(
        "http://127.0.0.1:8000/add_journal",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            text,
            email: user.email
          })
        }
      );

      const data = await res.json();

      setMood(data.mood);

      setSaved(true);

      setText("");

    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  return (

    <div style={styles.page}>

      {/* HERO */}
      <div style={styles.hero}>

        <h1 style={styles.title}>
          Your Reflection Space 🌿
        </h1>

        <p style={styles.subtitle}>
          Write freely. Your thoughts matter.
        </p>

      </div>

      {/* MAIN CARD */}
      <div style={styles.card}>

        {/* TOP INFO */}
        <div style={styles.topSection}>

          <div>
            <h2 style={styles.heading}>
              Daily Journal
            </h2>

            <p style={styles.desc}>
              Express emotions without judgment.
            </p>
          </div>

          <div style={styles.quote}>
            “Healing begins with honesty.”
          </div>

        </div>

        {/* WRITING PROMPTS */}
        <div style={styles.prompts}>

          <span style={styles.promptTag}>
            How was your day?
          </span>

          <span style={styles.promptTag}>
            What made you smile today?
          </span>

          <span style={styles.promptTag}>
            What’s on your mind?
          </span>

        </div>

        {/* TEXTAREA */}
        <textarea
          placeholder="Write how you feel today..."
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          style={styles.textarea}
        />

        {/* ACTION BAR */}
        <div style={styles.actionRow}>

          <div style={styles.wordCount}>
            {text.length} characters
          </div>

          <button
            style={styles.button}
            onClick={saveJournal}
          >
            {
              loading
                ? "Saving..."
                : "Save Entry"
            }
          </button>

        </div>

        {/* SUCCESS */}
        {saved && (

          <div style={styles.successBox}>
            Entry saved successfully ✨
          </div>

        )}

        {/* MOOD RESULT */}
        {mood && (

          <div style={styles.moodCard}>

            <h3 style={styles.moodTitle}>
              AI Mood Analysis
            </h3>

            <p style={styles.moodText}>
              {mood}
            </p>

          </div>

        )}

      </div>

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#f8fafc,#eef2ff)",
    padding: "50px 20px",
    fontFamily: "Inter, sans-serif"
  },

  hero: {
    textAlign: "center",
    marginBottom: "40px"
  },

  title: {
    fontSize: "48px",
    color: "#0f172a",
    marginBottom: "10px"
  },

  subtitle: {
    color: "#64748b",
    fontSize: "18px"
  },

  card: {
    maxWidth: "900px",
    margin: "auto",
    background: "#ffffff",
    borderRadius: "32px",
    padding: "40px",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.08)"
  },

  topSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px"
  },

  heading: {
    margin: 0,
    fontSize: "32px",
    color: "#0f172a"
  },

  desc: {
    color: "#64748b",
    marginTop: "10px"
  },

  quote: {
    background:
      "linear-gradient(135deg,#dbeafe,#f0fdf4)",
    padding: "14px 18px",
    borderRadius: "18px",
    color: "#334155",
    fontStyle: "italic"
  },

  prompts: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "25px"
  },

  promptTag: {
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "14px"
  },

  textarea: {
    width: "100%",
    minHeight: "260px",
    marginTop: "30px",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    fontSize: "16px",
    lineHeight: "1.7",
    resize: "none",
    outline: "none",
    background: "#f8fafc",
    color: "#0f172a",
    boxSizing: "border-box"
  },

  actionRow: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  wordCount: {
    color: "#64748b",
    fontSize: "14px"
  },

  button: {
    border: "none",
    padding: "14px 28px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg,#38bdf8,#6366f1)",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "15px"
  },

  successBox: {
    marginTop: "20px",
    background: "#dcfce7",
    color: "#166534",
    padding: "16px",
    borderRadius: "16px"
  },

  moodCard: {
    marginTop: "30px",
    background:
      "linear-gradient(135deg,#ede9fe,#dbeafe)",
    padding: "28px",
    borderRadius: "24px"
  },

  moodTitle: {
    marginTop: 0,
    color: "#312e81"
  },

  moodText: {
    fontSize: "18px",
    color: "#1e293b"
  }

};