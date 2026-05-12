import React, { useCallback } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import AppBootstrap from "./src/app/AppBootstrap";
import {
  clearPendingNavigation,
  navigateByType,
  navigationRef,
} from "./src/navigation/NavigationRef";
import notifee from "@notifee/react-native";
import { log } from "./src/utils/Logger";

export default function App() {
  const onNavigationReady = useCallback(() => {
    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification) {
        const type = initialNotification.notification?.data?.type as
          | string
          | undefined;
        log("[App] getInitialNotification type:", type);
        if (type) {
          clearPendingNavigation();
          setTimeout(() => navigateByType(type), 300);
        }
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        translucent={false}
        backgroundColor="#0F4D3A"
        barStyle="light-content"
      />
      <AuthProvider>
        <AppBootstrap />
        <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
