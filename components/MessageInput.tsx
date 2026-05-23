import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

type MessageInputProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (body: string) => Promise<void> | void;
};

export function MessageInput({ disabled = false, placeholder = "Escribe en este lugar", onSend }: MessageInputProps) {
  const [body, setBody] = useState("");
  const canSend = body.trim().length > 0 && !disabled;

  async function handleSend() {
    if (!canSend) return;
    const nextBody = body;
    setBody("");
    await onSend(nextBody);
  }

  return (
    <View style={styles.container}>
      <TextInput
        editable={!disabled}
        multiline
        onChangeText={setBody}
        placeholder={placeholder}
        placeholderTextColor={UI_COLORS.textMuted}
        style={styles.input}
        value={body}
      />
      <Pressable
        accessibilityRole="button"
        disabled={!canSend}
        onPress={handleSend}
        style={({ pressed }) => [styles.button, !canSend && styles.buttonDisabled, pressed && canSend && styles.pressed]}
      >
        <Text style={styles.buttonText}>Enviar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10
  },
  input: {
    color: UI_COLORS.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  button: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  buttonDisabled: {
    backgroundColor: UI_COLORS.border
  },
  pressed: {
    opacity: 0.78
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  }
});
