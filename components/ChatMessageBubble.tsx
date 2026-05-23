import { Pressable, StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";
import type { PlaceMessage } from "../types";

type ChatMessageBubbleProps = {
  message: PlaceMessage;
  onBlockUser?: (message: PlaceMessage) => void;
  onReport?: (message: PlaceMessage) => void;
  onOpenProfile?: (message: PlaceMessage) => void;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ChatMessageBubble({ message, onBlockUser, onReport, onOpenProfile }: ChatMessageBubbleProps) {
  const displayName = message.profile?.displayName ?? message.profile?.username ?? "Vecino local";

  return (
    <View style={styles.bubble}>
      <View style={styles.headerRow}>
        {onOpenProfile ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenProfile(message)} style={styles.nameButton}>
            <Text style={[styles.name, styles.nameLink]}>{displayName}</Text>
          </Pressable>
        ) : (
          <Text style={styles.name}>{displayName}</Text>
        )}
        <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
      </View>
      <Text style={styles.body}>{message.body}</Text>
      {message.moderationStatus !== "visible" ? (
        <Text style={styles.moderation}>Estado: {message.moderationStatus}</Text>
      ) : null}
      {onReport || onBlockUser ? (
        <View style={styles.actions}>
          {onReport ? (
            <Pressable accessibilityRole="button" onPress={() => onReport(message)} style={styles.actionButton}>
              <Text style={styles.actionText}>Reportar</Text>
            </Pressable>
          ) : null}
          {onBlockUser ? (
            <Pressable
              accessibilityRole="button"
              disabled={!message.userId}
              onPress={() => onBlockUser(message)}
              style={[styles.actionButton, !message.userId && styles.actionDisabled]}
            >
              <Text style={styles.actionText}>Bloquear</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  nameButton: {
    flex: 1
  },
  name: {
    color: UI_COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700"
  },
  nameLink: {
    color: UI_COLORS.primary,
    textDecorationLine: "underline"
  },
  time: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  },
  body: {
    color: UI_COLORS.text,
    fontSize: 15,
    lineHeight: 21
  },
  moderation: {
    color: UI_COLORS.danger,
    fontSize: 12,
    fontWeight: "700"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  actionButton: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  actionDisabled: {
    opacity: 0.45
  },
  actionText: {
    color: UI_COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800"
  }
});
