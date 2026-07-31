import { useEffect } from "react";

export type RefreshOptions = {
  background?: boolean;
};

export function useRefreshOnFocus(
  refresh: (options?: RefreshOptions) => void | Promise<void>,
): void {
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh({ background: true });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);
}
