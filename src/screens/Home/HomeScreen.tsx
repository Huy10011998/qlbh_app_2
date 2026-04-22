import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { StackNavigation } from "../../types";

type SubItem = {
  id: string;
  label: string;
  iconName: string;
  onPress?: () => void;
};

type GroupItem = {
  id: string;
  label: string;
  description: string;
  iconName: string;
  color: string;
  subColor: string;
  subIconColor: string;
  onPress?: () => void;
  subItems: SubItem[];
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigation<"Tabs">>();

  const groups: GroupItem[] = [
    {
      id: "1",
      label: "Cà phê",
      description: "Quản lý kinh doanh cà phê",
      iconName: "cafe-outline",
      color: "#0F4D3A",
      subColor: "#E1F5EE",
      subIconColor: "#0F6E56",
      // onPress: () => navigation.navigate("Asset"),
      subItems: [
        { id: "1-1", label: "Hoá đơn", iconName: "receipt-outline" },
        { id: "1-2", label: "Sản phẩm", iconName: "shirt-outline" },
        { id: "1-3", label: "Đơn hàng", iconName: "bag-handle-outline" },
        { id: "1-4", label: "Nhập xuất", iconName: "swap-horizontal-outline" },
        { id: "1-5", label: "Báo cáo", iconName: "bar-chart-outline" },
      ],
    },
    {
      id: "2",
      label: "Sân pickleball",
      description: "Quản lý đặt sân",
      iconName: "tennisball-outline",
      color: "#1A5C8A",
      subColor: "#E6F1FB",
      subIconColor: "#185FA5",
      subItems: [
        { id: "2-1", label: "Đặt sân", iconName: "calendar-outline" },
        { id: "2-2", label: "Sổ quỹ", iconName: "wallet-outline" },
        { id: "2-3", label: "Hoá đơn", iconName: "receipt-outline" },
        { id: "2-4", label: "Danh mục", iconName: "list-outline" },
      ],
    },
    {
      id: "3",
      label: "Homestay",
      description: "Quản lý phòng & đặt chỗ",
      iconName: "home-outline",
      color: "#7A4A1E",
      subColor: "#FAECE7",
      subIconColor: "#993C1D",
      subItems: [
        { id: "3-1", label: "Đặt phòng", iconName: "calendar-outline" },
        { id: "3-2", label: "Hoá đơn", iconName: "receipt-outline" },
        { id: "3-3", label: "Sổ quỹ", iconName: "wallet-outline" },
        { id: "3-4", label: "Kho", iconName: "cube-outline" },
      ],
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {groups.map((group) => (
        <View key={group.id} style={styles.groupCard}>
          {/* Header nhóm */}
          <TouchableOpacity
            style={[styles.groupHeader, { backgroundColor: group.color }]}
            onPress={group.onPress}
            activeOpacity={0.85}
          >
            <View style={styles.groupIconCircle}>
              <Ionicons name={group.iconName} size={22} color="white" />
            </View>
            <View style={styles.groupTitleWrap}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              <Text style={styles.groupDesc}>{group.description}</Text>
            </View>
            <View style={styles.groupArrow}>
              <Ionicons name="chevron-forward" size={16} color="white" />
            </View>
          </TouchableOpacity>

          {/* Sub items — tự wrap khi > 4 */}
          <View style={styles.subGrid}>
            {group.subItems.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={styles.subItem}
                onPress={sub.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.subIconBox,
                    { backgroundColor: group.subColor },
                  ]}
                >
                  <Ionicons
                    name={sub.iconName}
                    size={16}
                    color={group.subIconColor}
                  />
                </View>
                <Text style={styles.subLabel}>{sub.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: "#F4F4F4",
    flexGrow: 1,
  },

  groupCard: {
    backgroundColor: "white",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },

  groupIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  groupTitleWrap: { flex: 1 },

  groupTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },

  groupDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
  },

  groupArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  subGrid: {
    flexDirection: "row",
    flexWrap: "wrap", // tự xuống hàng
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E5",
  },

  subItem: {
    width: "25%", // cố định 4 cột
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#E5E5E5",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },

  subIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  subLabel: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
  },
});

export default HomeScreen;
