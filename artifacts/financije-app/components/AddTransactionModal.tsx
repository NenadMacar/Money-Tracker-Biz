import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { TransactionType, useFinance } from "@/context/FinanceContext";

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export default function AddTransactionModal({
  visible,
  onClose,
  defaultType = "expense",
}: AddTransactionModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { categories, addTransaction, currency } = useFinance();

  const [type,             setType]             = useState<TransactionType>(defaultType);
  const [amount,           setAmount]           = useState("");
  const [description,      setDescription]      = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [date,             setDate]             = useState(new Date().toISOString().split("T")[0]);
  const [error,            setError]            = useState("");

  const filteredCats = categories.filter(c => c.type === type);

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setSelectedCategory("");
  }

  function handleSave() {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Unesite ispravan iznos");
      return;
    }
    if (!selectedCategory) {
      setError("Odaberite kategoriju");
      return;
    }
    if (!date) {
      setError("Odaberite datum");
      return;
    }
    setError("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTransaction({ type, amount: parseFloat(amount), category: selectedCategory, description, date });
    resetAndClose();
  }

  function resetAndClose() {
    setAmount(""); setDescription(""); setSelectedCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setError(""); setType(defaultType);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Platform.OS === "web" ? 67 : 16 }]}>
          <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Nova transakcija</Text>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Sačuvaj</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
            <Pressable
              style={[styles.typeBtn, type === "income" && { backgroundColor: colors.income }]}
              onPress={() => handleTypeChange("income")}
            >
              <Feather name="trending-up" size={16} color={type === "income" ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.typeBtnText, { color: type === "income" ? "#fff" : colors.mutedForeground }]}>
                Prihod
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeBtn, type === "expense" && { backgroundColor: colors.expense }]}
              onPress={() => handleTypeChange("expense")}
            >
              <Feather name="trending-down" size={16} color={type === "expense" ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.typeBtnText, { color: type === "expense" ? "#fff" : colors.mutedForeground }]}>
                Rashod
              </Text>
            </Pressable>
          </View>

          <View style={[styles.amountContainer, { borderBottomColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>
              {currency.symbol}
            </Text>
            <TextInput
              style={[styles.amountInput, { color: colors.foreground }]}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              testID="amount-input"
            />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATUM</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            value={date}
            onChangeText={setDate}
            testID="date-input"
          />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OPIS (opcionalno)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Dodaj opis..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            testID="description-input"
          />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>KATEGORIJA</Text>
          <View style={styles.categoriesGrid}>
            {filteredCats.map(cat => (
              <Pressable
                key={cat.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.name
                        ? type === "income" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"
                        : colors.card,
                    borderColor:
                      selectedCategory === cat.name
                        ? type === "income" ? colors.income : colors.expense
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.name)}
                testID={`category-${cat.name}`}
              >
                <Feather
                  name={cat.icon as any}
                  size={14}
                  color={
                    selectedCategory === cat.name
                      ? type === "income" ? colors.income : colors.expense
                      : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color:
                        selectedCategory === cat.name
                          ? type === "income" ? colors.income : colors.expense
                          : colors.foreground,
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn:       { padding: 6 },
  title:          { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText:    { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  content:        { padding: 20, gap: 8 },
  typeToggle:     { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 12 },
  typeBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  typeBtnText:    { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  amountContainer:{ flexDirection: "row", alignItems: "center", borderBottomWidth: 2, paddingBottom: 8, marginBottom: 20 },
  currencySymbol: { fontSize: 28, fontFamily: "Inter_400Regular", marginRight: 8 },
  amountInput:    { flex: 1, fontSize: 40, fontFamily: "Inter_700Bold" },
  sectionLabel:   { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  input:          { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 4 },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  catChip:        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  catChipText:    { fontSize: 13, fontFamily: "Inter_500Medium" },
  error:          { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 8, textAlign: "center" },
});
