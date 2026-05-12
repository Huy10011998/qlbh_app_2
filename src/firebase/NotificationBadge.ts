import notifee from "@notifee/react-native";
import { log } from "../utils/Logger";

export async function syncBadgeCountWithTray() {
  try {
    const displayedNotifications = await notifee.getDisplayedNotifications();
    await notifee.setBadgeCount(displayedNotifications.length);
  } catch (error) {
    log("[Notification] sync badge failed", error);
  }
}

export async function clearNotificationBadge() {
  try {
    await notifee.setBadgeCount(0);
  } catch (error) {
    log("[Notification] clear badge failed", error);
  }
}
