import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { GroupCard } from "../../components/GroupCard";
import { LoadingState } from "../../components/LoadingState";
import { UI_COLORS } from "../../lib/constants";
import { getMyGroups } from "../../services/groups";
import type { LocalGroup } from "../../types";

export default function MyGroupsScreen() {
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMyGroups()
      .then((next) => {
        if (isMounted) setGroups(next);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis grupos</Text>
          <Text style={styles.subtitle}>Grupos que creaste o donde participas.</Text>
        </View>

        {isLoading ? <LoadingState label="Cargando grupos" /> : null}

        {!isLoading && groups.length === 0 ? (
          <EmptyState title="Sin grupos todavia" description="Crea un grupo desde el perfil de un lugar para empezar." />
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
  screen: { backgroundColor: UI_COLORS.background, flex: 1 },
  content: { gap: 18, padding: 18, paddingBottom: 32 },
  header: { gap: 8 },
  title: { color: UI_COLORS.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: UI_COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  list: { gap: 12 }
});
