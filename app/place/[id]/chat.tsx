import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatMessageBubble } from "../../../components/ChatMessageBubble";
import { EmptyState } from "../../../components/EmptyState";
import { LoadingState } from "../../../components/LoadingState";
import { MessageInput } from "../../../components/MessageInput";
import { ReportDialog } from "../../../components/ReportDialog";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { useBlockedUsers } from "../../../hooks/useBlockedUsers";
import { UI_COLORS } from "../../../lib/constants";
import { blockUser, reportContent, type ReportReason } from "../../../services/moderation";
import {
  createOptimisticPlaceMessage,
  getPlaceMessages,
  MessageRateLimitError,
  sendPlaceMessage,
  subscribeToPlaceMessages
} from "../../../services/messages";
import { getCurrentProfile } from "../../../services/profile";
import type { PlaceMessage, Profile } from "../../../types";

function upsertMessage(list: PlaceMessage[], next: PlaceMessage): PlaceMessage[] {
  const idx = list.findIndex((item) => item.id === next.id);
  if (idx === -1) return [...list, next];
  const copy = list.slice();
  copy[idx] = next;
  return copy;
}

function replaceOptimistic(
  list: PlaceMessage[],
  optimisticId: string,
  next: PlaceMessage
): PlaceMessage[] {
  const withoutTemp = list.filter((item) => item.id !== optimisticId);
  return upsertMessage(withoutTemp, next);
}

export default function PlaceChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");
  const [messages, setMessages] = useState<PlaceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<PlaceMessage | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { isBlocked, markBlocked } = useBlockedUsers();
  const profileRef = useRef<Profile | null>(null);
  const sentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    sentIdsRef.current = new Set();

    getCurrentProfile().then((profile) => {
      if (isMounted) profileRef.current = profile;
    });

    getPlaceMessages(placeId)
      .then((nextMessages) => {
        if (isMounted) setMessages(nextMessages);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = subscribeToPlaceMessages(placeId, (message) => {
      // Dedupe: skip realtime events that mirror a message we just sent locally.
      if (sentIdsRef.current.has(message.id)) {
        sentIdsRef.current.delete(message.id);
        return;
      }
      setMessages((current) => upsertMessage(current, message));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [placeId]);

  const handleSend = useCallback(
    async (body: string) => {
      const optimistic = createOptimisticPlaceMessage(placeId, body, profileRef.current);
      setMessages((current) => [...current, optimistic]);

      try {
        const message = await sendPlaceMessage(placeId, body);
        // Mark the real id as locally-known so the realtime echo is ignored.
        sentIdsRef.current.add(message.id);
        setMessages((current) => replaceOptimistic(current, optimistic.id, message));
      } catch (error) {
        setMessages((current) => current.filter((item) => item.id !== optimistic.id));
        if (error instanceof MessageRateLimitError) {
          // Let MessageInput render the inline cooldown / duplicate hint.
          throw error;
        }
        Alert.alert("No se pudo enviar", error instanceof Error ? error.message : "Intentalo otra vez.");
      }
    },
    [placeId]
  );

  function handleOpenReport(message: PlaceMessage) {
    setReportTarget(message);
  }

  async function handleSubmitReport(reason: ReportReason, details: string) {
    if (!reportTarget) return;

    setIsSubmittingReport(true);
    try {
      await reportContent({
        targetType: "message",
        targetId: reportTarget.id,
        reason,
        details: details || null
      });
      setReportTarget(null);
      Alert.alert("Reporte enviado", "Gracias. Lo revisaremos. Tu identidad no se comparte con la persona reportada.");
    } catch (error) {
      Alert.alert("No se pudo reportar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsSubmittingReport(false);
    }
  }

  function handleBlock(message: PlaceMessage) {
    if (!message.userId) {
      Alert.alert("No disponible", "Este mensaje no tiene un usuario asociado para bloquear.");
      return;
    }

    const userId = message.userId;
    const name = message.profile?.displayName ?? message.profile?.username ?? "esta persona";

    Alert.alert(
      "Bloquear usuario",
      `Dejaras de ver mensajes de ${name} en todos los lugares. Puedes deshacer esto desde Perfil > Bloqueos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Bloquear",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(userId);
              markBlocked(userId);
              Alert.alert("Usuario bloqueado", "Sus mensajes quedan ocultos al instante.");
            } catch (error) {
              Alert.alert("No se pudo bloquear", error instanceof Error ? error.message : "Intentalo otra vez.");
            }
          }
        }
      ]
    );
  }

  function handleOpenProfile(message: PlaceMessage) {
    if (!message.userId) return;
    router.push({ pathname: "/profile/[id]", params: { id: message.userId } });
  }

  const visibleMessages = useMemo(
    () => messages.filter((message) => !isBlocked(message.userId)),
    [messages, isBlocked]
  );

  const hiddenCount = messages.length - visibleMessages.length;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content}>
          <SafetyNotice
            tone="place"
            title="Chat de lugar"
            message="Este es un espacio publico local. No compartas datos sensibles, contactos personales ni ubicaciones exactas. Reporta o bloquea si algo te incomoda."
          />

          {isLoading ? <LoadingState label="Cargando chat" /> : null}

          {!isLoading && messages.length === 0 ? (
            <EmptyState title="Aun no hay mensajes" description="Este puede ser el primer hilo publico del lugar." />
          ) : null}

          {hiddenCount > 0 ? (
            <EmptyState
              title={`${hiddenCount} mensaje${hiddenCount === 1 ? "" : "s"} oculto${hiddenCount === 1 ? "" : "s"}`}
              description="Provienen de cuentas que bloqueaste. Puedes desbloquearlas desde Perfil > Bloqueos."
            />
          ) : null}

          <View style={styles.messages}>
            {visibleMessages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                onBlockUser={handleBlock}
                onReport={handleOpenReport}
                onOpenProfile={message.userId ? handleOpenProfile : undefined}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.inputWrap}>
          <MessageInput onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>

      <ReportDialog
        visible={Boolean(reportTarget)}
        title="Reportar mensaje"
        description="Tu reporte se asocia al mensaje, no a tu ubicacion. Elige el motivo que mejor describe lo que viste."
        submitting={isSubmittingReport}
        onCancel={() => (isSubmittingReport ? null : setReportTarget(null))}
        onSubmit={handleSubmitReport}
      />
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
