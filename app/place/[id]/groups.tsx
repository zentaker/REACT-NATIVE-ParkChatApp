import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { GroupCard } from "../../../components/GroupCard";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { getGroupsByPlace } from "../../../services/groups";
import type { LocalGroup } from "../../../types";

export default function PlaceGroupsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getGroupsByPlace(placeId)
      .then((nextGroups) => {
        if (isMounted) setGroups(nextGroups);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [placeId]);

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Grupos del lugar</Text>
          <Text style={styles.subtitle}>
            Únete a personas que vuelven a este espacio. Cada grupo tiene su propio nivel de acceso.
          </Text>
        </View>

        <SafetyNotice message="Los grupos pueden ser públicos, locales, por aprobación o privados según el nivel de cuidado necesario." />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/place/[id]/new-group" as never, params: { id: placeId } as never })}
          style={({ pressed }) => [styles.createButton, pressed && { opacity: 0.78 }]}
        >
          <Text style={styles.createText}>+ Crear una aldea aquí</Text>
        </Pressable>

        {isLoading ? <LoadingState label="Cargando grupos" /> : null}

        {!isLoading && groups.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Aún no hay grupos"
            description="Crea una aldea dentro de este lugar y reúne a personas que vuelven a este espacio."
            action={{
              label: "Crear el primer grupo",
              onPress: () => router.push({ pathname: "/place/[id]/new-group" as never, params: { id: placeId } as never })
            }}
          />
        ) : null}

        <View style={styles.list}>
          {groups.map((group) => (
            <GroupCard
              group={group}
              key={group.id}
              onPress={() => router.push({ pathname: "/group/[id]", params: { id: group.id } })}
            />
          ))}
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
    gap: 6
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  createButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  createText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  list: {
    gap: 12
  }
});
