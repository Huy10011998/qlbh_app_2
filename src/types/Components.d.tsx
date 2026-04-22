import { StyleProp, ViewStyle } from "react-native";
import { Transaction } from "./Api.d";

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

export type ListItem =
  | { kind: "dateHeader"; date: string; thu: number; chi: number }
  | {
      children: any;
      kind: "categoryHeader";
      category: string;
      count: number;
      amount: number;
      type: "thu" | "chi";
    }
  | { kind: "row"; data: Transaction };

export type ViewMode = "date" | "category";
