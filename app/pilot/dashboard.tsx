/**
 * app/pilot/dashboard.tsx
 * Stage 2F — Pilot Dashboard (internal only)
 *
 * Access: Visible only to users with is_moderator = true.
 * Full aggregate analytics require direct DB access with admin credentials.
 * This screen shows metrics visible through the authenticated user's scope.
 *
 * SECURITY: No PII, no coordinates, no secrets.
 */
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { UI_COLORS } from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import { getCurrentUserId } from "../../services/auth";

type EventCount = { event_name: string; count: number };
type FeedbackStat = { category: string; count: number; avg_rating: number };

type DashboardData = {
  totalEvents: number;
  eventsByType: EventCount[];
  last7Days: number;
  feedbackCount: number;
  feedbackByCategory: FeedbackStat[];
  avgRating: number | null;
  isModerator: boolean;
};

async function fetchDashboard(): Promise<DashboardData | null> {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId || !supabase) return null;

  // Check moderator status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_moderator")
    .eq("id", userId)
    .single();

  const isModerator = (profile as { is_moderator: boolean | null } | null)?.is_moderator === true;

  // Product events — own only via RLS (moderators see their own; admin DB access needed for full stats)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: eventsData } = await supabase
    .from("product_events")
    .select("event_name, created_at")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false });

  const events = (eventsData ?? []) as { event_name: string; created_at: string }[];

  const totalEvents = events.length;
  const last7Days = events.length;

  const countsByType: Record<string, number> = {};
  for (const e of events) {
    countsByType[e.event_name] = (countsByType[e.event_name] ?? 0) + 1;
  }
  const eventsByType: EventCount[] = Object.entries(countsByType)
    .map(([event_name, count]) => ({ event_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Pilot feedback — own only
  const { data: feedbackData } = await supabase
    .from("pilot_feedback")
    .select("category, rating, created_at");

  const feedback = (feedbackData ?? []) as { category: string | null; rating: number | null }[];
  const feedbackCount = feedback.length;

  const catStats: Record<string, { total: number; sum: number }> = {};
  let ratingSum = 0;
  let ratingCount = 0;
  for (const f of feedback) {
    const cat = f.category ?? "other";
    if (!catStats[cat]) catStats[cat] = { total: 0, sum: 0 };
    catStats[cat].total += 1;
    if (f.rating !== null) {
      catStats[cat].sum += f.rating;
      ratingSum += f.rating;
      ratingCount += 1;
    }
  }

  const feedbackByCategory: FeedbackStat[] = Object.entries(catStats)
    .map(([category, { total, sum }]) => ({
      category,
      count: total,
      avg_rating: total > 0 ? Math.round((sum / total) * 10) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null;

  return {
    totalEvents,
    eventsByType,
    last7Days,
    feedbackCount,
    feedbackByCategory,
    avgRating,
    isModerator
  };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function EventRow({ item }: { item: EventCount }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableKey} numberOfLines={1}>
        {item.event_name.replace(/_/g, " ")}
      </Text>
      <Text style={styles.tableVal}>{item.count}</Text>
    </View>
  );
}

export default function PilotDashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchDashboard().catch(() => null);
    setData(result);
  }, []);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load().catch(() => {});
    setRefreshing(false);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <LoadingState label="Cargando métricas de piloto…" />
      </SafeAreaView>
    );
  }

  if (!data || !data.isModerator) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </Pressable>
        </View>
        <EmptyState
          icon="🔒"
          title="Acceso restringido"
          description="Este panel es solo para moderadores y administradores del piloto."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Panel de piloto</Text>
          <View style={styles.modBadge}>
            <Text style={styles.modBadgeText}>🛡 Moderador</Text>
          </View>
          <Text style={styles.subtitle}>
            Métricas de actividad — últimos 7 días.{"\n"}
            Para analítica completa usa acceso directo a DB.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Eventos (7d)" value={data.last7Days} />
          <StatCard
            label="Puntuación media"
            value={data.avgRating !== null ? `${data.avgRating} ★` : "—"}
            sub="feedback propio"
          />
          <StatCard label="Feedbacks" value={data.feedbackCount} />
        </View>

        {data.eventsByType.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actividad por tipo (7d)</Text>
            <View style={styles.table}>
              {data.eventsByType.map((item) => (
                <EventRow key={item.event_name} item={item} />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actividad por tipo (7d)</Text>
            <Text style={styles.emptyNote}>Sin eventos en los últimos 7 días.</Text>
          </View>
        )}

        {data.feedbackByCategory.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback por categoría</Text>
            <View style={styles.table}>
              {data.feedbackByCategory.map((item) => (
                <View key={item.category} style={styles.tableRow}>
                  <Text style={styles.tableKey}>{item.category}</Text>
                  <Text style={styles.tableVal}>
                    {item.count} ({item.avg_rating}★)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            ⚠️ Este panel muestra solo los datos accesibles al usuario autenticado vía RLS.
            Para ver el total del piloto (todos los usuarios) se requiere acceso admin a la base de datos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: UI_COLORS.background
  },
  content: {
    padding: 20,
    paddingBottom: 48
  },
  header: {
    marginBottom: 24
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 12
  },
  backBtnText: {
    fontSize: 15,
    color: UI_COLORS.primary,
    fontWeight: "500"
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: UI_COLORS.text,
    marginBottom: 8
  },
  modBadge: {
    alignSelf: "flex-start",
    backgroundColor: UI_COLORS.teal + "22",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10
  },
  modBadgeText: {
    fontSize: 13,
    color: UI_COLORS.teal,
    fontWeight: "600"
  },
  subtitle: {
    fontSize: 13,
    color: UI_COLORS.textMuted,
    lineHeight: 20
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28
  },
  statCard: {
    flex: 1,
    backgroundColor: UI_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center"
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: UI_COLORS.primary,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: UI_COLORS.textMuted,
    textAlign: "center",
    fontWeight: "600"
  },
  statSub: {
    fontSize: 11,
    color: UI_COLORS.textMuted,
    marginTop: 2,
    fontStyle: "italic"
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: UI_COLORS.text,
    marginBottom: 12
  },
  table: {
    backgroundColor: UI_COLORS.surface,
    borderRadius: 12,
    overflow: "hidden"
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: UI_COLORS.border
  },
  tableKey: {
    flex: 1,
    fontSize: 14,
    color: UI_COLORS.text,
    textTransform: "capitalize"
  },
  tableVal: {
    fontSize: 14,
    fontWeight: "700",
    color: UI_COLORS.primary,
    marginLeft: 12
  },
  emptyNote: {
    fontSize: 14,
    color: UI_COLORS.textMuted,
    fontStyle: "italic"
  },
  notice: {
    backgroundColor: UI_COLORS.amber + "18",
    borderRadius: 12,
    padding: 16
  },
  noticeText: {
    fontSize: 13,
    color: UI_COLORS.text,
    lineHeight: 20
  },
  pressed: {
    opacity: 0.7
  }
});
