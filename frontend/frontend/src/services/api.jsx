const API_URL = (
  import.meta.env.VITE_API_URL || "https://lifemirror-backend.onrender.com"
).replace(/\/$/, "");

export const sendMessage = async (message, mood = "neutral") => {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, mood }),
  });

  if (!res.ok) {
    throw new Error(`Chat API failed: ${res.status}`);
  }

  return res.json();
};