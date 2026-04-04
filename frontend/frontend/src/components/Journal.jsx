// Journal.jsx
import { useState } from "react";

export default function Journal() {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const saveJournal = async () => {
    if (!text) return alert("Write something first!");

    const res = await fetch("http://127.0.0.1:8000/add_journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        email: user.email
      })
    });

    const data = await res.json();
    setMood(data.mood);
    setText("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>📝 Your Journal</h2>
        <p>Express your thoughts freely...</p>

        <textarea
          placeholder="Write how you feel today..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.textarea}
        />

        <button onClick={saveJournal}>Save Entry</button>

        {mood && (
          <div style={styles.moodBox}>
            <h3>Detected Mood</h3>
            <p>{mood}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "600px",
    padding: "30px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(15px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
    textAlign: "center",
    animation: "fadeIn 0.6s ease",
  },

  textarea: {
    width: "100%",
    height: "150px",
    marginTop: "15px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: "14px",
  },

  moodBox: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.3)",
  }
};