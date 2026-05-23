import { StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

type SafetyNoticeProps = {
  message?: string;
};

export function SafetyNotice({
  message = "Tu ubicacion exacta no se comparte publicamente. Los chats de lugar estan pensados para conversaciones locales y seguras."
}: SafetyNoticeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seguridad primero</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5eadf",
    borderColor: "#e2c8b7",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  title: {
    color: UI_COLORS.coral,
    fontSize: 13,
    fontWeight: "800"
  },
  message: {
    color: UI_COLORS.text,
    fontSize: 14,
    lineHeight: 20
  }
});
