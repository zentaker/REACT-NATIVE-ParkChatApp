import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventForm } from "../../../components/EventForm";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { createEvent } from "../../../services/events";

export default function NewPlaceEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear evento</Text>
          <Text style={styles.subtitle}>Encuentro abierto a quienes participan de este lugar.</Text>
        </View>

        <SafetyNotice message="Prefiere puntos de encuentro publicos y horarios visibles. Evita compartir ubicacion exacta de personas." />

        <EventForm
          submitLabel="Crear evento"
          onSubmit={async (values) => {
            try {
              const event = await createEvent({
                placeId,
                title: values.title,
                description: values.description,
                startsAt: values.startsAt,
                endsAt: values.endsAt || null
              });
              router.replace({ pathname: "/event/[id]", params: { id: event.id } });
            } catch (error) {
              Alert.alert("No se pudo crear", error instanceof Error ? error.message : "Intentalo otra vez.");
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: UI_COLORS.background, flex: 1 },
  content: { gap: 18, padding: 18, paddingBottom: 32 },
  header: { gap: 8 },
  title: { color: UI_COLORS.text, fontSize: 26, fontWeight: "900" },
  subtitle: { color: UI_COLORS.textMuted, fontSize: 15, lineHeight: 22 }
});
