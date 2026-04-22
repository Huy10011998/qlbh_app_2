// AppBootstrap.tsx
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import notifee, { AndroidImportance } from "@notifee/react-native";
import { log } from "../utils/Logger";
import { useAuth } from "../context/AuthContext";
import { emitAppRefetch } from "../utils/AppRefetchBus";
import NotificationBanner from "../components/ui/NotificationBanner";

const CHANNEL_ID = "default_high";

export default function AppBootstrap() {
  const { isAuthenticated, authReady } = useAuth() as {
    isAuthenticated: boolean;
    authReady?: boolean;
  };

  const [notification, setNotification] = useState<{
    title?: string;
    body?: string;
  } | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isFirstForeground = useRef(true);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          log("[APP] Returned to foreground");

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
        log("[NET] Back online → refetch data");
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

  useEffect(() => {
    const showNotification = (
      remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    ) => {
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

      if (!title && !body) return;

      setNotification({ title, body });

      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }

      dismissTimer.current = setTimeout(async () => {
        setNotification(null);

        // Sau khi banner tự dismiss → lưu vào tray thiết bị
        try {
          await notifee.displayNotification({
            title,
            body,
            android: {
              channelId: CHANNEL_ID,
              importance: AndroidImportance.DEFAULT, // không heads-up lại, chỉ lưu tray
              pressAction: { id: "default" },
            },
          });
        } catch (error) {
          log("[Notifee] Failed to save notification to tray", error);
        }
      }, 5000);
    };

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      log("[FCM] Foreground message received", remoteMessage);
      showNotification(remoteMessage);
    });

    return () => {
      unsubscribe();
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const requestPermission = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        log("[FCM] permission status", authStatus, enabled);
      } catch (error) {
        log("[FCM] permission request failed", error);
      }
    };

    requestPermission();
  }, []);

  return notification ? (
    <NotificationBanner
      title={notification.title}
      body={notification.body}
      onClose={() => setNotification(null)}
    />
  ) : null;
}
