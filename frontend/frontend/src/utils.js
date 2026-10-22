import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

export function logout() {
  sessionStorage.removeItem("access_token");
  localStorage.removeItem("user");
  localStorage.removeItem("personality");
  localStorage.removeItem("mood");
  window.dispatchEvent(new Event("lifemirror:logout"));
}

export function useSessionTimeout() {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const endSession = () => {
      logout();
      navigate("/", { replace: true, state: { reason: "timeout" } });
    };

    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(endSession, INACTIVITY_LIMIT);
    };

    // A token is required now that /dashboard is protected.
    if (!sessionStorage.getItem("access_token")) {
      logout();
      navigate("/", { replace: true });
      return undefined;
    }

    const activityEvents = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, resetTimer, { passive: true })
    );

    const onManualLogout = () => navigate("/", { replace: true });
    window.addEventListener("lifemirror:logout", onManualLogout);

    resetTimer();

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, resetTimer)
      );
      window.removeEventListener("lifemirror:logout", onManualLogout);
    };
  }, [navigate]);
}