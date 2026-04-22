import messaging from "@react-native-firebase/messaging";
import { log } from "../utils/Logger";
import { Platform } from "react-native";
import notifee, { AndroidImportance } from "@notifee/react-native";

const CHANNEL_ID = "default_high";

// Tạo channel async đúng cách
async function setupChannel() {
  if (Platform.OS === "android") {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: "Thông báo quan trọng",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
    });
  }
}

// Gọi ngay khi module load
setupChannel();

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  log("[FCM] background message received", remoteMessage);

  const title =
    remoteMessage.notification?.title ??
    (remoteMessage.data?.title as string | undefined);
  const body =
    remoteMessage.notification?.body ??
    (remoteMessage.data?.body as string | undefined);

  if (!title && !body) return;

  // Dùng notifee hiển thị heads-up thay vì để FCM tự hiện
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: "default" },
      smallIcon: "ic_launcher", // tên icon trong android/app/src/main/res
    },
  });
});
