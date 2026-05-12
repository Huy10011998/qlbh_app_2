import React, { useCallback, useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subscribeAppRefetch } from "../utils/AppRefetchBus";
import { danhSachDatHangCaPhe } from "../services/data/CallApi";

import HomeStack from "./HomeStack";
import SettingStack from "./SettingStack";
import CashBookScreen from "../screens/CashBook/CashBookScreen";
import OrderBrowsingStack from "./OrderBrowsingStack";
import ListOfDishesAlreadyServedStack from "./ListOfDishesAlreadyServed";

const Tab = createBottomTabNavigator();
const TAB_HEIGHT = 56;

export default function Tabs() {
  const insets = useSafeAreaInsets();
  const [orderBadge, setOrderBadge] = useState<number>(0);
  const [listBadge, setListBadge] = useState<number>(0); // ← thêm

  const fetchBadge = useCallback(async () => {
    try {
      const [orderRes, listRes] = await Promise.all([
        danhSachDatHangCaPhe<any>(1),
        danhSachDatHangCaPhe<any>(4),
      ]);
      setOrderBadge(orderRes?.data?.items?.length ?? 0);
      setListBadge(listRes?.data?.items?.length ?? 0);
    } catch {
      setOrderBadge(0);
      setListBadge(0);
    }
  }, []);

  useEffect(() => {
    fetchBadge();

    const unsub = subscribeAppRefetch(() => {
      fetchBadge();
    });

    return () => {
      unsub();
    };
  }, [fetchBadge]);

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
          tabBarBadge: orderBadge > 0 ? orderBadge : undefined, // ← badge
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ListOfDishesAlreadyServedTab"
        component={ListOfDishesAlreadyServedStack}
        options={{
          title: "DS đã lên món",
          tabBarBadge: listBadge > 0 ? listBadge : undefined, // ← thêm
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkmark-circle" size={24} color={color} />
          ),
        }}
      />

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
  badge: {
    backgroundColor: "#FF3B30", // ← màu đỏ như iOS
    color: "#fff",
    fontSize: 11,
  },
});
