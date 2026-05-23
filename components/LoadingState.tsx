import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Cargando comunidad" }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={UI_COLORS.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    padding: 24
  },
  label: {
    color: UI_COLORS.textMuted,
    fontSize: 14
  }
});
