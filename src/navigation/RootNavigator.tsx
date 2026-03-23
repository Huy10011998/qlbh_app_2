import React from "react";
import { Platform } from "react-native";
import AppNavigator from "./AppNavigator.tsx";
import AuthNavigator from "./AuthNavigator.tsx";
import IsLoading from "../components/ui/IconLoading.tsx";
import { useAuth } from "../context/AuthContext.tsx";

export default function RootNavigator() {
  const { isAuthenticated, isLoading, iosAuthenticated, authReady } = useAuth();

  if (!authReady || isLoading) {
    return <IsLoading />;
  }

  if (Platform.OS === "android") {
    return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
  }

  if (Platform.OS === "ios") {
    if (!isAuthenticated) return <AuthNavigator />;
    if (!iosAuthenticated) return <AuthNavigator />;
    return <AppNavigator />;
  }

  return null;
}
