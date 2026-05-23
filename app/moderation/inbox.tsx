import { Stack, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { SafetyNotice } from "../../components/SafetyNotice";
import { UI_COLORS } from "../../lib/constants";
import {
  REPORT_REASONS,
  REPORT_STATUS_LABELS,
  isCurrentUserModerator,
  listReportsForModeration,
  updateReportStatus,
  type Report,
  type ReportStatus
} from "../../services/moderation";

const TARGET_LABELS: Record<Report["targetType"], string> = {
  message: "Mensaje de chat",
  profile: "Perfil",
  place: "Lugar",
  group: "Grupo",
  event: "Evento"
};

const FILTERS: { key: ReportStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "reviewed", label: "Revisados" },
  { key: "actioned", label: "Con accion" },
  { key: "dismissed", label: "Descartados" },
  { key: "all", label: "Todos" }
];

function reasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

function targetLink(report: Report): { pathname: string; params: Record<string, string> } | null {
  switch (report.targetType) {
    case "profile":
      return { pathname: "/profile/[id]", params: { id: report.targetId } };
    case "place":
      return { pathname: "/place/[id]", params: { id: report.targetId } };
    case "group":
      return { pathname: "/group/[id]", params: { id: report.targetId } };
    case "event":
      return { pathname: "/event/[id]", params: { id: report.targetId } };
    default:
      return null;
  }
}

export default function ModerationInboxScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<ReportStatus | "all">("pending");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async (next: ReportStatus | "all") => {
    setIsLoading(true);
    try {
      const data = await listReportsForModeration({ status: next });
      setReports(data);
    } catch (error) {
      Alert.alert("No se pudo cargar la bandeja", error instanceof Error ? error.message : "Intentalo otra vez.");
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    isCurrentUserModerator()
      .then((flag) => {
        if (!mounted) return;
        setIsModerator(flag);
        if (flag) void load(filter);
        else setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsModerator(false);
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isModerator) void load(filter);
  }, [filter, isModerator, load]);

  async function applyStatus(report: Report, status: ReportStatus) {
    setPendingId(report.id);
    try {
      const updated = await updateReportStatus(report.id, status);
      setReports((current) => {
        const remains = filter === "all" || updated.status === filter;
        return remains ? current.map((r) => (r.id === updated.id ? updated : r)) : current.filter((r) => r.id !== updated.id);
      });
    } catch (error) {
      Alert.alert("No se pudo actualizar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setPendingId(null);
    }
  }

  function openTarget(report: Report) {
    const link = targetLink(report);
    if (!link) {
      Alert.alert(
        "Contenido sin vista directa",
        "Este reporte es sobre un mensaje de chat. Abrelo desde el chat del lugar para ver el contexto completo."
      );
      return;
    }
    router.push(link as Parameters<typeof router.push>[0]);
  }

  if (isModerator === false) {
    return (
      <SafeAreaView edges={["left", "right"]} style={styles.screen}>
        <Stack.Screen options={{ headerShown: true, title: "Bandeja de moderacion" }} />
        <View style={styles.deniedWrap}>
          <EmptyState
            title="Acceso restringido"
            description="Esta pantalla esta disponible solo para cuentas marcadas como moderadoras del equipo de Aldea."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: "Bandeja de moderacion" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Reportes</Text>
          <Text style={styles.subtitle}>
            Revisa los reportes que llegan de la comunidad. Marca el estado para cerrar el ciclo y dejar trazabilidad.
          </Text>
        </View>

        <SafetyNotice
          tone="default"
          title="Manten la confidencialidad"
          message="No compartas la identidad del reportante con la persona reportada. Anota acciones tomadas en la nota de resolucion."
        />

        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => setFilter(item.key)}
                style={[styles.filter, active && styles.filterActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? <LoadingState label="Cargando reportes" /> : null}

        {!isLoading && reports.length === 0 ? (
          <EmptyState title="Sin reportes" description="No hay reportes en este estado por ahora." />
        ) : null}

        <View style={styles.list}>
          {reports.map((report) => {
            const reporterName = report.reporter?.displayName ?? report.reporter?.username ?? report.reporterId.slice(0, 8);
            const isPending = pendingId === report.id;
            return (
              <View key={report.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>{TARGET_LABELS[report.targetType]}</Text>
                  <Text style={styles.cardStatus}>{REPORT_STATUS_LABELS[report.status]}</Text>
                </View>

                <Text style={styles.cardReason}>{reasonLabel(report.reason)}</Text>

                {report.details ? <Text style={styles.cardDetails}>{report.details}</Text> : null}

                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>Reportado por {reporterName}</Text>
                  <Text style={styles.cardMetaText}>{formatRelative(report.createdAt)}</Text>
                </View>

                <Text style={styles.cardTargetId}>
                  {report.targetType} #{report.targetId.slice(0, 8)}
                </Text>

                <Pressable accessibilityRole="link" onPress={() => openTarget(report)} style={styles.linkButton}>
                  <Text style={styles.linkButtonText}>Ver contenido reportado</Text>
                </Pressable>

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPending || report.status === "reviewed"}
                    onPress={() => applyStatus(report, "reviewed")}
                    style={[styles.actionButton, (isPending || report.status === "reviewed") && styles.actionDisabled]}
                  >
                    <Text style={styles.actionText}>Marcar revisado</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPending || report.status === "actioned"}
                    onPress={() => applyStatus(report, "actioned")}
                    style={[
                      styles.actionButton,
                      styles.actionPrimary,
                      (isPending || report.status === "actioned") && styles.actionDisabled
                    ]}
                  >
                    <Text style={[styles.actionText, styles.actionPrimaryText]}>Aplicar accion</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPending || report.status === "dismissed"}
                    onPress={() => applyStatus(report, "dismissed")}
                    style={[
                      styles.actionButton,
                      styles.actionDanger,
                      (isPending || report.status === "dismissed") && styles.actionDisabled
                    ]}
                  >
                    <Text style={[styles.actionText, styles.actionDangerText]}>Descartar</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: UI_COLORS.background, flex: 1 },
  content: { gap: 18, padding: 18, paddingBottom: 32 },
  header: { gap: 8 },
  title: { color: UI_COLORS.text, fontSize: 26, fontWeight: "900" },
  subtitle: { color: UI_COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  deniedWrap: { flex: 1, justifyContent: "center", padding: 24 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  filterActive: { backgroundColor: UI_COLORS.primary, borderColor: UI_COLORS.primary },
  filterText: { color: UI_COLORS.primary, fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: "#ffffff" },
  list: { gap: 12 },
  card: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  cardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardType: { color: UI_COLORS.textMuted, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  cardStatus: { color: UI_COLORS.primary, fontSize: 12, fontWeight: "800" },
  cardReason: { color: UI_COLORS.text, fontSize: 16, fontWeight: "800" },
  cardDetails: { color: UI_COLORS.text, fontSize: 14, lineHeight: 20 },
  cardMeta: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  cardMetaText: { color: UI_COLORS.textMuted, fontSize: 12 },
  cardTargetId: { color: UI_COLORS.textMuted, fontSize: 11, fontFamily: "Courier" },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: 4
  },
  linkButtonText: { color: UI_COLORS.primary, fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  actionButton: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderColor: UI_COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  actionPrimary: { backgroundColor: UI_COLORS.primary, borderColor: UI_COLORS.primary },
  actionDanger: { borderColor: "#e2a89a" },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: UI_COLORS.primary, fontSize: 12, fontWeight: "800" },
  actionPrimaryText: { color: "#ffffff" },
  actionDangerText: { color: UI_COLORS.danger }
});
