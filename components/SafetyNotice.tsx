import { StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

export type SafetyNoticeTone = "default" | "place" | "event" | "critical";

type SafetyNoticeProps = {
  title?: string;
  message?: string;
  tone?: SafetyNoticeTone;
};

const TONE_STYLES: Record<SafetyNoticeTone, { background: string; border: string; titleColor: string; defaultTitle: string }> = {
  default: {
    background: "#f5eadf",
    border: "#e2c8b7",
    titleColor: UI_COLORS.coral,
    defaultTitle: "Seguridad primero"
  },
  place: {
    background: "#eef2ec",
    border: "#cfd9cd",
    titleColor: UI_COLORS.primaryDark,
    defaultTitle: "Chat de lugar"
  },
  event: {
    background: "#fff1d8",
    border: "#e6c98a",
    titleColor: UI_COLORS.amber,
    defaultTitle: "Encuentro presencial"
  },
  critical: {
    background: "#fbe5e0",
    border: "#e2a89a",
    titleColor: UI_COLORS.danger,
    defaultTitle: "Atencion"
  }
};

export function SafetyNotice({
  title,
  message = "Tu ubicacion exacta no se comparte publicamente. Los chats de lugar estan pensados para conversaciones locales y seguras.",
  tone = "default"
}: SafetyNoticeProps) {
  const palette = TONE_STYLES[tone];

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: palette.background, borderColor: palette.border }]}
    >
      <Text style={[styles.title, { color: palette.titleColor }]}>{title ?? palette.defaultTitle}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  title: {
    fontSize: 13,
    fontWeight: "800"
  },
  message: {
    color: UI_COLORS.text,
    fontSize: 14,
    lineHeight: 20
  }
});
