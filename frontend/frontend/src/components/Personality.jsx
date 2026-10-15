import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Personality() {

  const navigate = useNavigate();

  const [avatar, setAvatar] = useState("");
  const [traits, setTraits] = useState([]);
  const [aiTraits, setAiTraits] = useState([]);
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const user =
    JSON.parse(localStorage.getItem("user"));

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

  // LOAD DATA
  useEffect(() => {

    fetch(
      `http://127.0.0.1:8000/get_personality/${user.email}`
    )
      .then((res) => res.json())
      .then((data) => {

        if (data) {
          setAvatar(data.avatar || "");
          setTraits(data.traits || []);
          setMood(data.mood || "");
        }

      });

    fetch(
      `http://127.0.0.1:8000/get_ai_traits/${user.email}`
    )
      .then((res) => res.json())
      .then((data) =>
        setAiTraits(data.traits || [])
      );

  }, [user.email]);

  // TOGGLE TRAITS
  const toggleTrait = (t) => {

    setTraits((prev) =>
      prev.includes(t)
        ? prev.filter((item) => item !== t)
        : [...prev, t]
    );

  };

  // SAVE
  const handleSave = async () => {

    setSaving(true);

    await fetch(
      "http://127.0.0.1:8000/save_personality",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          mood,
          traits,
          avatar
        })
      }
    );

    localStorage.setItem(
      "personality",
      JSON.stringify({
        mood,
        traits,
        avatar
      })
    );

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);

  };

  return (

    <div style={styles.page}>

      {/* HERO */}
      <div style={styles.hero}>

        <h1 style={styles.title}>
          Your Digital Personality 🌿
        </h1>

        <p style={styles.subtitle}>
          Shape how your AI understands you.
        </p>

      </div>

      {/* MAIN CARD */}
      <div style={styles.card}>

        {/* AVATAR SECTION */}
        <div style={styles.section}>

          <h2 style={styles.heading}>
            Choose Your Avatar
          </h2>

          <p style={styles.desc}>
            Pick a personality identity style.
          </p>

          {avatar && (

            <div style={styles.avatarPreview}>

              <img
                src={`https://api.dicebear.com/7.x/${avatar}/svg`}
                alt="avatar"
                style={styles.avatarImg}
              />

            </div>

          )}

          <div style={styles.avatarGrid}>

            {avatars.map((a) => (

              <button
                key={a}
                onClick={() => setAvatar(a)}
                style={{
                  ...styles.avatarBtn,
                  border:
                    avatar === a
                      ? "2px solid #6366f1"
                      : "1px solid #cbd5e1"
                }}
              >
                {a}
              </button>

            ))}

          </div>

        </div>

        {/* TRAITS */}
        <div style={styles.section}>

          <h2 style={styles.heading}>
            Personality Traits
          </h2>

          <p style={styles.desc}>
            Select traits that describe you.
          </p>

          <div style={styles.traitsGrid}>

            {traitOptions.map((t) => (

              <button
                key={t}
                onClick={() => toggleTrait(t)}
                style={{
                  ...styles.traitBtn,
                  background:
                    traits.includes(t)
                      ? "linear-gradient(135deg,#6366f1,#38bdf8)"
                      : "#f1f5f9",
                  color:
                    traits.includes(t)
                      ? "#ffffff"
                      : "#0f172a"
                }}
              >
                {t}
              </button>

            ))}

          </div>

        </div>

        {/* AI TRAITS */}
        <div style={styles.aiSection}>

          <h2 style={styles.heading}>
            🤖 AI Detected Traits
          </h2>

          <p style={styles.desc}>
            Insights detected from your journals
            and interactions.
          </p>

          <div style={styles.aiTraits}>

            {aiTraits.map((t, i) => (

              <span
                key={i}
                style={styles.aiTag}
              >
                {t}
              </span>

            ))}

          </div>

        </div>

        {/* SAVE */}
        <div style={styles.bottom}>

          <button
            style={styles.saveBtn}
            onClick={handleSave}
          >
            {
              saving
                ? "Saving..."
                : "Save Personality"
            }
          </button>

          {saved && (

            <div style={styles.success}>
              Personality saved successfully ✨
            </div>

          )}

        </div>

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
    fontSize: "46px",
    color: "#0f172a",
    marginBottom: "10px"
  },

  subtitle: {
    color: "#64748b",
    fontSize: "18px"
  },

  card: {
    maxWidth: "950px",
    margin: "auto",
    background: "#ffffff",
    borderRadius: "36px",
    padding: "40px",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.08)"
  },

  section: {
    marginBottom: "40px"
  },

  heading: {
    color: "#0f172a",
    marginBottom: "10px"
  },

  desc: {
    color: "#64748b",
    marginBottom: "20px"
  },

  avatarPreview: {
    marginBottom: "20px"
  },

  avatarImg: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    background: "#f8fafc",
    padding: "15px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.06)"
  },

  avatarGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px"
  },

  avatarBtn: {
    padding: "14px 18px",
    borderRadius: "14px",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    color: "#0f172a"
  },

  traitsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px"
  },

  traitBtn: {
    padding: "14px 20px",
    borderRadius: "16px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    transition: "0.3s"
  },

  aiSection: {
    background:
      "linear-gradient(135deg,#ede9fe,#dbeafe)",
    padding: "30px",
    borderRadius: "28px"
  },

  aiTraits: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "20px"
  },

  aiTag: {
    background: "#ffffff",
    color: "#4338ca",
    padding: "10px 16px",
    borderRadius: "16px",
    fontWeight: "600"
  },

  bottom: {
    marginTop: "30px",
    textAlign: "center"
  },

  saveBtn: {
    border: "none",
    padding: "16px 32px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#38bdf8,#6366f1)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer"
  },

  success: {
    marginTop: "20px",
    background: "#dcfce7",
    color: "#166534",
    padding: "16px",
    borderRadius: "16px"
  }

};