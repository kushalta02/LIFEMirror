import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const userData = localStorage.getItem("user");

  if (!userData) {
    alert("Please login first");
    navigate("/");
    return;
  }

  const user = JSON.parse(userData);

  // 🔥 LOAD LOCAL PERSONALITY FIRST (FAST UI)
  const localPersonality = JSON.parse(localStorage.getItem("personality"));

  fetch(`http://127.0.0.1:8000/dashboard/${user.email}`)
    .then(res => res.json())
    .then(res => {
      // 🔥 Merge backend + local personality
      if (localPersonality) {
        res.traits = localPersonality.traits || res.traits;
      }

      setData(res);
      setLoading(false);
    });
}, []);

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  }

  return (
    <div style={styles.container}>
      <h1>Welcome 👋</h1>
      <p>Your AI Digital Twin Dashboard</p>

      {/* TOP CARDS */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>😊 Mood</h3>
          <p>{data?.mood}</p>
        </div>

        {/* 🔥 ONLY TEXT PERSONALITY */}
        <div style={styles.card}>
          <h3>🧠 Personality</h3>
          <p>{data?.personality}</p>

          {/* 🔥 SHOW AI TRAITS AS LABELS (TEXT ONLY) */}
          <div style={{ marginTop: "10px" }}>
            {data?.traits?.map((t, i) => (
              <span key={i} style={styles.trait}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3>🔮 Prediction</h3>
          <p>{data?.prediction}</p>
        </div>
      </div>

      {/* GRAPH */}
      <div style={styles.bigCard}>
        <h3>📊 Emotional Trend</h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={data?.history?.map((val, i) => ({
              index: i + 1,
              mood: val
            }))}
          >
            <XAxis dataKey="index" />

            <YAxis
              domain={[-1, 1]}
              tickFormatter={(value) => {
                if (value === -1) return "Negative 😔";
                if (value === 0) return "Neutral 😐";
                if (value === 1) return "Positive 😊";
              }}
            />

            <Tooltip
              formatter={(value) => {
                if (value === -1) return "Negative 😔";
                if (value === 0) return "Neutral 😐";
                if (value === 1) return "Positive 😊";
              }}
            />

            <Line type="monotone" dataKey="mood" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* FEATURES */}
      <h2 style={{ marginTop: "40px" }}>Explore Features 🚀</h2>

      <div style={styles.features}>

        <div style={styles.featureCard} onClick={() => navigate("/journal")}>
          📝
          <p>Journal</p>
        </div>

        <div style={styles.featureCard} onClick={() => navigate("/chat")}>
          🤖
          <p>Talk to Bot</p>
        </div>

        {/* 🔥 IMPORTANT FIX */}
        <div style={styles.featureCard} onClick={() => navigate("/personality")}>
          🧠
          <p>Personality AI</p>
        </div>

       <div style={styles.featureCard} onClick={() => navigate("/recommendations")}>
    🎯
    <p>Recommendations</p>
  </div>

        <div style={styles.featureCard} onClick={() => navigate("/camera")}>
          📷
          <p>Camera Mood</p>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    minHeight: "100vh",
    textAlign: "center",
  },

  grid: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "30px",
    flexWrap: "wrap"
  },

  card: {
    background: "rgba(255,255,255,0.25)",
    padding: "25px",
    borderRadius: "18px",
    width: "220px",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255,255,255,0.3)",
  },

  bigCard: {
    background: "rgba(255,255,255,0.25)",
    padding: "30px",
    borderRadius: "18px",
    marginTop: "30px",
    backdropFilter: "blur(15px)",
  },

  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  featureCard: {
    background: "rgba(255,255,255,0.3)",
    padding: "25px",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "600",
  },

  trait: {
    background: "#d1c4ff",
    padding: "4px 10px",
    borderRadius: "12px",
    margin: "3px",
    display: "inline-block",
    fontSize: "12px"
  }
};