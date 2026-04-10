import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFinance, PaymentMethod, TransactionType } from "@/context/FinanceContext";
import { useI18n } from "@/context/I18nContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AiResponse {
  action: "add_transaction" | "query_response" | "general";
  message: string;
  transaction?: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
    paymentMethod: PaymentMethod;
  } | null;
}

interface PendingTransaction {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  confirmMessage: string;
}

interface AiAssistantModalProps {
  visible: boolean;
  onClose: () => void;
}

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function AiAssistantModal({ visible, onClose }: AiAssistantModalProps) {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { categories, currency, getTotalIncome, getTotalExpenses, getBalance, formatAmount, addTransaction } = useFinance();

  const [messages,           setMessages]           = useState<ChatMessage[]>([]);
  const [input,              setInput]              = useState("");
  const [isLoading,          setIsLoading]          = useState(false);
  const [isRecording,        setIsRecording]        = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([{
        id: genId(),
        role: "assistant",
        content: t("ai_welcome"),
      }]);
    }
    if (!visible) {
      stopRecording();
    }
  }, [visible]);

  function stopRecording() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }

  function buildContext() {
    const incomeCategories  = categories.filter(c => c.type === "income").map(c => c.name);
    const expenseCategories = categories.filter(c => c.type === "expense").map(c => c.name);
    return {
      currencySymbol:    currency.symbol,
      currencyCode:      currency.code,
      balance:           formatAmount(getBalance()),
      totalIncome:       formatAmount(getTotalIncome()),
      totalExpenses:     formatAmount(getTotalExpenses()),
      incomeCategories,
      expenseCategories,
    };
  }

  async function sendMessage(text: string) {
    const userText = text.trim();
    if (!userText || isLoading) return;

    const userMsg: ChatMessage = { id: genId(), role: "user", content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const body = {
        messages: updated.map(m => ({ role: m.role, content: m.content })),
        context: buildContext(),
      };

      const res  = await fetch(`${API_BASE}/api/ai/message`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) throw new Error("API error");

      const data: AiResponse = await res.json();

      const assistantMsg: ChatMessage = { id: genId(), role: "assistant", content: data.message };
      setMessages(prev => [...prev, assistantMsg]);

      if (data.action === "add_transaction" && data.transaction) {
        setPendingTransaction({
          ...data.transaction,
          confirmMessage: data.message,
        });
      }
    } catch {
      const errMsg: ChatMessage = { id: genId(), role: "assistant", content: t("ai_error") };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSend() {
    sendMessage(input);
  }

  function startVoiceRecording() {
    if (Platform.OS !== "web") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      Alert.alert("Voice", "Voice input is not supported in this browser.");
      return;
    }
    if (isRecording) {
      stopRecording();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const recognition = new SR();
    recognition.continuous    = false;
    recognition.interimResults = false;
    recognition.lang           = locale;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setInput(transcript);
        sendMessage(transcript);
      }
    };
    recognition.onend  = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  function confirmTransaction() {
    if (!pendingTransaction) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTransaction({
      type:          pendingTransaction.type,
      amount:        pendingTransaction.amount,
      category:      pendingTransaction.category,
      description:   pendingTransaction.description || "",
      date:          pendingTransaction.date || new Date().toISOString().split("T")[0],
      paymentMethod: pendingTransaction.paymentMethod || "bank",
    });
    const confirmMsg: ChatMessage = { id: genId(), role: "assistant", content: `✓ ${t("ai_addedOk")}` };
    setMessages(prev => [...prev, confirmMsg]);
    setPendingTransaction(null);
  }

  function cancelTransaction() {
    setPendingTransaction(null);
  }

  function handleClose() {
    stopRecording();
    onClose();
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top + 12;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
              <Feather name="cpu" size={16} color="#fff" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("ai_title")}</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.chatContent, { paddingBottom: 12 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[
              styles.bubble,
              item.role === "user"
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.aiBubble,   { backgroundColor: colors.card, borderColor: colors.border }],
            ]}>
              <Text style={[
                styles.bubbleText,
                { color: item.role === "user" ? "#fff" : colors.foreground },
              ]}>
                {item.content}
              </Text>
            </View>
          )}
          ListFooterComponent={isLoading ? (
            <View style={[styles.aiBubble, styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.bubbleText, { color: colors.mutedForeground }]}>{t("ai_thinking")}</Text>
            </View>
          ) : null}
        />

        {/* Transaction confirmation card */}
        {pendingTransaction && (
          <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.primary + "60" }]}>
            <Feather name="plus-circle" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.confirmLabel, { color: colors.mutedForeground }]}>{t("ai_addConfirm")}</Text>
              <Text style={[styles.confirmDetail, { color: colors.foreground }]} numberOfLines={2}>
                {pendingTransaction.type === "income" ? "+" : "-"}{formatAmount(pendingTransaction.amount)} · {pendingTransaction.category}
                {pendingTransaction.description ? ` · ${pendingTransaction.description}` : ""}
              </Text>
            </View>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={confirmTransaction}
              >
                <Text style={[styles.confirmBtnText, { color: "#fff" }]}>{t("ai_addBtn")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={cancelTransaction}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>{t("ai_cancelBtn")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, {
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 8,
          backgroundColor: colors.background,
        }]}>
          <TextInput
            style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder={isRecording ? t("ai_recording") : t("ai_placeholder")}
            placeholderTextColor={isRecording ? colors.primary : colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!isLoading && !isRecording}
            multiline={false}
          />
          {Platform.OS === "web" && (
            <Pressable
              onPress={startVoiceRecording}
              style={[styles.iconBtn, {
                backgroundColor: isRecording ? colors.primary + "20" : colors.muted,
                borderColor: isRecording ? colors.primary : colors.border,
              }]}
            >
              <Feather
                name={isRecording ? "mic" : "mic"}
                size={20}
                color={isRecording ? colors.primary : colors.mutedForeground}
              />
            </Pressable>
          )}
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            style={[styles.sendBtn, {
              backgroundColor: input.trim() && !isLoading ? colors.primary : colors.muted,
            }]}
          >
            <Feather name="send" size={18} color={input.trim() && !isLoading ? "#fff" : colors.mutedForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  aiAvatar:    { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  closeBtn:    { padding: 6 },

  chatContent: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  bubble:      { maxWidth: "82%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble:  { alignSelf: "flex-end" },
  aiBubble:    { alignSelf: "flex-start", borderWidth: 1 },
  bubbleText:  { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },

  confirmCard:  { marginHorizontal: 12, marginBottom: 8, borderRadius: 16, borderWidth: 1.5, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  confirmLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 2 },
  confirmDetail:{ fontSize: 14, fontFamily: "Inter_600SemiBold" },
  confirmBtns:  { gap: 6, alignItems: "flex-end" },
  confirmBtn:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  confirmBtnText:{ fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  cancelBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  cancelBtnText:{ fontSize: 13, fontFamily: "Inter_500Medium" },

  inputBar:  { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1 },
  textInput: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontFamily: "Inter_400Regular" },
  iconBtn:   { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sendBtn:   { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
