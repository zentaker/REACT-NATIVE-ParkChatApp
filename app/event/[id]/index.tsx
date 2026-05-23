import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { EventCard } from "../../../components/EventCard";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { getCurrentUserId } from "../../../services/auth";
import { cancelRsvp, getEventById, getMyRsvp, setRsvpStatus } from "../../../services/events";
import type { EventAttendee, EventAttendeeStatus, LocalEvent } from "../../../types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date(value));
}

const RSVP_OPTIONS: { status: EventAttendeeStatus; label: string }[] = [
  { status: "going", label: "Asistire" },
  { status: "interested", label: "Tal vez" },
  { status: "cancelled", label: "No asisto" }
];

const RSVP_LABELS: Record<EventAttendeeStatus, string> = {
  going: "Confirmaste tu asistencia",
  interested: "Marcaste que tal vez asistas",
  cancelled: "Indicaste que no asistiras"
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id ?? "");
  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [rsvp, setRsvp] = useState<EventAttendee | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workingStatus, setWorkingStatus] = useState<EventAttendeeStatus | "clear" | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getEventById(eventId), getMyRsvp(eventId), getCurrentUserId().catch(() => null)])
      .then(([nextEvent, nextRsvp, userId]) => {
        if (!isMounted) return;
        setEvent(nextEvent);
        setRsvp(nextRsvp);
        setIsOwner(Boolean(nextEvent && userId && nextEvent.createdBy === userId));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  async function applyStatus(status: EventAttendeeStatus) {
    setWorkingStatus(status);
    try {
      const next = await setRsvpStatus(eventId, status);
      setRsvp(next);
    } catch (error) {
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setWorkingStatus(null);
    }
  }

  function handleSelect(status: EventAttendeeStatus) {
    if (status === "going" && rsvp?.status !== "going") {
      Alert.alert(
        "Confirmar asistencia",
        "Los encuentros presenciales pueden ser publicos. Verifica el lugar, el horario y mantente con tu grupo. Aldea no comparte tu ubicacion exacta.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Asistire", style: "default", onPress: () => applyStatus("going") }
        ]
      );
      return;
    }
    applyStatus(status);
  }

  async function handleClear() {
    setWorkingStatus("clear");
    try {
      await cancelRsvp(eventId);
      setRsvp(null);
    } catch (error) {
      Alert.alert("No se pudo quitar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setWorkingStatus(null);
    }
  }

  const isBusy = workingStatus !== null;

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <LoadingState label="Cargando evento" /> : null}

        {!isLoading && !event ? <EmptyState title="Evento no encontrado" description="No existe en mocks ni en Supabase." /> : null}

        {event ? (
          <>
            <EventCard event={event} />
            <SafetyNotice
              tone="event"
              title="Antes de confirmar tu RSVP"
              message="Revisa reglas, horario, cupos y punto de encuentro general. Avisa a alguien de confianza. Evita compartir ubicacion exacta o contacto directo en el chat publico."
            />

            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Detalle</Text>
              <Text style={styles.detailText}>Inicio: {formatDate(event.startsAt)}</Text>
              {event.endsAt ? <Text style={styles.detailText}>Fin: {formatDate(event.endsAt)}</Text> : null}
              {event.description ? <Text style={styles.detailCopy}>{event.description}</Text> : null}
            </View>

            <View style={styles.rsvpCard}>
              <Text style={styles.sectionTitle}>Tu respuesta</Text>
              <Text style={styles.rsvpStatusText}>
                {rsvp ? RSVP_LABELS[rsvp.status] : "Aun no respondes a este evento."}
              </Text>
              <View style={styles.rsvpRow}>
                {RSVP_OPTIONS.map((option) => {
                  const isActive = rsvp?.status === option.status;
                  const isThisLoading = workingStatus === option.status;
                  return (
                    <Pressable
                      key={option.status}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive, disabled: isBusy }}
                      disabled={isBusy}
                      onPress={() => handleSelect(option.status)}
                      style={({ pressed }) => [
                        styles.rsvpButton,
                        isActive && styles.rsvpButtonActive,
                        (pressed || isThisLoading) && styles.pressed
                      ]}
                    >
                      <Text style={[styles.rsvpButtonText, isActive && styles.rsvpButtonTextActive]}>
                        {isThisLoading ? "..." : option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {rsvp ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={handleClear}
                  style={({ pressed }) => [styles.clearLink, (pressed || workingStatus === "clear") && styles.pressed]}
                >
                  <Text style={styles.clearLinkText}>
                    {workingStatus === "clear" ? "Quitando..." : "Quitar mi respuesta"}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.actionGrid}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/event/[id]/attendees", params: { id: event.id } })}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Asistentes</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/event/[id]/chat", params: { id: event.id } })}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Chat</Text>
              </Pressable>
              {isOwner ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/event/[id]/edit" as never, params: { id: event.id } as never })}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryText}>Editar</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: UI_COLORS.background, flex: 1 },
  content: { gap: 18, padding: 18, paddingBottom: 32 },
  detailCard: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  sectionTitle: { color: UI_COLORS.text, fontSize: 17, fontWeight: "900" },
  detailText: { color: UI_COLORS.primary, fontSize: 14, fontWeight: "900", lineHeight: 20 },
  detailCopy: { color: UI_COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  rsvpCard: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  rsvpStatusText: { color: UI_COLORS.textMuted, fontSize: 13, lineHeight: 18 },
  rsvpRow: { flexDirection: "row", gap: 8 },
  rsvpButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.background,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8
  },
  rsvpButtonActive: {
    backgroundColor: UI_COLORS.primary,
    borderColor: UI_COLORS.primary
  },
  rsvpButtonText: { color: UI_COLORS.primary, fontSize: 13, fontWeight: "900", textAlign: "center" },
  rsvpButtonTextActive: { color: "#ffffff" },
  clearLink: { alignItems: "center", paddingVertical: 4 },
  clearLinkText: { color: UI_COLORS.textMuted, fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.78 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    minWidth: 100,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  secondaryText: { color: UI_COLORS.primary, fontSize: 13, fontWeight: "900" }
});
