import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatMessageBubble } from "../../../components/ChatMessageBubble";
import { EmptyState } from "../../../components/EmptyState";
import { LoadingState } from "../../../components/LoadingState";
import { MessageInput } from "../../../components/MessageInput";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { blockUser, reportContent } from "../../../services/moderation";
import { getPlaceMessages, sendPlaceMessage, subscribeToPlaceMessages } from "../../../services/messages";
import type { PlaceMessage } from "../../../types";

export default function PlaceChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");
  const [messages, setMessages] = useState<PlaceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getPlaceMessages(placeId)
      .then((nextMessages) => {
        if (isMounted) setMessages(nextMessages);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = subscribeToPlaceMessages(placeId, (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [placeId]);

  async function handleSend(body: string) {
    try {
      const message = await sendPlaceMessage(placeId, body);
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    } catch (error) {
      Alert.alert("No se pudo enviar", error instanceof Error ? error.message : "Intentalo otra vez.");
    }
  }

  async function handleReport(message: PlaceMessage) {
    try {
      await reportContent({
        targetType: "message",
        targetId: message.id,
        reason: "unsafe_or_unwanted_content"
      });
      Alert.alert("Reporte enviado", "Gracias. Este reporte queda asociado al contenido, no a tu ubicacion exacta.");
    } catch (error) {
      Alert.alert("No se pudo reportar", error instanceof Error ? error.message : "Intentalo otra vez.");
    }
  }

  async function handleBlock(message: PlaceMessage) {
    if (!message.userId) {
      Alert.alert("No disponible", "Este mensaje no tiene un usuario asociado para bloquear.");
      return;
    }

    try {
      await blockUser(message.userId);
      Alert.alert("Usuario bloqueado", "Los bloqueos se guardan por cuenta y respetan RLS en Supabase.");
    } catch (error) {
      Alert.alert("No se pudo bloquear", error instanceof Error ? error.message : "Intentalo otra vez.");
    }
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content}>
          <SafetyNotice message="Escribe pensando en una comunidad local. No compartas datos sensibles ni ubicaciones exactas de otras personas." />

          {isLoading ? <LoadingState label="Cargando chat" /> : null}

          {!isLoading && messages.length === 0 ? (
            <EmptyState title="Aun no hay mensajes" description="Este puede ser el primer hilo publico del lugar." />
          ) : null}

          <View style={styles.messages}>
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} onBlockUser={handleBlock} onReport={handleReport} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.inputWrap}>
          <MessageInput onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: UI_COLORS.background,
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  content: {
    gap: 14,
    padding: 18,
    paddingBottom: 18
  },
  messages: {
    gap: 10
  },
  inputWrap: {
    backgroundColor: UI_COLORS.background,
    borderTopColor: UI_COLORS.border,
    borderTopWidth: 1,
    padding: 12
  }
});
