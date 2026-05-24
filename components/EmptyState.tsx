import { Pressable, StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 24
  },
  icon: {
    fontSize: 32,
    marginBottom: 4
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  description: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  action: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  actionPressed: {
    opacity: 0.78
  },
  actionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  }
});
