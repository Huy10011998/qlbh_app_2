import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderDetails } from "../components/header/HeaderDetails";
import OrderBrowsingScreen from "../screens/Order/OrderBrowsingScreen";
import ListOfDishesAlreadyServed from "../screens/ListOfDishesAlreadyServed/ListOfDishesAlreadyServedScreen";

const Stack = createNativeStackNavigator();

export default function ListOfDishesAlreadyServedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ListOfDishesAlreadyServed"
        component={ListOfDishesAlreadyServed}
        options={{
          title: "Danh sách đã lên món",
          ...HeaderDetails({ showBackButton: false }),
        }}
      />
    </Stack.Navigator>
  );
}
