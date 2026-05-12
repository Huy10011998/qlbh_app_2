import { Linking, PermissionsAndroid, Platform } from "react-native";
import messaging from "@react-native-firebase/messaging";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { log } from "../utils/Logger";

let permissionRequestInFlight: Promise<boolean> | null = null;

const isAndroid13OrNewer = () => {
  if (Platform.OS !== "android") return false;
  const version =
    typeof Platform.Version === "number"
      ? Platform.Version
      : Number.parseInt(String(Platform.Version), 10);
  return version >= 33;
};

export const requestNotificationPermission = async () => {
  if (permissionRequestInFlight) return permissionRequestInFlight;

  permissionRequestInFlight = (async () => {
    try {
      if (Platform.OS === "android") {
        if (isAndroid13OrNewer()) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          log("[Notification] Android POST_NOTIFICATIONS", granted);
        }

        const settings = await notifee.requestPermission();
        const enabled =
          settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
        log("[Notification] Android settings", settings.authorizationStatus);
        return enabled;
      }

      const [fcmStatus, notifeeSettings] = await Promise.all([
        messaging().requestPermission(),
        notifee.requestPermission(),
      ]);

      const fcmEnabled =
        fcmStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        fcmStatus === messaging.AuthorizationStatus.PROVISIONAL;
      const notifeeEnabled =
        notifeeSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        notifeeSettings.authorizationStatus ===
          AuthorizationStatus.PROVISIONAL;

      log("[Notification] iOS permission status", {
        fcmStatus,
        notifeeStatus: notifeeSettings.authorizationStatus,
      });

      return fcmEnabled && notifeeEnabled;
    } catch (error) {
      log("[Notification] permission request failed", error);
      return false;
    } finally {
      permissionRequestInFlight = null;
    }
  })();

  return permissionRequestInFlight;
};

export const isNotificationPermissionEnabled = async () => {
  try {
    const settings = await notifee.getNotificationSettings();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    log("[Notification] get settings failed", error);
    return false;
  }
};

export const openNotificationPermissionSettings = async () => {
  try {
    await notifee.openNotificationSettings();
  } catch (error) {
    log("[Notification] open notification settings failed", error);
    await Linking.openSettings();
  }
};
