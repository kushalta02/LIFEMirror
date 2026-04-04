import { useEffect, useState } from "react";

export default function Recommendations() {
  const [recs, setRecs] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/recommendations/${user.email}`)
      .then(res => res.json())
      .then(data => setRecs(data.recommendations));
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>🎯 Smart Recommendations</h1>

      {recs.map((r, i) => (
        <div key={i} style={{
          background: "#eee",
          margin: "10px",
          padding: "15px",
          borderRadius: "10px"
        }}>
          {r}
        </div>
      ))}
    </div>
  );
}