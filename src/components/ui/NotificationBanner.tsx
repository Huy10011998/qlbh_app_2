import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";

export type NotificationBannerProps = {
  title?: string;
  body?: string;
  onClose: () => void;
};

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  title,
  body,
  onClose,
}) => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setTime(`${hours}:${minutes}`);
  }, []);

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onClose}
      activeOpacity={0.9}
    >
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/logo-ecohost.jpg")}
          style={styles.logo}
        />
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.title}>
              {title || "Thông báo"}
            </Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text numberOfLines={2} style={styles.body}>
            {body || "Bạn có một thông báo mới."}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brandGreen,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  body: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
});

export default NotificationBanner;
