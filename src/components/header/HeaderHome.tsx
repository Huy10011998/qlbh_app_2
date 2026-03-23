import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { StackNavigation } from "../../types/Navigator.d";

export default function HeaderHome() {
  const navigation = useNavigation<StackNavigation<"Tabs">>();
  const insets = useSafeAreaInsets();

  const handleOpenWebsite = () => {
    Linking.openURL(
      "https://www.facebook.com/profile.php?id=61584721529996&locale=vi_VN",
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A3D2E" />
      <LinearGradient
        colors={["#0A3D2E", "#0F4D3A", "#186249"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}
      >
        {/* Decorative accent line */}
        <View style={styles.accentLine} />

        {/* LOGO */}
        <TouchableOpacity
          onPress={handleOpenWebsite}
          activeOpacity={0.85}
          style={styles.logoWrapper}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo-ecohost.jpg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          {/* Subtle glow under logo */}
          <View style={styles.logoGlow} />
        </TouchableOpacity>

        {/* ICONS */}
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Tabs")}
            activeOpacity={0.75}
          >
            <View style={styles.iconInner}>
              <Ionicons name="home" size={20} color="#0F4D3A" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    // Shadow iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,

    // Shadow Android
    elevation: 8,
  },

  // Thin accent line ở bottom header
  accentLine: {
    position: "absolute",
    bottom: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 1,
  },

  logoWrapper: {
    position: "relative",
  },

  logoContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,

    // Shadow cho logo card
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  logo: {
    width: 118,
    height: 38,
  },

  // Glow dưới logo (chỉ hiển thị trên iOS nhờ shadow)
  logoGlow: {
    position: "absolute",
    bottom: -4,
    left: 10,
    right: 10,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    // iOS blur-like
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconButton: {
    // Viền mờ tạo chiều sâu
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 22,
    padding: 2,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  iconInner: {
    backgroundColor: "#fff",
    borderRadius: 18,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
