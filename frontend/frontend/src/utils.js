
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  localStorage.removeItem("session_started_at");
  localStorage.removeItem("personality");
  localStorage.removeItem("mood");

  window.location.replace("/");
}

export function useSessionTimeout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    let timeoutId;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT);
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [navigate]);
}
