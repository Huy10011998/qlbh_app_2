import { useEffect } from "react";
import { subscribeAppRefetch } from "../utils/AppRefetchBus";

export const useAppRefetch = (refetchFn: () => void) => {
  useEffect(() => {
    const unsubscribe = subscribeAppRefetch((source) => {
      if (source === "network" || source === "foreground") {
        refetchFn();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refetchFn]);
};
