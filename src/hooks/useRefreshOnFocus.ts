import { useEffect } from "react";

export function useRefreshOnFocus(refresh: () => void | Promise<void>): void {
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);
}
