import messaging from "@react-native-firebase/messaging";
import { NativeModules, Platform } from "react-native";
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidLaunchActivityFlag,
  EventType,
  AndroidVisibility,
} from "@notifee/react-native";
import { log } from "../utils/Logger";
import { setPendingNavigation } from "../navigation/NavigationRef";
import { syncBadgeCountWithTray } from "./NotificationBadge";
import { emitAppRefetch } from "../utils/AppRefetchBus";

export const CHANNEL_ID = "urgent_full_screen_v3";
export const FOREGROUND_TRAY_CHANNEL_ID = "foreground_tray_v1";
const URGENT_NOTIFICATION_TYPES = new Set(["ORDER_PENDING", "ORDER_READY"]);
const { NotificationWakeModule } = NativeModules;

function wakeScreenForUrgentNotification() {
  if (Platform.OS !== "android") return;
  try {
    NotificationWakeModule?.wakeScreen?.();
  } catch (error) {
    log("[Notification] wake screen failed", error);
  }
}

export async function createNotificationChannel() {
  await Promise.all([
    notifee.createChannel({
      id: CHANNEL_ID,
      name: "Thông báo quan trọng",
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500],
      lights: true,
      lightColor: "#FF6B00",
      visibility: AndroidVisibility.PUBLIC,
      sound: "default",
    }),
    notifee.createChannel({
      id: FOREGROUND_TRAY_CHANNEL_ID,
      name: "Thông báo trong ứng dụng",
      importance: AndroidImportance.LOW,
      vibration: false,
      lights: false,
      visibility: AndroidVisibility.PUBLIC,
    }),
  ]);
}

async function showLocalNotification(remoteMessage: any) {
  const title =
    remoteMessage.notification?.title ??
    (remoteMessage.data?.title as string | undefined);
  const body =
    remoteMessage.notification?.body ??
    (remoteMessage.data?.body as string | undefined);
  const type = remoteMessage.data?.type as string | undefined;
  const orderId = remoteMessage.data?.orderId as string | undefined;
  const isUrgent = type ? URGENT_NOTIFICATION_TYPES.has(type) : false;

  if (!title && !body) return;

  if (isUrgent) {
    wakeScreenForUrgentNotification();
  }

  await notifee.displayNotification({
    title,
    body,
    data: { type: type ?? "", orderId: orderId ?? "" },
    android: {
      channelId: isUrgent ? CHANNEL_ID : FOREGROUND_TRAY_CHANNEL_ID,
      importance: isUrgent ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
      category: isUrgent ? AndroidCategory.CALL : AndroidCategory.MESSAGE,
      visibility: AndroidVisibility.PUBLIC,
      pressAction: { id: "default" },
      smallIcon: "ic_launcher",
      timestamp: Date.now(),
      showTimestamp: true,
      vibrationPattern: isUrgent ? [300, 500] : undefined,
      lights: isUrgent ? ["#FF6B00", 300, 600] : undefined,
      fullScreenAction: isUrgent
        ? {
            id: "default",
            launchActivity: "com.qlbh_app_2.WakeLockActivity",
            launchActivityFlags: [
              AndroidLaunchActivityFlag.NEW_TASK,
              AndroidLaunchActivityFlag.NO_HISTORY,
            ],
          }
        : undefined,
    },
  });
  await syncBadgeCountWithTray();
  emitAppRefetch("notification");
}

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  log("[FCM] background/quit", remoteMessage);
  await showLocalNotification(remoteMessage);
});

// BackgroundMessaging.ts — bỏ hoàn toàn check getInitialNotification
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const notifType = detail.notification?.data?.type as string | undefined;
    log("[Notifee] onBackgroundEvent PRESS, notifType:", notifType);

    // Luôn set pending, để App.tsx hoặc AppBootstrap flush khi foreground
    if (notifType) {
      setPendingNavigation(notifType);
    }
  }

  if (type === EventType.PRESS || type === EventType.DISMISSED) {
    await syncBadgeCountWithTray();
  }
});
