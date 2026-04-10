import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { I18nProvider } from "@/context/I18nContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { ContactsProvider } from "@/context/ContactsContext";
import { useColors } from "@/hooks/useColors";
import AiAssistantModal from "@/components/AiAssistantModal";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function FloatingAiButton() {
  const [visible, setVisible] = useState(false);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const bottomOffset = Platform.OS === "web"
    ? 72
    : insets.bottom + 64;

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomOffset }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.88}
      >
        <Feather name="cpu" size={22} color="#fff" />
      </TouchableOpacity>
      <AiAssistantModal visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

function RootLayoutNav() {
  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <FloatingAiButton />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <FinanceProvider>
              <ContactsProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </ContactsProvider>
            </FinanceProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fab:  {
    position:       "absolute",
    left:           16,
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     "center",
    justifyContent: "center",
    elevation:      6,
    shadowColor:    "#000",
    shadowOffset:   { width: 0, height: 3 },
    shadowOpacity:  0.25,
    shadowRadius:   6,
    zIndex:         999,
  },
});
