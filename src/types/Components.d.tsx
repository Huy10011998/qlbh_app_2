import { StyleProp, ViewStyle } from "react-native";

export type IsLoadingProps = {
  size?: "small" | "large";
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export type HeaderOptionsProps = {
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onMenuPress?: () => void;
};

export interface MenuItemCardProps extends MenuItemComponent {
  index: number;
}

export interface MenuItemComponent {
  id: string;
  label: string;
  iconName: string;
  notificationCount?: number;
  onPress?: () => void;
}
