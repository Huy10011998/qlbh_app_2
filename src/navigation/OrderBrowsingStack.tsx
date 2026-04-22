import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderDetails } from "../components/header/HeaderDetails";
import OrderBrowsingScreen from "../screens/Order/OrderBrowsingScreen";

const Stack = createNativeStackNavigator();

export default function OrderBrowsingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Setting"
        component={OrderBrowsingScreen}
        options={{
          title: "Duyệt đơn hàng",
          ...HeaderDetails({ showBackButton: false }),
        }}
      />
    </Stack.Navigator>
  );
}
