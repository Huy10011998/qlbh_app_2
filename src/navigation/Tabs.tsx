import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeStack from "./HomeStack";
import SettingStack from "./SettingStack";
import CashBookScreen from "../screens/CashBook/CashBookScreen";
import OrderBrowsingStack from "./OrderBrowsingStack";
import ListOfDishesAlreadyServedStack from "./ListOfDishesAlreadyServed";

const Tab = createBottomTabNavigator();

const TAB_HEIGHT = 56;

export default function Tabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        lazy: true,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#0F4D3A",
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      {/* HOME */}
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
          freezeOnBlur: true,
        }}
      />

      {/* DUYỆT ĐƠN ĐẶT HÀNG */}
      <Tab.Screen
        name="OrderBrowsingTab"
        component={OrderBrowsingStack}
        options={{
          title: "Duyệt đơn hàng",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
          ),
        }}
      />

      {/* DANH SÁCH ĐÃ LÊN MÓN */}
      <Tab.Screen
        name="ListOfDishesAlreadyServedTab"
        component={ListOfDishesAlreadyServedStack}
        options={{
          title: "DS đã lên món",
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkmark-circle" size={24} color={color} />
          ),
        }}
      />

      {/* SỔ QUỸ */}
      <Tab.Screen
        name="CashBookTab"
        component={CashBookScreen}
        options={{
          title: "Sổ quỹ",
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet-outline" size={24} color={color} />
          ),
        }}
      />

      {/* SETTING */}
      <Tab.Screen
        name="SettingTab"
        component={SettingStack}
        options={{
          title: "Cài đặt",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
