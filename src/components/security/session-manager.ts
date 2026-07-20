import { useEffect, useRef } from "react";
import { appConfig } from "@/configuration/app-config";

export function useSessionManager({
  enabled,
  onWarning,
  onExpire,
}: {
  enabled: boolean;
  onWarning: (minutesRemaining: number) => void;
  onExpire: () => void | Promise<void>;
}) {
  const warned = useRef(false);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;
    const markActivity = () => {
      lastActivity.current = Date.now();
      warned.current = false;
    };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "focus"];
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    const timer = window.setInterval(() => {
      const elapsedMinutes = (Date.now() - lastActivity.current) / 60_000;
      const remaining = appConfig.sessionTimeoutMinutes - elapsedMinutes;
      if (remaining <= 0) {
        void onExpire();
        return;
      }
      if (!warned.current && remaining <= appConfig.sessionWarningMinutes) {
        warned.current = true;
        onWarning(Math.max(1, Math.ceil(remaining)));
      }
    }, 15_000);
    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, markActivity));
    };
  }, [enabled, onExpire, onWarning]);
}
