import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
          <Text numberOfLines={1} style={styles.title}>
            {title || "Thông báo"}
          </Text>
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
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F4D3A",
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
});

export default NotificationBanner;
