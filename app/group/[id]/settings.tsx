import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Grupo {String(id ?? "")}</Text>
        </View>
        <SafetyNotice message="Los ajustes futuros deben incluir nivel de acceso, roles, reportes y reglas visibles del grupo." />
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pendiente para Etapa 1</Text>
          <Text style={styles.copy}>Editar nombre, descripcion, access_level, roles y reglas de moderacion.</Text>
        </View>
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
    gap: 18,
    padding: 18,
    paddingBottom: 32
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
  card: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  sectionTitle: {
    color: UI_COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  copy: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
