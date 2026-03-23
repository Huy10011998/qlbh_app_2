import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Headers
import { HeaderDetails } from "../components/header/HeaderDetails";
import HeaderHome from "../components/header/HeaderHome";

// Screens
import { RootStackParamList } from "../types/Navigator.d";
import HomeScreen from "../screens/Home/HomeScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerWithBack = HeaderDetails({ showBackButton: true });

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          header: () => <HeaderHome />,
        }}
      />
    </Stack.Navigator>
  );
}
