import "./src/firebase/BackgroundMessaging";
import { createNotificationChannel } from "./src/firebase/BackgroundMessaging"; // ← import hàm đã viết sẵn
import notifee, { AndroidImportance } from "@notifee/react-native";
import { Platform } from "react-native";
import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

if (Platform.OS === "android") {
  // Tắt FCM fallback channel
  notifee.createChannel({
    id: "fcm_fallback_notification_channel",
    name: "FCM Fallback",
    importance: AndroidImportance.NONE,
  });

  // Dùng hàm từ BackgroundMessaging — đảm bảo cùng ID và config
  createNotificationChannel();
}

AppRegistry.registerComponent(appName, () => App);
