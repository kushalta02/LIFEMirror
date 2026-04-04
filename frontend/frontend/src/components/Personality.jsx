import { useEffect, useState } from "react";

export default function Personality() {
  const [avatar, setAvatar] = useState("");
  const [traits, setTraits] = useState([]);
  const [aiTraits, setAiTraits] = useState([]);
  const [mood, setMood] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const avatars = [
    "adventurer",
    "avataaars",
    "bottts",
    "micah",
    "personas"
  ];

  const traitOptions = [
    "Introvert",
    "Extrovert",
    "Calm",
    "Energetic",
    "Creative",
    "Sensitive"
  ];

  // Load saved personality
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/get_personality/${user.email}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setAvatar(data.avatar || "");
          setTraits(data.traits || []);
          setMood(data.mood || "");
        }
      });

    // Load AI traits
    fetch(`http://127.0.0.1:8000/get_ai_traits/${user.email}`)
      .then(res => res.json())
      .then(data => setAiTraits(data.traits));
  }, []);

  const toggleTrait = (t) => {
    setTraits(prev =>
      prev.includes(t)
        ? prev.filter(item => item !== t)
        : [...prev, t]
    );
  };

 const handleSave = async () => {
  await fetch("http://127.0.0.1:8000/save_personality", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: user.email,
      mood,
      traits,
      avatar
    })
  });

  // 🔥 SAVE LOCALLY ALSO
  localStorage.setItem("personality", JSON.stringify({
    mood,
    traits,
    avatar
  }));

  alert("Personality saved!");

  // 🔥 Redirect to dashboard
  window.location.href = "/dashboard";
};

  return (
    <div style={styles.container}>
      <h1>🎭 Personality AI</h1>

      {/* BITMOJI */}
      <div style={styles.section}>
        <h3>Your Bitmoji</h3>

        {avatar && (
          <img
            src={`https://api.dicebear.com/7.x/${avatar}/svg`}
            alt="avatar"
            style={{ width: "120px" }}
          />
        )}

        <div style={styles.avatarRow}>
          {avatars.map(a => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              style={{
                ...styles.avatarBtn,
                border: avatar === a ? "2px solid purple" : "1px solid gray"
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* USER TRAITS */}
      <div style={styles.section}>
        <h3>Your Traits</h3>
        <div>
          {traitOptions.map(t => (
            <button
              key={t}
              onClick={() => toggleTrait(t)}
              style={{
                ...styles.traitBtn,
                background: traits.includes(t) ? "#8b5cf6" : "#ddd",
                color: traits.includes(t) ? "#fff" : "#000"
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* AI TRAITS */}
      <div style={styles.section}>
        <h3>🤖 AI Detected Traits</h3>
        <div>
          {aiTraits.map((t, i) => (
            <span key={i} style={styles.aiTag}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* SAVE */}
      <button onClick={handleSave} style={styles.saveBtn}>
        Save Personality
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    textAlign: "center"
  },
  section: {
    marginTop: "30px"
  },
  avatarRow: {
    marginTop: "10px"
  },
  avatarBtn: {
    margin: "5px",
    padding: "8px",
    cursor: "pointer"
  },
  traitBtn: {
    margin: "5px",
    padding: "8px 12px",
    borderRadius: "10px",
    cursor: "pointer"
  },
  aiTag: {
    margin: "5px",
    padding: "6px 10px",
    background: "#a7f3d0",
    borderRadius: "10px",
    display: "inline-block"
  },
  saveBtn: {
    marginTop: "30px",
    padding: "12px 20px",
    background: "purple",
    color: "white",
    borderRadius: "10px",
    cursor: "pointer"
  }
};