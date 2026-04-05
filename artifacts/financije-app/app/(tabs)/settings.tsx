import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
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
import {
  CURRENCIES,
  Category,
  Currency,
  TransactionType,
  useFinance,
} from "@/context/FinanceContext";

const ICON_OPTIONS = [
  "shopping-bag", "briefcase", "trending-up", "home", "users", "zap",
  "bar-chart-2", "tool", "truck", "coffee", "plus-circle", "minus-circle",
  "star", "heart", "globe", "package",
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { categories, addCategory, deleteCategory, currency, setCurrency } = useFinance();

  const [catModalVisible,      setCatModalVisible]      = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [catName,   setCatName]   = useState("");
  const [catType,   setCatType]   = useState<TransactionType>("expense");
  const [catIcon,   setCatIcon]   = useState("shopping-bag");
  const [error,     setError]     = useState("");

  const incomeCategories  = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  function handleSaveCat() {
    if (!catName.trim()) { setError("Unesite naziv kategorije"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCategory({ name: catName.trim(), type: catType, icon: catIcon });
    setCatModalVisible(false);
    setCatName("");
    setError("");
  }

  function handleDeleteCat(cat: Category) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Obriši kategoriju", `Obrisati "${cat.name}"?`, [
      { text: "Odustani", style: "cancel" },
      { text: "Obriši", style: "destructive", onPress: () => deleteCategory(cat.id) },
    ]);
  }

  function handleSelectCurrency(c: Currency) {
    Haptics.selectionAsync();
    setCurrency(c);
    setCurrencyModalVisible(false);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function renderCategoryList(cats: Category[], label: string) {
    return (
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{label}</Text>
        {cats.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nema kategorija</Text>
        )}
        {cats.map(cat => (
          <View key={cat.id} style={[styles.catRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.catIconBg, { backgroundColor: cat.type === "income" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }]}>
              <Feather name={cat.icon as any} size={16} color={cat.type === "income" ? colors.income : colors.expense} />
            </View>
            <Text style={[styles.catName, { color: colors.foreground }]}>{cat.name}</Text>
            <TouchableOpacity onPress={() => handleDeleteCat(cat)} style={styles.deleteBtn} testID={`delete-category-${cat.name}`}>
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Postavke</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setCatModalVisible(true)}
          testID="add-category-btn"
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 }]}
      >
        {/* ── Currency Picker ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VALUTA</Text>
          <TouchableOpacity
            style={[styles.currencyRow, { borderColor: colors.border }]}
            onPress={() => setCurrencyModalVisible(true)}
            testID="currency-picker-btn"
            activeOpacity={0.7}
          >
            <View style={[styles.currencyBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.currencyBadgeText, { color: colors.primary }]}>
                {currency.symbol}
              </Text>
            </View>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyCode, { color: colors.foreground }]}>{currency.code}</Text>
              <Text style={[styles.currencyName, { color: colors.mutedForeground }]}>{currency.name}</Text>
            </View>
            <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {renderCategoryList(incomeCategories,  "KATEGORIJE PRIHODA")}
        {renderCategoryList(expenseCategories, "KATEGORIJE RASHODA")}
      </ScrollView>

      {/* ── Currency Selection Modal ── */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: Platform.OS === "web" ? 67 : 16 }]}>
            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Odaberi valutu</Text>
            <View style={{ width: 32 }} />
          </View>

          <FlatList
            data={CURRENCIES}
            keyExtractor={item => item.code}
            contentContainerStyle={styles.currencyList}
            renderItem={({ item }) => {
              const isSelected = item.code === currency.code;
              return (
                <TouchableOpacity
                  style={[
                    styles.currencyOption,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectCurrency(item)}
                  testID={`currency-option-${item.code}`}
                  activeOpacity={0.7}
                >
                  <View style={[styles.currencySymbolBox, { backgroundColor: isSelected ? colors.primary : colors.muted }]}>
                    <Text style={[styles.currencySymbolBoxText, { color: isSelected ? "#fff" : colors.mutedForeground }]}>
                      {item.symbol}
                    </Text>
                  </View>
                  <View style={styles.currencyOptionInfo}>
                    <Text style={[styles.currencyOptionCode, { color: colors.foreground }]}>{item.code}</Text>
                    <Text style={[styles.currencyOptionName, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* ── Add Category Modal ── */}
      <Modal
        visible={catModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCatModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: Platform.OS === "web" ? 67 : 16 }]}>
            <TouchableOpacity onPress={() => setCatModalVisible(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nova kategorija</Text>
            <TouchableOpacity onPress={handleSaveCat} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.saveBtnText, { color: "#fff" }]}>Sačuvaj</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>NAZIV</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Naziv kategorije..."
              placeholderTextColor={colors.mutedForeground}
              value={catName}
              onChangeText={setCatName}
              testID="category-name-input"
            />

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>TIP</Text>
            <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
              <Pressable
                style={[styles.typeBtn, catType === "income" && { backgroundColor: colors.income }]}
                onPress={() => setCatType("income")}
              >
                <Text style={[styles.typeBtnText, { color: catType === "income" ? "#fff" : colors.mutedForeground }]}>Prihod</Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, catType === "expense" && { backgroundColor: colors.expense }]}
                onPress={() => setCatType("expense")}
              >
                <Text style={[styles.typeBtnText, { color: catType === "expense" ? "#fff" : colors.mutedForeground }]}>Rashod</Text>
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>IKONA</Text>
            <View style={styles.iconsGrid}>
              {ICON_OPTIONS.map(icon => (
                <Pressable
                  key={icon}
                  onPress={() => setCatIcon(icon)}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: catIcon === icon ? colors.accent : colors.card,
                      borderColor: catIcon === icon ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather name={icon as any} size={20} color={catIcon === icon ? colors.primary : colors.mutedForeground} />
                </Pressable>
              ))}
            </View>

            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title:   { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn:  { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 4 },

  section:      { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, gap: 4 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8 },

  currencyRow:   { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  currencyBadge: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  currencyBadgeText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  currencyInfo:  { flex: 1 },
  currencyCode:  { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  currencyName:  { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },

  catRow:    { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  catIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catName:   { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  deleteBtn: { padding: 6 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 8 },

  modalContainer: { flex: 1 },
  modalHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  modalTitle:     { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText:    { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalContent:   { padding: 20, gap: 6 },

  currencyList:       { padding: 16, gap: 8 },
  currencyOption:     { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  currencySymbolBox:  { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  currencySymbolBoxText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  currencyOptionInfo: { flex: 1 },
  currencyOptionCode: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  currencyOptionName: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },

  inputLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  input:      { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  typeToggle: { flexDirection: "row", borderRadius: 10, padding: 3 },
  typeBtn:    { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  typeBtnText:{ fontSize: 14, fontFamily: "Inter_600SemiBold" },
  iconsGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  iconOption: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  error:      { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 8, textAlign: "center" },
});
