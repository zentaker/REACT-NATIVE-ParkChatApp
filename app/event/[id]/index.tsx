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
import { cancelRsvp, getEventById, getMyRsvp, joinEvent } from "../../../services/events";
import type { EventAttendee, LocalEvent } from "../../../types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id ?? "");
  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [rsvp, setRsvp] = useState<EventAttendee | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

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

  function handleJoin() {
    Alert.alert(
      "Confirmar asistencia",
      "Los encuentros presenciales pueden ser publicos. Verifica el lugar, el horario y mantente con tu grupo. Aldea no comparte tu ubicacion exacta.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Asistire",
          style: "default",
          onPress: async () => {
            setIsWorking(true);
            try {
              const next = await joinEvent(eventId);
              setRsvp(next);
            } catch (error) {
              Alert.alert("No se pudo registrar", error instanceof Error ? error.message : "Intentalo otra vez.");
            } finally {
              setIsWorking(false);
            }
          }
        }
      ]
    );
  }

  async function handleCancel() {
    setIsWorking(true);
    try {
      await cancelRsvp(eventId);
      setRsvp(null);
    } catch (error) {
      Alert.alert("No se pudo cancelar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsWorking(false);
    }
  }

  const isAttending = rsvp !== null;

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

            {isAttending ? (
              <Pressable
                accessibilityRole="button"
                disabled={isWorking}
                onPress={handleCancel}
                style={({ pressed }) => [styles.secondaryWide, (pressed || isWorking) && styles.pressed]}
              >
                <Text style={styles.secondaryWideText}>{isWorking ? "Procesando..." : "Cancelar asistencia"}</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isWorking}
                onPress={handleJoin}
                style={({ pressed }) => [styles.primaryButton, (pressed || isWorking) && styles.pressed]}
              >
                <Text style={styles.primaryText}>{isWorking ? "Procesando..." : "Asistir"}</Text>
              </Pressable>
            )}

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
  primaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  primaryText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
  secondaryWide: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  secondaryWideText: { color: UI_COLORS.primary, fontSize: 14, fontWeight: "900" },
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
