import { useState, useEffect, useRef } from "react";

export default function Chatbox({ initialMessage, onClose }) {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  // ONLY ONCE (fix double response)
  const hasSent = useRef(false);

useEffect(() => {
  if (initialMessage && !hasSent.current) {
    hasSent.current = true;
    sendMessage(initialMessage);
  }
}, []);

  const sendMessage = async () => {
  if (!message.trim()) return;

  const user = JSON.parse(localStorage.getItem("user"));
  const personality = JSON.parse(localStorage.getItem("personality"));

  const res = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      mood: localStorage.getItem("mood"),
      personality: personality?.traits || [],
      email: user.email
    })
  });

  const data = await res.json();

  setChat(prev => [...prev, 
    { role: "user", content: message },
    { role: "assistant", content: data.reply }
  ]);

  setMessage("");
};
  
  return (
    <div style={styles.overlay}>
      <div style={styles.chatbox}>
        <div style={styles.header}>
          <span>AI Assistant</span>
          <button onClick={onClose} style={styles.close}>
            ✖
          </button>
        </div>

        <div style={styles.messages}>
          {chat.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.msg,
                alignSelf:
                  msg.role === "user" ? "flex-end" : "flex-start",
                background:
                  msg.role === "user" ? "#22c55e" : "#334155",
              }}
            >
              {msg.text}
            </div>
          ))}

          {loading && <p>Typing...</p>}
          <div ref={chatEndRef} />
        </div>

        <div style={styles.inputBox}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type..."
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
          />
          <button onClick={() => sendMessage()}>Send</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  chatbox: {
    width: "400px",
    height: "500px",
    background: "#1e293b",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    color: "white",
  },
  header: {
    padding: "10px",
    background: "#0f172a",
    display: "flex",
    justifyContent: "space-between",
  },
  close: {
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  msg: {
    padding: "8px",
    borderRadius: "10px",
    maxWidth: "70%",
  },
  inputBox: {
    display: "flex",
    gap: "5px",
    padding: "10px",
  },
};