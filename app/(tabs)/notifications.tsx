import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { UI_COLORS } from "../../lib/constants";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead
} from "../../services/notifications";
import type { InAppNotification } from "../../types/notifications";

const TYPE_LABELS: Record<string, string> = {
  group_join_request: "Grupo",
  group_member_approved: "Grupo",
  group_member_rejected: "Grupo",
  event_rsvp_changed: "Evento",
  report_created: "Moderación",
  report_status_changed: "Moderación",
  geofence_blocked_post: "Geofence",
  topic_trending: "Tendencia"
};

const TYPE_COLORS: Record<string, string> = {
  group_join_request: UI_COLORS.teal,
  group_member_approved: "#22a547",
  group_member_rejected: UI_COLORS.coral,
  event_rsvp_changed: UI_COLORS.amber,
  report_created: UI_COLORS.coral,
  report_status_changed: UI_COLORS.amber,
  geofence_blocked_post: UI_COLORS.textMuted,
  topic_trending: UI_COLORS.primary
};

const TYPE_ICONS: Record<string, string> = {
  group_join_request: "👋",
  group_member_approved: "✅",
  group_member_rejected: "❌",
  event_rsvp_changed: "📅",
  report_created: "🚩",
  report_status_changed: "🔔",
  geofence_blocked_post: "📍",
  topic_trending: "🔥"
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function NotificationItem({
  notification,
  onPress
}: {
  notification: InAppNotification;
  onPress: (id: string) => void;
}) {
  const tag = TYPE_LABELS[notification.type] ?? "Info";
  const tagColor = TYPE_COLORS[notification.type] ?? UI_COLORS.textMuted;
  const icon = TYPE_ICONS[notification.type] ?? "🔔";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(notification.id)}
      style={({ pressed }) => [
        styles.item,
        !notification.isRead && styles.itemUnread,
        pressed && styles.pressed
      ]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.itemIcon}>{icon}</Text>
        {!notification.isRead && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemHeader}>
          <View style={[styles.tag, { backgroundColor: tagColor + "22" }]}>
            <Text style={[styles.tagText, { color: tagColor }]}>{tag}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(notification.createdAt)}</Text>
        </View>
        <Text style={styles.title}>{notification.title}</Text>
        {notification.body ? (
          <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const [notifs, count] = await Promise.all([
      getMyNotifications(),
      getUnreadNotificationCount()
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, [load]);

  async function handlePress(id: string) {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.isRead) return;
    const ok = await markNotificationRead(id);
    if (ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>Avisos</Text>
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : String(unreadCount)}</Text>
              </View>
            ) : null}
          </View>
          {unreadCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleMarkAllRead}
              style={({ pressed }) => [styles.markAllBtn, pressed && styles.pressed]}
            >
              <Text style={styles.markAllText}>Marcar todas leídas</Text>
            </Pressable>
          ) : null}
        </View>

        {isLoading ? <LoadingState label="Cargando avisos" /> : null}

        {!isLoading && notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Aún no hay avisos"
            description="Cuando alguien interactúe contigo en un grupo, evento o lugar, aparecerá aquí."
          />
        ) : null}

        {!isLoading && notifications.length > 0 ? (
          <View style={styles.list}>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onPress={handlePress} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: UI_COLORS.background,
    flex: 1
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 32
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  screenTitle: {
    color: UI_COLORS.text,
    fontSize: 28,
    fontWeight: "900"
  },
  badge: {
    backgroundColor: UI_COLORS.coral,
    borderRadius: 999,
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  markAllBtn: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  markAllText: {
    color: UI_COLORS.primary,
    fontSize: 12,
    fontWeight: "700"
  },
  pressed: {
    opacity: 0.78
  },
  list: {
    gap: 2
  },
  item: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14
  },
  itemUnread: {
    backgroundColor: "#f0f8f5",
    borderColor: UI_COLORS.teal + "55"
  },
  iconWrap: {
    alignItems: "center",
    position: "relative",
    width: 36
  },
  itemIcon: {
    fontSize: 22
  },
  unreadDot: {
    backgroundColor: UI_COLORS.coral,
    borderRadius: 5,
    height: 8,
    position: "absolute",
    right: 0,
    top: 0,
    width: 8
  },
  itemBody: {
    flex: 1,
    gap: 5
  },
  itemHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800"
  },
  time: {
    color: UI_COLORS.textMuted,
    fontSize: 11
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19
  },
  body: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18
  }
});
