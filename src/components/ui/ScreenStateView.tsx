import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, fontSizes, radii } from "../../constants/theme";

type ScreenStateViewProps = {
  loading?: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
  color?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  actionStyle?: StyleProp<ViewStyle>;
  actionTextStyle?: StyleProp<TextStyle>;
};

const ScreenStateView: React.FC<ScreenStateViewProps> = ({
  loading,
  title,
  subtitle,
  icon,
  actionLabel,
  onActionPress,
  color = colors.teal,
  containerStyle,
  titleStyle,
  subtitleStyle,
  actionStyle,
  actionTextStyle,
}) => (
  <View style={[styles.container, containerStyle]}>
    {loading ? <ActivityIndicator size="large" color={color} /> : icon}
    {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}
    {subtitle ? (
      <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
    ) : null}
    {actionLabel && onActionPress ? (
      <TouchableOpacity
        style={[styles.action, { backgroundColor: color }, actionStyle]}
        onPress={onActionPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.actionText, actionTextStyle]}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: fontSizes.md,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  action: {
    borderRadius: radii.pill,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  actionText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
});

export default ScreenStateView;
