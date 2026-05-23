import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { EventForm } from "../../../components/EventForm";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { deleteEvent, getEventById, updateEvent } from "../../../services/events";
import { getCurrentUserId } from "../../../services/auth";
import type { LocalEvent } from "../../../types";

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id ?? "");
  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getEventById(eventId), getCurrentUserId().catch(() => null)])
      .then(([nextEvent, userId]) => {
        if (!isMounted) return;
        setEvent(nextEvent);
        setIsOwner(Boolean(nextEvent && userId && nextEvent.createdBy === userId));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteEvent(eventId);
      router.back();
    } catch (error) {
      Alert.alert("No se pudo eliminar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Eliminar evento", "Esta accion no se puede deshacer. Continuar?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: handleDelete }
    ]);
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar evento</Text>
          <Text style={styles.subtitle}>Actualiza datos basicos o dalo de baja.</Text>
        </View>

        {isLoading ? <LoadingState label="Cargando evento" /> : null}

        {!isLoading && !event ? (
          <EmptyState title="Evento no encontrado" description="No existe en mocks ni en Supabase." />
        ) : null}

        {event && !isOwner ? (
          <SafetyNotice message="Solo el creador del evento puede editarlo o eliminarlo." />
        ) : null}

        {event && isOwner ? (
          <>
            <EventForm
              initialValues={{
                title: event.title,
                description: event.description ?? "",
                startsAt: event.startsAt,
                endsAt: event.endsAt ?? ""
              }}
              submitLabel="Guardar cambios"
              onSubmit={async (values) => {
                try {
                  const updated = await updateEvent(eventId, {
                    title: values.title,
                    description: values.description,
                    startsAt: values.startsAt,
                    endsAt: values.endsAt || null
                  });
                  setEvent(updated);
                  Alert.alert("Cambios guardados", "El evento se actualizo.");
                } catch (error) {
                  Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Intentalo otra vez.");
                }
              }}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={confirmDelete}
              style={({ pressed }) => [styles.dangerButton, (pressed || isDeleting) && styles.pressed]}
            >
              <Text style={styles.dangerText}>{isDeleting ? "Eliminando..." : "Eliminar evento"}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: UI_COLORS.background, flex: 1 },
  content: { gap: 18, padding: 18, paddingBottom: 32 },
  header: { gap: 8 },
  title: { color: UI_COLORS.text, fontSize: 26, fontWeight: "900" },
  subtitle: { color: UI_COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  dangerButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.danger,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  dangerText: { color: UI_COLORS.danger, fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.78 }
});
