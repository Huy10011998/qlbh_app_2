import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import AppBootstrap from "./src/app/AppBootstrap";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        translucent={false}
        backgroundColor="#0F4D3A"
        barStyle="light-content"
      />
      <AuthProvider>
        <AppBootstrap />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
