import { StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
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
    padding: 20
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
  }
});
