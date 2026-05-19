import React from "react";
import { RefreshControl } from "react-native";
import { colors } from "../../constants/theme";

type AppRefreshControlProps = {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
};

const AppRefreshControl: React.FC<AppRefreshControlProps> = ({
  refreshing,
  onRefresh,
  tintColor = colors.teal,
}) => (
  <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    colors={[tintColor]}
    tintColor={tintColor}
  />
);

export default AppRefreshControl;
