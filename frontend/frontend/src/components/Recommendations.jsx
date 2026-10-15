import { useEffect, useState } from "react";

export default function Recommendations() {

  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  const user =
    JSON.parse(localStorage.getItem("user"));

  useEffect(() => {

    fetch(
      `http://127.0.0.1:8000/recommendations/${user.email}`
    )
      .then((res) => res.json())
      .then((data) => {

        setRecs(
          data.recommendations || []
        );

        setLoading(false);

      });

  }, [user.email]);

  // ICONS
  const icons = [
    "🌿",
    "🧘",
    "📖",
    "🎵",
    "☀️",
    "💤",
    "🚶",
    "💙"
  ];

  if (loading) {

    return (

      <div style={styles.loader}>
        Preparing personalized wellness tips...
      </div>

    );
  }

  return (

    <div style={styles.page}>

      {/* HERO */}
      <div style={styles.hero}>

        <h1 style={styles.title}>
          Smart Recommendations 🎯
        </h1>

        <p style={styles.subtitle}>
          Personalized wellness guidance
          designed for your emotional state.
        </p>

      </div>

      {/* MAIN CONTENT */}
      <div style={styles.content}>

        {/* LEFT INFO CARD */}
        <div style={styles.sideCard}>

          <h2 style={styles.sideTitle}>
            🌱 Daily Wellness
          </h2>

          <p style={styles.sideText}>
            Small consistent actions create
            emotional balance over time.
          </p>

          <div style={styles.quote}>
            “Progress is built one calm moment
            at a time.”
          </div>

        </div>

        {/* RECOMMENDATIONS */}
        <div style={styles.recSection}>

          {recs.length === 0 ? (

            <div style={styles.empty}>
              No recommendations available yet.
            </div>

          ) : (

            recs.map((r, i) => (

              <div
                key={i}
                style={styles.recCard}
              >

                <div style={styles.icon}>
                  {icons[i % icons.length]}
                </div>

                <div>

                  <h3 style={styles.recTitle}>
                    Recommendation {i + 1}
                  </h3>

                  <p style={styles.recText}>
                    {r}
                  </p>

                </div>

              </div>

            ))

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
    marginBottom: "50px"
  },

  title: {
    fontSize: "48px",
    color: "#0f172a",
    marginBottom: "12px"
  },

  subtitle: {
    color: "#64748b",
    fontSize: "18px",
    maxWidth: "700px",
    margin: "auto"
  },

  content: {
    maxWidth: "1200px",
    margin: "auto",
    display: "grid",
    gridTemplateColumns:
      "320px 1fr",
    gap: "30px"
  },

  sideCard: {
    background:
      "linear-gradient(135deg,#dbeafe,#f0fdf4)",
    borderRadius: "30px",
    padding: "30px",
    height: "fit-content"
  },

  sideTitle: {
    color: "#0f172a",
    marginBottom: "15px"
  },

  sideText: {
    color: "#334155",
    lineHeight: "1.7"
  },

  quote: {
    marginTop: "25px",
    background: "#ffffff",
    padding: "18px",
    borderRadius: "18px",
    fontStyle: "italic",
    color: "#475569"
  },

  recSection: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  recCard: {
    background: "#ffffff",
    borderRadius: "28px",
    padding: "24px",
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
    boxShadow:
      "0 12px 40px rgba(0,0,0,0.06)"
  },

  icon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#6366f1,#38bdf8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px",
    color: "#ffffff",
    flexShrink: 0
  },

  recTitle: {
    margin: 0,
    color: "#0f172a",
    marginBottom: "10px"
  },

  recText: {
    margin: 0,
    color: "#475569",
    lineHeight: "1.7"
  },

  empty: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "24px",
    textAlign: "center",
    color: "#64748b"
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "22px",
    background: "#f8fafc",
    color: "#334155"
  }

};