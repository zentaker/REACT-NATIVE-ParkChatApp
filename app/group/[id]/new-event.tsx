import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventForm } from "../../../components/EventForm";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { createEvent } from "../../../services/events";

export default function NewGroupEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id ?? "");

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear evento del grupo</Text>
          <Text style={styles.subtitle}>Encuentro vinculado a esta comunidad.</Text>
        </View>

        <SafetyNotice message="Aclara reglas, horarios y cupo. Mantente en puntos publicos y visibles." />

        <EventForm
          submitLabel="Crear evento"
          onSubmit={async (values) => {
            try {
              const event = await createEvent({
                groupId,
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
