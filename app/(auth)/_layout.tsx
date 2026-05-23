import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../hooks/useAuth";

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!loading && isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
