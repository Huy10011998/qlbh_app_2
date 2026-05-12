import { createNavigationContainerRef } from "@react-navigation/native";
import { log } from "../utils/Logger";
import { emitAppRefetch } from "../utils/AppRefetchBus";

export const navigationRef = createNavigationContainerRef<any>();

const TYPE_TO_ROUTE: Record<string, { tab: string; screen: string }> = {
  ORDER_PENDING: {
    tab: "OrderBrowsingTab",
    screen: "OrderBrowsing",
  },
  ORDER_READY: {
    tab: "ListOfDishesAlreadyServedTab",
    screen: "ListOfDishesAlreadyServed",
  },
};

let pendingNavigationType: string | null = null;

export function setPendingNavigation(type: string) {
  log("[NAV] setPendingNavigation:", type);
  pendingNavigationType = type;
}

export function clearPendingNavigation() {
  // ← dùng function thay vì assign
  log("[NAV] clearPendingNavigation");
  pendingNavigationType = null;
}

export function flushPendingNavigation() {
  log("[NAV] flushPendingNavigation, pending:", pendingNavigationType);
  if (pendingNavigationType) {
    const type = pendingNavigationType;
    pendingNavigationType = null;
    navigateByType(type);
  }
}

export function navigateByType(type: string) {
  const route = TYPE_TO_ROUTE[type];
  if (!route) return;

  const doNavigate = () => {
    navigationRef.navigate("Tabs", {
      screen: route.tab,
      params: { screen: route.screen },
    });
    setTimeout(() => emitAppRefetch("notification"), 300);
  };

  if (navigationRef.isReady()) {
    doNavigate();
  } else {
    const unsub = navigationRef.addListener("state", () => {
      unsub();
      setTimeout(doNavigate, 300);
    });
  }
}
