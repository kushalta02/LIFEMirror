import { useState, useEffect, useRef } from "react";

export default function Chatbox({ initialMessage, onClose }) {

  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);
  const hasSent = useRef(false);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [chat, loading]);

  // Initial AI prompt
  useEffect(() => {
    if (initialMessage && !hasSent.current) {
      hasSent.current = true;
      sendMessage(initialMessage);
    }
  }, []);

  // Send message
  const sendMessage = async (customMessage) => {

    const finalMessage = customMessage || message;

    if (!finalMessage.trim()) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const personality =
      JSON.parse(localStorage.getItem("personality"));

    // Add user message instantly
    setChat((prev) => [
      ...prev,
      {
        role: "user",
        content: finalMessage
      }
    ]);

    setLoading(true);

    try {

      const res = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: finalMessage,
            mood: localStorage.getItem("mood"),
            personality: personality?.traits || [],
            email: user.email
          })
        }
      );

      const data = await res.json();

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply
        }
      ]);

    } catch (err) {

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I’m having trouble connecting right now."
        }
      ]);

    }

    setLoading(false);
    setMessage("");
  };

  return (
    <div style={styles.overlay}>

      <div style={styles.chatbox}>

        {/* Header */}
        <div style={styles.header}>

          <div style={styles.headerLeft}>
            <div style={styles.avatar}>
              🌿
            </div>

            <div>
              <h3 style={styles.aiName}>
                LifeMirror AI
              </h3>

              <p style={styles.status}>
                Online • Safe space to talk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={styles.close}
          >
            ✕
          </button>

        </div>

        {/* Messages */}
        <div style={styles.messages}>

          {chat.map((msg, i) => (

            <div
              key={i}
              style={{
                ...styles.messageRow,
                justifyContent:
                  msg.role === "user"
                    ? "flex-end"
                    : "flex-start"
              }}
            >

              <div
                style={{
                  ...styles.messageBubble,
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg,#38bdf8,#6366f1)"
                      : "#ffffff",
                  color:
                    msg.role === "user"
                      ? "#ffffff"
                      : "#0f172a"
                }}
              >
                {msg.content}
              </div>

            </div>

          ))}

          {loading && (
            <div style={styles.typing}>
              AI is typing...
            </div>
          )}

          <div ref={chatEndRef} />

        </div>

        {/* Input */}
        <div style={styles.inputBox}>

          <input
            style={styles.input}
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Share your thoughts..."
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
          />

          <button
            style={styles.sendBtn}
            onClick={() => sendMessage()}
          >
            Send
          </button>

        </div>

      </div>

    </div>
  );
}

const styles = {

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  },

  chatbox: {
    width: "420px",
    height: "650px",
    background: "#f8fafc",
    borderRadius: "30px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 25px 80px rgba(0,0,0,0.2)"
  },

  header: {
    padding: "18px",
    background:
      "linear-gradient(135deg,#dbeafe,#f0fdf4)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0"
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "24px"
  },

  aiName: {
    margin: 0,
    color: "#0f172a"
  },

  status: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px"
  },

  close: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
    color: "#334155"
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  messageRow: {
    display: "flex"
  },

  messageBubble: {
    maxWidth: "75%",
    padding: "14px 18px",
    borderRadius: "20px",
    lineHeight: "1.5",
    fontSize: "15px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
  },

  typing: {
    color: "#64748b",
    fontSize: "14px",
    paddingLeft: "10px"
  },

  inputBox: {
    display: "flex",
    gap: "10px",
    padding: "16px",
    borderTop: "1px solid #e2e8f0",
    background: "#ffffff"
  },

  input: {
    flex: 1,
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "15px",
    color: "#0f172a",
    background: "#ffffff"
  },

  sendBtn: {
    border: "none",
    padding: "14px 20px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#38bdf8,#6366f1)",
    color: "white",
    cursor: "pointer",
    fontWeight: "600"
  }

};