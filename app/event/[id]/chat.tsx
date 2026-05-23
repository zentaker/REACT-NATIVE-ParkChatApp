import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { MessageInput } from "../../../components/MessageInput";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";

export default function EventChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat de evento</Text>
          <Text style={styles.subtitle}>Evento {String(id ?? "")}</Text>
        </View>
        <SafetyNotice message="El chat de evento se conectara despues del chat publico por lugar para mantener el MVP enfocado." />
        <EmptyState title="Chat de evento pendiente" description="La Etapa 1 puede conectar conversaciones derivadas de eventos." />
      </ScrollView>
      <View style={styles.inputWrap}>
        <MessageInput disabled onSend={() => undefined} placeholder="Disponible cuando el evento este conectado" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: UI_COLORS.background,
    flex: 1
  },
  content: {
    gap: 18,
    padding: 18
  },
  header: {
    gap: 8
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 14
  },
  inputWrap: {
    backgroundColor: UI_COLORS.background,
    borderTopColor: UI_COLORS.border,
    borderTopWidth: 1,
    padding: 12
  }
});
