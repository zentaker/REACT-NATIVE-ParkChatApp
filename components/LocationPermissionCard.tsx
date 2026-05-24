import { Pressable, StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";
import type { LocationPermissionStatus } from "../types/location";

type Props = {
  status: LocationPermissionStatus;
  onRequest: () => void;
};

export function LocationPermissionCard({ status, onRequest }: Props) {
  if (status === "granted") return null;

  const isDenied = status === "denied";
  const isUnavailable = status === "unavailable";

  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>
          {isUnavailable
            ? "Ubicación no disponible"
            : isDenied
            ? "Ubicación denegada"
            : "Ordenar por cercanía"}
        </Text>
        <Text style={styles.copy}>
          {isUnavailable
            ? "Este dispositivo no soporta geolocalización en este modo."
            : isDenied
            ? "Activa el permiso de ubicación en la configuración del dispositivo para ver lugares cercanos."
            : "Permite acceso a tu ubicación para ver los lugares más cercanos primero. Tu ubicación exacta no se comparte."}
        </Text>
      </View>

      {!isDenied && !isUnavailable ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRequest}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Permitir ubicación</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  textBlock: {
    gap: 6
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 15,
    fontWeight: "800"
  },
  copy: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  button: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 16
  },
  pressed: {
    opacity: 0.78
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800"
  }
});
