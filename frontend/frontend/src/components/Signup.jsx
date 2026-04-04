// Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleSignup = async () => {
    const res = await fetch("http://127.0.0.1:8000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    alert(data.message);

    if (data.message === "Signup successful") {
      navigate("/");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2>Signup</h2>

        <input placeholder="Name" onChange={e => setForm({...form, name: e.target.value})}/>
        <input placeholder="Email" onChange={e => setForm({...form, email: e.target.value})}/>
        <input type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})}/>

        <button onClick={handleSignup}>Signup</button>

        <p onClick={() => navigate("/")} style={styles.link}>
          Already have account? Login
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
  },
  box: {
    background: "#1e293b",
    padding: "30px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "300px",
    color: "white",
  },
  link: {
    cursor: "pointer",
    color: "#38bdf8"
  }
};