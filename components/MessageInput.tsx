import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { UI_COLORS } from "../lib/constants";
import {
  MESSAGE_RATE_LIMIT_MAX,
  MessageRateLimitError,
  getMessageRateLimitStatus
} from "../services/messages";

type MessageInputProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (body: string) => Promise<void> | void;
};

export function MessageInput({ disabled = false, placeholder = "Escribe en este lugar", onSend }: MessageInputProps) {
  const [body, setBody] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startCooldown(retryAfterMs: number) {
    const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    setCooldownSeconds(seconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const status = getMessageRateLimitStatus();
      if (status.retryAfterMs <= 0) {
        setCooldownSeconds(0);
        setHint(null);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setCooldownSeconds(Math.max(1, Math.ceil(status.retryAfterMs / 1000)));
      }
    }, 500);
  }

  const isCooldown = cooldownSeconds > 0;
  const canSend = body.trim().length > 0 && !disabled && !isCooldown;

  async function handleSend() {
    if (!canSend) return;
    const nextBody = body;
    setBody("");
    setHint(null);
    try {
      await onSend(nextBody);
    } catch (error) {
      if (error instanceof MessageRateLimitError) {
        setBody(nextBody);
        if (error.reason === "duplicate") {
          setHint("No repitas el mismo mensaje seguido. Aporta algo distinto.");
        } else {
          startCooldown(error.retryAfterMs);
          setHint(error.message);
        }
        return;
      }
      throw error;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          editable={!disabled && !isCooldown}
          multiline
          onChangeText={(value) => {
            setBody(value);
            if (hint) setHint(null);
          }}
          placeholder={isCooldown ? `Espera ${cooldownSeconds}s` : placeholder}
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
          <Text style={styles.buttonText}>{isCooldown ? `${cooldownSeconds}s` : "Enviar"}</Text>
        </Pressable>
      </View>
      {hint ? (
        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          {hint}
        </Text>
      ) : (
        <Text style={styles.helper}>
          Limite: {MESSAGE_RATE_LIMIT_MAX} mensajes por minuto para mantener el chat sano.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 10
  },
  inputRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 10
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
    minWidth: 72,
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
  },
  helper: {
    color: UI_COLORS.textMuted,
    fontSize: 12,
    paddingHorizontal: 4
  },
  hint: {
    color: UI_COLORS.danger,
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 4
  }
});
