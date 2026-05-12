import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import { log } from "../utils/Logger";
import { useAuth } from "../context/AuthContext";
import { emitAppRefetch } from "../utils/AppRefetchBus";
import NotificationBanner from "../components/ui/NotificationBanner";
import {
  flushPendingNavigation,
  navigateByType,
} from "../navigation/NavigationRef";
import { requestNotificationPermission } from "../firebase/NotificationPermission";
import { FOREGROUND_TRAY_CHANNEL_ID } from "../firebase/BackgroundMessaging";
import { syncBadgeCountWithTray } from "../firebase/NotificationBadge";

export default function AppBootstrap() {
  const { isAuthenticated, authReady } = useAuth() as {
    isAuthenticated: boolean;
    authReady?: boolean;
  };

  const [notification, setNotification] = useState<{
    title?: string;
    body?: string;
    type?: string;
  } | null>(null);

  const currentNotificationRef = useRef<{
    title?: string;
    body?: string;
    type?: string;
  } | null>(null);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isFirstForeground = useRef(true);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldSaveToTray = useRef(true);

  // AppState + NetInfo
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          log("[APP] Returned to foreground");

          flushPendingNavigation();
          syncBadgeCountWithTray();

          if (isFirstForeground.current) {
            isFirstForeground.current = false;
            emitAppRefetch("foreground");
          } else {
            NetInfo.fetch().then((state) => {
              if (state.isConnected && state.isInternetReachable !== false) {
                emitAppRefetch("foreground");
              }
            });
          }
        }
        appState.current = nextState;
      },
    );

    const netInfoSubscription = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        log("[NET] Back online → refetch");
        emitAppRefetch("network");
      } else {
        log("[NET] Offline");
      }
    });

    return () => {
      appStateSubscription.remove();
      netInfoSubscription();
    };
  }, [isAuthenticated, authReady]);

  const showNotification = useCallback(
    (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      const title =
        typeof remoteMessage.notification?.title === "string"
          ? remoteMessage.notification.title
          : typeof remoteMessage.data?.title === "string"
          ? remoteMessage.data.title
          : undefined;
      const body =
        typeof remoteMessage.notification?.body === "string"
          ? remoteMessage.notification.body
          : typeof remoteMessage.data?.body === "string"
          ? remoteMessage.data.body
          : undefined;
      const type =
        typeof remoteMessage.data?.type === "string"
          ? remoteMessage.data.type
          : undefined;
      const orderId =
        typeof remoteMessage.data?.orderId === "string"
          ? remoteMessage.data.orderId
          : undefined;

      if (!title && !body) return;

      currentNotificationRef.current = { title, body, type };
      shouldSaveToTray.current = true;
      setNotification({ title, body, type });
      emitAppRefetch("notification");

      if (dismissTimer.current) clearTimeout(dismissTimer.current);

      dismissTimer.current = setTimeout(async () => {
        setNotification(null);
        currentNotificationRef.current = null; // ← clear ref sau khi dismiss
        if (!shouldSaveToTray.current) return;

        try {
          await notifee.displayNotification({
            title,
            body,
            data: { type: type ?? "", orderId: orderId ?? "" },
            android: {
              channelId: FOREGROUND_TRAY_CHANNEL_ID,
              importance: AndroidImportance.LOW,
              pressAction: { id: "default" },
              smallIcon: "ic_launcher",
              timestamp: Date.now(),
              showTimestamp: true,
            },
          });
          await syncBadgeCountWithTray();
        } catch (error) {
          log("[Notifee] Failed to save to tray", error);
        }
      }, 5000);
    },
    [],
  );

  // Xin quyền notification sau khi đã có phiên đăng nhập
  useEffect(() => {
    if (!authReady || !isAuthenticated) return;

    requestNotificationPermission();
  }, [authReady, isAuthenticated]);

  // FCM foreground + Notifee foreground event
  useEffect(() => {
    const unsubscribeFCM = messaging().onMessage(async (remoteMessage) => {
      log("[FCM] Foreground message", remoteMessage);
      showNotification(remoteMessage);
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const notifType = detail.notification?.data?.type as string | undefined;
        log("[Notifee] foreground press, type:", notifType);
        flushPendingNavigation();
        if (notifType) navigateByType(notifType);
      }

      if (type === EventType.APP_BLOCKED || type === EventType.DISMISSED) {
        flushPendingNavigation();
      }

      if (type === EventType.PRESS || type === EventType.DISMISSED) {
        syncBadgeCountWithTray();
      }
    });

    return () => {
      unsubscribeFCM();
      unsubscribeNotifee();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [showNotification]);

  return notification ? (
    <NotificationBanner
      title={notification.title}
      body={notification.body}
      onClose={() => {
        shouldSaveToTray.current = false;
        const type = currentNotificationRef.current?.type;
        currentNotificationRef.current = null;
        setNotification(null);
        if (type) navigateByType(type);
      }}
    />
  ) : null;
}
