import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Dashboard() {

  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const userData =
      localStorage.getItem("user");

    if (!userData) {
      navigate("/");
      return;
    }

    const user = JSON.parse(userData);

    const localPersonality =
      JSON.parse(
        localStorage.getItem("personality")
      );

    fetch(
      `http://127.0.0.1:8000/dashboard/${user.email}`
    )
      .then((res) => res.json())
      .then((res) => {

        if (localPersonality) {
          res.traits =
            localPersonality.traits || res.traits;
        }

        setData(res);
        setLoading(false);
      });

  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.loader}>
        Loading your wellness space...
      </div>
    );
  }

  return (

    <div style={styles.page}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>

        <h2 style={styles.logo}>
          LifeMirror
        </h2>

        <div style={styles.menu}>

          <div
            style={styles.menuItem}
            onClick={() => navigate("/dashboard")}
          >
            🏠 Dashboard
          </div>

          <div
            style={styles.menuItem}
            onClick={() => navigate("/journal")}
          >
            📝 Journal
          </div>

          <div
            style={styles.menuItem}
            onClick={() => navigate("/chat")}
          >
            🤖 AI Assistant
          </div>

          <div
            style={styles.menuItem}
            onClick={() => navigate("/personality")}
          >
            🧠 Personality
          </div>

          <div
            style={styles.menuItem}
            onClick={() => navigate("/recommendations")}
          >
            🎯 Recommendations
          </div>

          <div
            style={styles.menuItem}
            onClick={() => navigate("/camera")}
          >
            📷 Camera Mood
          </div>

        </div>

      </div>

      {/* MAIN CONTENT */}
      <div style={styles.main}>

        {/* HERO */}
        <div style={styles.hero}>

          <div>

            <h1 style={styles.title}>
              Welcome Back 👋
            </h1>

            <p style={styles.subtitle}>
              Your emotional wellness overview
              is ready today.
            </p>

          </div>

          <div style={styles.heroBadge}>
            🌿 AI Wellness Active
          </div>

        </div>

        {/* TOP STATS */}
        <div style={styles.statsGrid}>

          <div style={styles.statCard}>
            <h3>😊 Current Mood</h3>
            <p style={styles.bigText}>
              {data?.mood}
            </p>
          </div>

          <div style={styles.statCard}>
            <h3>🔮 AI Prediction</h3>
            <p style={styles.bigText}>
              {data?.prediction}
            </p>
          </div>

          <div style={styles.statCard}>
            <h3>🧠 Personality</h3>

            <p>
              {data?.personality}
            </p>

            <div style={styles.traitsContainer}>
              {data?.traits?.map((t, i) => (

                <span
                  key={i}
                  style={styles.trait}
                >
                  {t}
                </span>

              ))}
            </div>

          </div>

        </div>

        {/* CHART */}
        <div style={styles.chartCard}>

          <div style={styles.chartHeader}>
            <h2>
              Emotional Trend
            </h2>

            <span>
              Last Sessions
            </span>
          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <LineChart
              data={
                data?.history?.map((val, i) => ({
                  index: i + 1,
                  mood: val
                }))
              }
            >

              <XAxis dataKey="index" />

              <YAxis
                domain={[-1, 1]}
                tickFormatter={(value) => {
                  if (value === -1)
                    return "Negative";

                  if (value === 0)
                    return "Neutral";

                  if (value === 1)
                    return "Positive";
                }}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="mood"
                stroke="#6366f1"
                strokeWidth={4}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        {/* FEATURE GRID */}
        <h2 style={styles.featureTitle}>
          Explore Features ✨
        </h2>

        <div style={styles.featureGrid}>

          {[
            {
              icon: "📝",
              label: "Journal",
              route: "/journal"
            },
            {
              icon: "🤖",
              label: "AI Assistant",
              route: "/chat"
            },
            {
              icon: "🧠",
              label: "Personality",
              route: "/personality"
            },
            {
              icon: "🎯",
              label: "Recommendations",
              route: "/recommendations"
            },
            {
              icon: "📷",
              label: "Camera Mood",
              route: "/camera"
            }
          ].map((item, i) => (

            <div
              key={i}
              style={styles.featureCard}
              onClick={() =>
                navigate(item.route)
              }
            >

              <div style={styles.featureIcon}>
                {item.icon}
              </div>

              <p>
                {item.label}
              </p>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

const styles = {

  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "Inter, sans-serif"
  },

  sidebar: {
    width: "260px",
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    padding: "30px",
    display: "flex",
    flexDirection: "column"
  },

  logo: {
    color: "#0f172a",
    marginBottom: "40px"
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  menuItem: {
    padding: "14px",
    borderRadius: "14px",
    cursor: "pointer",
    color: "#334155",
    transition: "0.3s"
  },

  main: {
    flex: 1,
    padding: "40px"
  },

  hero: {
    background:
      "linear-gradient(135deg,#dbeafe,#f0fdf4)",
    padding: "35px",
    borderRadius: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  title: {
    margin: 0,
    fontSize: "42px",
    color: "#0f172a"
  },

  subtitle: {
    color: "#475569",
    marginTop: "10px"
  },

  heroBadge: {
    background: "#ffffff",
    padding: "12px 18px",
    borderRadius: "20px",
    fontWeight: "600",
    color:'#0f172a'
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: "20px",
    marginTop: "30px"
  },

  statCard: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "24px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.05)",
    color:'#0f172a'
  },

  bigText: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#6366f1"
  },

  traitsContainer: {
    marginTop: "12px"
  },

  trait: {
    background: "#ede9fe",
    color: "#5b21b6",
    padding: "6px 12px",
    borderRadius: "14px",
    display: "inline-block",
    margin: "4px",
    fontSize: "13px"
  },

  chartCard: {
    background: "#ffffff",
    marginTop: "30px",
    borderRadius: "28px",
    padding: "30px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.05)"
  },

  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px"
  },

  featureTitle: {
    marginTop: "40px",
    color: "#0f172a"
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: "20px",
    marginTop: "20px",
    // color:'#0f172a'
  },

  featureCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "30px",
    textAlign: "center",
    cursor: "pointer",
    transition: "0.3s",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.05)",
    color:'#0f172a'
  },

  featureIcon: {
    fontSize: "40px",
    marginBottom: "10px"
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "22px",
    background: "#f8fafc"
  }

};