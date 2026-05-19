import { useEffect } from "react";
import { RefetchSource, subscribeAppRefetch } from "../utils/AppRefetchBus";

const DEFAULT_REFETCH_SOURCES: RefetchSource[] = [
  "network",
  "foreground",
  "notification",
];

export const useAppRefetch = (
  refetchFn: (source: RefetchSource) => void,
  sources: RefetchSource[] = DEFAULT_REFETCH_SOURCES,
) => {
  useEffect(() => {
    const unsubscribe = subscribeAppRefetch((source) => {
      if (sources.includes(source)) {
        refetchFn(source);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refetchFn, sources]);
};
